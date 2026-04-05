import { getSceneSpeechSegments } from './scene-text.js';

const ALLOWED = new Set(['narrator', 'woman', 'woman_alt', 'child', 'warrior', 'man', 'elder']);

let speaking = false;
let onSpeakingChange = null;
let speakToken = 0;

/** Persistent speaker → SpeechSynthesisVoice map; survives across scenes, cleared on story reset. */
const voiceAssignments = new Map();

export function clearVoiceAssignments() {
  voiceAssignments.clear();
}

export function setOnSpeakingChange(fn) {
  onSpeakingChange = typeof fn === 'function' ? fn : null;
}

function notifySpeaking(v) {
  speaking = v;
  if (onSpeakingChange) onSpeakingChange(v);
}

function normalizeProfile(p) {
  const s = String(p || 'narrator')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
  if (s === 'female') return 'woman';
  if (s === 'male') return 'man';
  return ALLOWED.has(s) ? s : 'narrator';
}

function voiceKey(v) {
  return `${v.name} ${v.voiceURI || ''}`.toLowerCase();
}

const _normLang = v => (v.lang || '').toLowerCase().replace('_', '-');

/** All usable English voices (excludes en-IN to avoid strong accent mismatch). */
function getAllEnglishVoices(all) {
  if (!all.length) return all;
  const en = all.filter(v => {
    const l = _normLang(v);
    return l.startsWith('en') && !l.startsWith('en-in');
  });
  return en.length ? en : all;
}

/** Best British / RP-adjacent voice for the narrator. Falls back gracefully. */
function pickNarratorVoice(all) {
  const gb = all.filter(v => {
    const l = _normLang(v);
    return l === 'en-gb' || l.startsWith('en-gb-');
  });
  if (gb.length) return gb;
  const ukMeta = all.filter(v =>
    /united kingdom|british english|\(uk\)|uk english|england|english \(united kingdom\)|microsoft sonia|microsoft ryan|microsoft thomas|microsoft libby|microsoft maisie|microsoft ethan|microsoft alfie|microsoft ollie/i.test(
      voiceKey(v)
    )
  );
  if (ukMeta.length) return ukMeta;
  return all;
}

function isClearlyFemaleVoice(v) {
  const g = v.gender;
  if (g === 'female') return true;
  if (g === 'male') return false;
  const k = voiceKey(v);
  return (
    /\b(female|woman)\b/i.test(k) ||
    /zira|jenny|aria|samantha|karen|hazel|susan|linda|victoria|lisa|serena|sonia|fiona|michelle|joanna|amy|emma|natalie|catherine|tessa|hannah|sarah|olivia|ivy|nicole|heather|lesley|shelley|veena|kalpana|saarika|neerja|allison|ava|sophie|isabella|mia|chloe|female/i.test(
      k
    )
  );
}

function isClearlyMaleVoice(v) {
  const g = v.gender;
  if (g === 'male') return true;
  if (g === 'female') return false;
  const k = voiceKey(v);
  return (
    /\bmale\b/i.test(k) ||
    /david|mark|george|fred|rishi|ryan|brian|james|thomas|oliver|guy|daniel|christopher|richard|steven|eric|jason|tony|andrew|paul|robert|william|joe|henry|arthur|bruce|ste|steve|male/i.test(
      k
    )
  );
}

function bucketVoices(voices) {
  const female = [];
  const male = [];
  const rest = [];
  for (const v of voices) {
    if (isClearlyFemaleVoice(v) && !isClearlyMaleVoice(v)) female.push(v);
    else if (isClearlyMaleVoice(v) && !isClearlyFemaleVoice(v)) male.push(v);
    else rest.push(v);
  }
  return { female, male, rest };
}

function stableSlot(key, mod) {
  let h = 0;
  const s = String(key);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % Math.max(mod, 1);
}

function findCharacter(speaker, characters) {
  const raw = String(speaker || '').trim();
  const base = raw
    .replace(/\s*[—–-]\s*.*$/, '')
    .split(/,/)[0]
    .trim();
  const b = base.toLowerCase();
  return (characters || []).find(c => {
    if (!c || !c.name) return false;
    const n = c.name.toLowerCase();
    return n === b || b === n || b.startsWith(n + ' ') || n.startsWith(b + ' ') || b.includes(n) || n.includes(b);
  });
}

function inferGenderFromText(t) {
  const s = String(t || '').toLowerCase();
  const femaleHints =
    /\b(she|her\b|hers|herself|woman|lady|girl|mother|daughter|sister|queen|princess|priestess|matron|female|wife|bride|maiden|witch|dame)\b/.test(
      s
    );
  const maleHints =
    /\b(he|him\b|his\b|himself|man\b|lord|sir|king|prince|father|son|brother|knight|male|husband|baron|duke|wizard\s+lord)\b/.test(
      s
    );
  if (femaleHints && !maleHints) return 'female';
  if (maleHints && !femaleHints) return 'male';
  return 'neutral';
}

function inferProfileFromGender(gender, speakerKey) {
  if (gender === 'female') {
    return stableSlot(speakerKey, 2) === 0 ? 'woman' : 'woman_alt';
  }
  if (gender === 'male') return 'man';
  return 'narrator';
}

function profileForSpeaker(speaker, characters) {
  const raw = String(speaker || '').trim();
  if (/^you\b/i.test(raw)) return 'narrator';

  const c = findCharacter(speaker, characters);
  const fromProfile = normalizeProfile(c && c.voiceProfile);
  if (fromProfile !== 'narrator') return fromProfile;

  const gRaw = c && c.gender ? String(c.gender).toLowerCase().trim() : '';
  if (gRaw === 'female' || gRaw === 'f') return inferProfileFromGender('female', c.name || speaker);
  if (gRaw === 'male' || gRaw === 'm') return inferProfileFromGender('male', c.name || speaker);

  const blob = [c && c.personality, c && c.description].filter(Boolean).join(' ');
  const inferred = inferGenderFromText(blob);
  if (inferred !== 'neutral') return inferProfileFromGender(inferred, c ? c.name : speaker);

  return 'narrator';
}

function pickVoiceForProfile(profile, speaker, voices) {
  const { female, male, rest } = bucketVoices(voices);
  const idx = stableSlot(speaker, 997);
  const all = voices.length ? voices : [];

  function firstFemale() {
    if (female.length) return female[idx % female.length];
    const fromRest = rest.filter(isClearlyFemaleVoice);
    if (fromRest.length) return fromRest[idx % fromRest.length];
    const notMale = all.filter(v => !isClearlyMaleVoice(v));
    if (notMale.length) return notMale[idx % notMale.length];
    return null;
  }

  function firstMale() {
    if (male.length) return male[idx % male.length];
    const fromRest = rest.filter(isClearlyMaleVoice);
    if (fromRest.length) return fromRest[idx % fromRest.length];
    const notFemale = all.filter(v => !isClearlyFemaleVoice(v));
    if (notFemale.length) return notFemale[idx % notFemale.length];
    return all[0] || null;
  }

  switch (profile) {
    case 'woman':
      return firstFemale() || all[0] || null;
    case 'woman_alt': {
      const pool = female.length >= 2 ? female : female.length ? female : all;
      return pool[(idx + 1) % pool.length] || firstFemale() || all[0] || null;
    }
    case 'child':
      return firstFemale() || firstMale() || all[0] || null;
    case 'man':
    case 'warrior':
    case 'elder':
      return firstMale() || all[0] || null;
    case 'narrator':
    default: {
      const neut = rest.length ? rest[idx % rest.length] : all[idx % all.length];
      return neut || all[0] || null;
    }
  }
}

function speakerKey(speaker) {
  return speaker ? speaker.toLowerCase().trim().replace(/\s+/g, ' ') : '__narrator__';
}

/**
 * Return the cached voice for a speaker, or pick + cache one.
 * Tries to avoid reusing a voice already assigned to another speaker
 * so each character sounds distinct.
 */
function getOrAssignVoice(speaker, profile, voices) {
  const key = speakerKey(speaker);
  if (voiceAssignments.has(key)) return voiceAssignments.get(key);

  const usedURIs = new Set();
  for (const v of voiceAssignments.values()) {
    if (v && v.voiceURI) usedURIs.add(v.voiceURI);
  }
  const available = voices.filter(v => !usedURIs.has(v.voiceURI));
  const pool = available.length ? available : voices;

  const voice = pickVoiceForProfile(profile, speaker || 'narrator', pool);
  if (voice) voiceAssignments.set(key, voice);
  return voice;
}

function voiceSoundsMale(v, profile) {
  if (!v || profile === 'narrator') return false;
  if (profile === 'woman' || profile === 'woman_alt' || profile === 'child') {
    return isClearlyMaleVoice(v) && !isClearlyFemaleVoice(v);
  }
  return false;
}

function applyProsody(utt, profile, extraPitch = 0) {
  let base = 1;
  let rate = 0.95;
  switch (profile) {
    case 'child':
      base = 1.45;
      rate = 1.12;
      break;
    case 'warrior':
      base = 0.72;
      rate = 0.88;
      break;
    case 'elder':
      base = 0.78;
      rate = 0.78;
      break;
    case 'woman':
      base = 1.25;
      rate = 1.02;
      break;
    case 'woman_alt':
      base = 1.35;
      rate = 0.96;
      break;
    case 'man':
      base = 0.82;
      rate = 0.94;
      break;
    case 'narrator':
    default:
      base = 1;
      rate = 0.95;
  }
  utt.pitch = Math.min(2, Math.max(0.5, base + extraPitch));
  utt.rate = Math.min(1.35, Math.max(0.65, rate));
}

/**
 * Keep `lang` aligned with `voice` — forcing en-GB on an en-US voice
 * silences speech on Chrome/Edge. Light dampening only for narrator;
 * character voices keep their full prosody separation.
 */
function applyBridgertonDelivery(utt, voice, isNarrator) {
  if (voice && voice.lang) {
    utt.lang = voice.lang;
  }
  if (isNarrator) {
    utt.rate = Math.max(0.72, Math.min(1.08, utt.rate * 0.92));
    utt.pitch = Math.min(1.85, Math.max(0.82, utt.pitch * 0.98));
  }
}

function waitForVoices(timeoutMs = 2800) {
  return new Promise(resolve => {
    if (typeof speechSynthesis === 'undefined') {
      resolve();
      return;
    }
    if (speechSynthesis.getVoices().length) {
      resolve();
      return;
    }
    const t = setTimeout(resolve, timeoutMs);
    speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true }
    );
  });
}

export function stopSpeech() {
  speakToken++;
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  notifySpeaking(false);
}

export function isSpeaking() {
  return speaking;
}

/**
 * Normalize model-provided speechSegments into the same shape
 * that getSceneSpeechSegments returns.
 */
function normalizeModelSegments(raw) {
  if (!Array.isArray(raw) || !raw.length) return null;
  const out = [];
  for (const s of raw) {
    if (!s || !s.text) continue;
    const t = String(s.text).trim();
    if (!t) continue;
    if (s.type === 'dlg' && s.speaker) {
      const seg = { type: 'dlg', speaker: String(s.speaker).trim(), text: t };
      if (s.voiceProfile) seg.voiceProfile = normalizeProfile(s.voiceProfile);
      out.push(seg);
    } else {
      out.push({ type: 'narr', text: t });
    }
  }
  return out.length ? out : null;
}

/**
 * @param {string|object} sceneOrData  raw scene text OR full scene data object
 *        (with .scene, .speechSegments, etc.)
 * @param {Array} characters  character list from state
 */
export async function speakScene(sceneOrData, characters) {
  if (typeof speechSynthesis === 'undefined') return;

  const isObj = sceneOrData && typeof sceneOrData === 'object' && !Array.isArray(sceneOrData);
  const sceneText = isObj ? sceneOrData.scene : sceneOrData;
  const modelSegs = isObj ? sceneOrData.speechSegments : undefined;

  if (!sceneText) return;
  stopSpeech();
  const token = speakToken;
  await waitForVoices();
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.getVoices();
  if (token !== speakToken) return;
  const rawVoices = speechSynthesis.getVoices();
  const allEnglish = getAllEnglishVoices(rawVoices);
  const narratorPool = pickNarratorVoice(allEnglish);

  const segments = normalizeModelSegments(modelSegs) || getSceneSpeechSegments(sceneText);
  if (!segments.length) return;

  const source = modelSegs && normalizeModelSegments(modelSegs) ? 'model' : 'regex';
  console.log(`[TTS] source: ${source} | segments: ${segments.length}`,
    `| voices: ${allEnglish.length} (narrator pool: ${narratorPool.length})`);

  let i = 0;
  notifySpeaking(true);

  function speakNext() {
    if (token !== speakToken) return;
    if (i >= segments.length) {
      notifySpeaking(false);
      return;
    }
    const seg = segments[i++];
    const isNarr = seg.type !== 'dlg';
    const utt = new SpeechSynthesisUtterance(seg.text);
    const profile = isNarr
      ? 'narrator'
      : (seg.voiceProfile && seg.voiceProfile !== 'narrator')
        ? seg.voiceProfile
        : profileForSpeaker(seg.speaker, characters);
    const v = isNarr
      ? getOrAssignVoice(null, 'narrator', narratorPool)
      : getOrAssignVoice(seg.speaker, profile, allEnglish);

    let extraPitch = 0;
    if (v && !isNarr && voiceSoundsMale(v, profile)) {
      extraPitch = profile === 'child' ? 0.22 : 0.28;
    }

    applyProsody(utt, profile, extraPitch);
    if (v) utt.voice = v;
    applyBridgertonDelivery(utt, v, isNarr);

    console.log('[TTS]', isNarr ? 'NARR' : `DLG [${seg.speaker}]`,
      '→ profile:', profile, '| voice:', v?.name || '(none)',
      '| pitch:', utt.pitch.toFixed(2), '| rate:', utt.rate.toFixed(2));

    utt.onend = speakNext;
    utt.onerror = speakNext;
    speechSynthesis.speak(utt);
  }

  speakNext();
}

import { getSceneSpeechSegments } from './scene-text.js';

const ALLOWED = new Set(['narrator', 'woman', 'woman_alt', 'child', 'warrior', 'man', 'elder']);

let speaking = false;
let onSpeakingChange = null;
let speakToken = 0;

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

/** Prefer British English (RP-adjacent) voices — Bridgerton-style read-aloud, not random regional accents. */
function selectBridgertonVoicePool(all) {
  if (!all.length) return all;
  const normLang = v => (v.lang || '').toLowerCase().replace('_', '-');
  const gb = all.filter(v => {
    const l = normLang(v);
    return l === 'en-gb' || l.startsWith('en-gb-');
  });
  if (gb.length >= 1) return gb;
  const ukMeta = all.filter(v =>
    /united kingdom|british english|\(uk\)|uk english|england|english \(united kingdom\)|microsoft sonia|microsoft ryan|microsoft thomas|microsoft libby|microsoft maisie|microsoft ethan|microsoft alfie|microsoft ollie/i.test(
      voiceKey(v)
    )
  );
  if (ukMeta.length) return ukMeta;
  const au = all.filter(v => normLang(v).startsWith('en-au'));
  if (au.length) return au;
  const en = all.filter(v => {
    const l = normLang(v);
    return l.startsWith('en') && !l.startsWith('en-in');
  });
  return en.length ? en : all;
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

function voiceSoundsMale(v, profile) {
  if (!v || profile === 'narrator') return false;
  if (profile === 'woman' || profile === 'woman_alt' || profile === 'child') {
    return isClearlyMaleVoice(v) && !isClearlyFemaleVoice(v);
  }
  return false;
}

function applyProsody(utt, profile, extraPitch = 0) {
  let base = 1;
  let rate = 0.98;
  switch (profile) {
    case 'child':
      base = 1.22;
      rate = 1.05;
      break;
    case 'warrior':
      base = 0.88;
      rate = 0.94;
      break;
    case 'elder':
      base = 0.9;
      rate = 0.86;
      break;
    case 'woman':
      base = 1.1;
      rate = 1;
      break;
    case 'woman_alt':
      base = 1.14;
      rate = 0.98;
      break;
    case 'man':
      base = 0.94;
      rate = 0.98;
      break;
    case 'narrator':
    default:
      base = 1;
      rate = 0.98;
  }
  utt.pitch = Math.min(2, Math.max(0.5, base + extraPitch));
  utt.rate = Math.min(1.35, Math.max(0.65, rate));
}

/**
 * Slightly slower, measured delivery. **Must** keep `lang` aligned with `voice` —
 * forcing en-GB on an en-US voice silences speech on Chrome/Edge.
 */
function applyBridgertonDelivery(utt, voice) {
  if (voice && voice.lang) {
    utt.lang = voice.lang;
  }
  utt.rate = Math.max(0.72, Math.min(1.08, utt.rate * 0.92));
  utt.pitch = Math.min(1.85, Math.max(0.82, utt.pitch * 0.98));
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

export async function speakScene(sceneText, characters) {
  if (typeof speechSynthesis === 'undefined' || !sceneText) return;
  stopSpeech();
  const token = speakToken;
  await waitForVoices();
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.getVoices();
  if (token !== speakToken) return;
  const rawVoices = speechSynthesis.getVoices();
  const voices = selectBridgertonVoicePool(rawVoices);
  const segments = getSceneSpeechSegments(sceneText);
  if (!segments.length) return;

  let i = 0;
  notifySpeaking(true);

  function speakNext() {
    if (token !== speakToken) return;
    if (i >= segments.length) {
      notifySpeaking(false);
      return;
    }
    const seg = segments[i++];
    const utt = new SpeechSynthesisUtterance(seg.text);
    const profile =
      seg.type === 'dlg' ? profileForSpeaker(seg.speaker, characters) : 'narrator';
    const v =
      seg.type === 'dlg'
        ? pickVoiceForProfile(profile, seg.speaker || 'npc', voices)
        : pickVoiceForProfile('narrator', 'narrator', voices);

    let extraPitch = 0;
    if (v && seg.type === 'dlg' && voiceSoundsMale(v, profile)) {
      extraPitch = profile === 'child' ? 0.18 : 0.22;
    }

    applyProsody(utt, profile, extraPitch);
    if (v) utt.voice = v;
    applyBridgertonDelivery(utt, v);
    utt.onend = speakNext;
    utt.onerror = speakNext;
    speechSynthesis.speak(utt);
  }

  speakNext();
}

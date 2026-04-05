// voice.js — distinct character voices using Web Speech API

// ── Voice profiles per character archetype ─────────────────────────────────
const VOICE_PROFILES = {
  warrior:     { pitch: 0.6,  rate: 0.85, volume: 1.0 },  // deep, slow, commanding
  lady:        { pitch: 1.6,  rate: 0.9,  volume: 0.85 }, // high, soft, gentle
  child:       { pitch: 1.9,  rate: 1.2,  volume: 0.9 },  // high, fast, bright
  villain:     { pitch: 0.5,  rate: 0.75, volume: 1.0 },  // very deep, slow, menacing
  scholar:     { pitch: 1.1,  rate: 1.0,  volume: 0.8 },  // mid, measured, clear
  narrator:    { pitch: 0.8,  rate: 0.82, volume: 1.0 },  // deep, cinematic
  mysterious:  { pitch: 0.9,  rate: 0.7,  volume: 0.75 }, // slow, hushed, eerie
  elder:       { pitch: 0.7,  rate: 0.78, volume: 0.85 }, // deep, slow, wise
  default:     { pitch: 1.0,  rate: 0.9,  volume: 0.9  }
};

// ── Detect archetype from character description ────────────────────────────
function detectArchetype(name, description) {
  const text = ((name || '') + ' ' + (description || '')).toLowerCase();

  if (/warrior|knight|soldier|fighter|guard|brute|orc|dwarf|captain/i.test(text)) return 'warrior';
  if (/child|kid|boy|girl|young|little|small|infant/i.test(text))                  return 'child';
  if (/villain|dark|evil|sinister|shadow|demon|witch|sorcerer/i.test(text))        return 'villain';
  if (/elder|old|ancient|wise|sage|grandmother|grandfather/i.test(text))           return 'elder';
  if (/scholar|mage|wizard|professor|doctor|scientist|librarian/i.test(text))     return 'scholar';
  if (/mysterious|hooded|cloaked|unknown|stranger/i.test(text))                   return 'mysterious';
  if (/woman|lady|girl|queen|princess|duchess|elf.*fem|female/i.test(text))       return 'lady';

  return 'default';
}

// ── Voice cache — store detected archetype per character name ──────────────
const _voiceCache = {};

function getProfileForCharacter(name, description) {
  if (!_voiceCache[name]) {
    _voiceCache[name] = detectArchetype(name, description);
  }
  return VOICE_PROFILES[_voiceCache[name]] || VOICE_PROFILES.default;
}

// ── Get best available voice from browser ─────────────────────────────────
function pickVoice(wantFemale) {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  if (wantFemale) {
    return voices.find(v => /female|woman|zira|samantha|victoria|karen|moira|tessa|fiona/i.test(v.name))
      || voices.find(v => v.lang === 'en-US' && v.name.includes('f'))
      || voices.find(v => v.lang === 'en-GB')
      || voices[0];
  } else {
    return voices.find(v => /male|man|daniel|david|alex|fred|ralph|thomas/i.test(v.name))
      || voices.find(v => v.lang === 'en-US')
      || voices[0];
  }
}

function isFemaleArchetype(archetype) {
  return ['lady'].includes(archetype);
}

// ── Core speak function ────────────────────────────────────────────────────
let _currentUtterance = null;

function speakAs(text, characterName, characterDescription) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const archetype = characterName
    ? detectArchetype(characterName, characterDescription || '')
    : 'narrator';
  const profile   = VOICE_PROFILES[archetype] || VOICE_PROFILES.default;
  const female    = isFemaleArchetype(archetype);

  const utt = new SpeechSynthesisUtterance(text);
  utt.pitch  = profile.pitch;
  utt.rate   = profile.rate;
  utt.volume = profile.volume;

  const go = () => {
    const voice = pickVoice(female);
    if (voice) utt.voice = voice;
    window.speechSynthesis.speak(utt);
    _currentUtterance = utt;
  };

  window.speechSynthesis.getVoices().length
    ? go()
    : (window.speechSynthesis.onvoiceschanged = go);
}

function stopVoice() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ── Parse dialogue from scene text ────────────────────────────────────────
// Looks for patterns like: "Hello," said Elena. OR Elena: "Hello there."
function parseDialogue(sceneText, characters) {
  if (!sceneText || !characters?.length) return null;

  // Try to match "CharacterName: dialogue" or "said CharacterName"
  for (const char of characters) {
    if (!char.name || char.name === 'You') continue;
    const nameEsc = char.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Pattern: Name said "..." or "..." said Name
    const patterns = [
      new RegExp(`${nameEsc}[^"]*"([^"]+)"`, 'i'),
      new RegExp(`"([^"]+)"[^"]*${nameEsc}`, 'i'),
      new RegExp(`${nameEsc}:\\s*"([^"]+)"`, 'i'),
    ];

    for (const pat of patterns) {
      const match = sceneText.match(pat);
      if (match) return { speaker: char, text: match[1] };
    }
  }
  return null;
}

// ── Main entry: speak a scene ──────────────────────────────────────────────
// Called from renderScene — narrates then speaks any detected dialogue
function speakScene(sceneText, characters) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  const dialogue = parseDialogue(sceneText, characters);

  if (dialogue) {
    // Speak narration first, then the character's dialogue
    const narrationOnly = sceneText.replace(`"${dialogue.text}"`, '').trim();

    const narr = new SpeechSynthesisUtterance(narrationOnly);
    applyProfile(narr, 'narrator', false);

    const charUtt = new SpeechSynthesisUtterance(dialogue.text);
    const arch = detectArchetype(dialogue.speaker.name, dialogue.speaker.description || '');
    applyProfile(charUtt, arch, isFemaleArchetype(arch));

    const go = () => {
      const narratorVoice = pickVoice(false);
      const charVoice     = pickVoice(isFemaleArchetype(arch));
      if (narratorVoice) narr.voice = narratorVoice;
      if (charVoice)     charUtt.voice = charVoice;
      window.speechSynthesis.speak(narr);
      window.speechSynthesis.speak(charUtt);
    };

    window.speechSynthesis.getVoices().length
      ? go()
      : (window.speechSynthesis.onvoiceschanged = go);
  } else {
    // No detected dialogue — just narrate the whole scene
    speakAs(sceneText, null, null);
  }
}

function applyProfile(utt, archetype, female) {
  const p = VOICE_PROFILES[archetype] || VOICE_PROFILES.default;
  utt.pitch = p.pitch; utt.rate = p.rate; utt.volume = p.volume;
  const voice = pickVoice(female);
  if (voice) utt.voice = voice;
}

// ── Voice control UI (mute button) ────────────────────────────────────────
let _voiceMuted = false;

function initVoiceControls() {
  document.getElementById('voice-btn')?.remove();
  const btn = document.createElement('button');
  btn.id = 'voice-btn';
  btn.className = 'btn-icon';
  btn.innerHTML = '🔊 Voice';
  btn.onclick = () => {
    _voiceMuted = !_voiceMuted;
    btn.innerHTML = _voiceMuted ? '🔇 Muted' : '🔊 Voice';
    btn.style.color = _voiceMuted ? 'var(--danger)' : '';
    if (_voiceMuted) stopVoice();
  };
  document.querySelector('.topbar-actions')?.prepend(btn);
}

// Public entry point — call this from renderScene
function narrateScene(sceneText, characters) {
  if (_voiceMuted) return;
  speakScene(sceneText, characters);
}
/**
 * Real MP3 ambient only — never feed a 404 HTML page into <audio> (that decodes as harsh digital noise).
 *
 * Picks `audio/ambient-piano.mp3` only after a successful HEAD check; otherwise loads a gentle solo-piano track.
 *
 * Kevin MacLeod — "Meditation Impromptu 03" (CC BY 4.0)
 * https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100168
 *
 * Playback must start inside a user gesture.
 */

const REMOTE_PIANO_AMBIENT =
  'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2003.mp3';

const BASE_VOLUME = 0.16;

const EMOTION_RATE = {
  calm: 1,
  romance: 1.01,
  happy: 1.03,
  adventure: 0.99,
  tension: 0.96,
  danger: 0.93
};

let audio = null;
let srcLocked = '';
let running = false;
let queued = { emotion: 'calm', enabled: true };

async function resolveAmbientSrc() {
  const local = new URL('audio/ambient-piano.mp3', window.location.href).href;
  try {
    const r = await fetch(local, { method: 'HEAD', cache: 'no-store' });
    if (r.ok) return local;
  } catch (_) {
    /* offline or CORS — use remote */
  }
  return REMOTE_PIANO_AMBIENT;
}

async function ensureAudio() {
  if (audio && srcLocked) return;
  const src = await resolveAmbientSrc();
  if (!audio) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
  }
  audio.src = src;
  srcLocked = src;
}

function applyQueued() {
  if (!audio || !running) return;
  const rate = EMOTION_RATE[queued.emotion] ?? EMOTION_RATE.calm;
  audio.playbackRate = rate;
  if (queued.enabled) {
    audio.volume = BASE_VOLUME;
    void audio.play().catch(() => {});
  } else {
    audio.volume = 0;
    audio.pause();
  }
}

export async function activateAmbientOnUserGesture() {
  await ensureAudio();
  running = true;
  applyQueued();
  if (queued.enabled && audio) {
    void audio.play().catch(() => {});
  }
}

export function setAmbientForEmotion(emotion, enabled) {
  queued = { emotion: emotion || 'calm', enabled: !!enabled };
  applyQueued();
}

export function stopAmbient() {
  queued = { ...queued, enabled: false };
  if (!audio) return;
  audio.volume = 0;
  audio.pause();
}

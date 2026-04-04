/**
 * Light procedural pad; frequencies follow scene emotion.
 * WebAudio must be started/resumed inside a user gesture — not after fetch() — or browsers keep it silent.
 */

const EMOTION_PAIRS = {
  calm: [174, 261],
  romance: [196, 311],
  happy: [220, 330],
  adventure: [165, 247],
  tension: [131, 196],
  danger: [98, 147]
};

let ctx = null;
let master = null;
let o1 = null;
let o2 = null;
let g1 = null;
let g2 = null;
/** True only after a successful resume() from user input */
let running = false;

let queued = { emotion: 'calm', enabled: true };

function buildEngine() {
  const AC =
    typeof AudioContext !== 'undefined'
      ? AudioContext
      : typeof webkitAudioContext !== 'undefined'
        ? webkitAudioContext
        : null;
  if (!AC || ctx) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  o1 = ctx.createOscillator();
  o2 = ctx.createOscillator();
  o1.type = 'triangle';
  o2.type = 'triangle';
  g1 = ctx.createGain();
  g2 = ctx.createGain();
  g1.gain.value = 0.55;
  g2.gain.value = 0.5;
  o1.connect(g1);
  o2.connect(g2);
  g1.connect(master);
  g2.connect(master);
  o1.start();
  o2.start();
}

function applyQueued() {
  if (!ctx || !master || !o1 || !o2 || !running) return;
  const t = ctx.currentTime;
  const pair = EMOTION_PAIRS[queued.emotion] || EMOTION_PAIRS.calm;
  o1.frequency.cancelScheduledValues(t);
  o2.frequency.cancelScheduledValues(t);
  o1.frequency.setValueAtTime(o1.frequency.value, t);
  o2.frequency.setValueAtTime(o2.frequency.value, t);
  o1.frequency.linearRampToValueAtTime(pair[0], t + 0.5);
  o2.frequency.linearRampToValueAtTime(pair[1], t + 0.5);

  master.gain.cancelScheduledValues(t);
  const target = queued.enabled ? 0.12 : 0;
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(target, t + 0.35);
}

/**
 * Call from click / pointerdown on the story UI. Required before any sound is audible.
 */
export function activateAmbientOnUserGesture() {
  buildEngine();
  if (!ctx) return Promise.resolve();
  if (ctx.state === 'suspended') {
    return ctx.resume().then(() => {
      running = true;
      applyQueued();
    });
  }
  running = true;
  applyQueued();
  return Promise.resolve();
}

/** Update mood target; applies immediately only after activateAmbientOnUserGesture() has run. */
export function setAmbientForEmotion(emotion, enabled) {
  queued = { emotion: emotion || 'calm', enabled: !!enabled };
  applyQueued();
}

export function stopAmbient() {
  queued = { ...queued, enabled: false };
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(0, t + 0.12);
}

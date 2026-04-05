/**
 * Ambient piano — gentle arpeggio chords, emotion-driven.
 * Uses WebAudio piano envelope (fast attack, long decay) + reverb tail.
 * Must be activated from a user gesture (browser autoplay policy).
 */

// Note frequencies (Hz) — octave 4/5
const NOTE = {
  C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00,
  A4:440.00, B4:493.88, C5:523.25, D5:587.33, E5:659.25,
  F5:698.46, G5:783.99, A3:220.00, E3:164.81, G3:196.00,
  B3:246.94, A5:880.00
};

// Chord voicings per emotion — arpeggiated slowly
const CHORDS = {
  calm:      [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.G4, NOTE.A4],
  romance:   [NOTE.F4, NOTE.A4, NOTE.C5, NOTE.E5],
  happy:     [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.B4, NOTE.C5],
  adventure: [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.G4, NOTE.B4],
  tension:   [NOTE.D4, NOTE.F4, NOTE.A4, NOTE.C5],
  danger:    [NOTE.A3, NOTE.E4, NOTE.G4, NOTE.C5]
};

let ctx = null;
let master = null;
let reverb = null;
let running = false;
let loopTimer = null;
let currentEmotion = 'calm';
let enabled = true;

function getAC() {
  if (typeof AudioContext !== 'undefined') return AudioContext;
  if (typeof webkitAudioContext !== 'undefined') return webkitAudioContext;
  return null;
}

/** Impulse response for a small room reverb */
function makeReverb(audioCtx, duration = 1.8, decay = 2.0) {
  const rate = audioCtx.sampleRate;
  const length = rate * duration;
  const impulse = audioCtx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  const conv = audioCtx.createConvolver();
  conv.buffer = impulse;
  return conv;
}

/** Play a single piano-like note */
function playNote(freq, startTime, velocity = 0.55) {
  if (!ctx || !master) return;

  // Fundamental sine
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = freq;

  // Soft harmonic (2nd partial, very quiet)
  const osc2 = ctx.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2;

  // ADSR envelope — fast attack, long piano decay
  const env = ctx.createGain();
  env.gain.setValueAtTime(0, startTime);
  env.gain.linearRampToValueAtTime(velocity, startTime + 0.008);      // 8ms attack
  env.gain.exponentialRampToValueAtTime(velocity * 0.35, startTime + 0.18); // decay
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2);    // long release

  const env2 = ctx.createGain();
  env2.gain.setValueAtTime(0, startTime);
  env2.gain.linearRampToValueAtTime(velocity * 0.08, startTime + 0.008);
  env2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);

  osc.connect(env);
  osc2.connect(env2);
  if (reverb) {
    env.connect(reverb);
    env2.connect(reverb);
  }
  env.connect(master);
  env2.connect(master);

  osc.start(startTime);
  osc.stop(startTime + 2.4);
  osc2.start(startTime);
  osc2.stop(startTime + 0.7);
}

/** Schedule one full arpeggio chord loop */
function scheduleChord() {
  if (!ctx || !running || !enabled) return;

  const notes = CHORDS[currentEmotion] || CHORDS.calm;
  const now = ctx.currentTime + 0.05;
  const spacing = 0.42; // seconds between each note
  const vel = 0.38 + Math.random() * 0.12; // slight velocity variation

  notes.forEach((freq, i) => {
    playNote(freq, now + i * spacing, vel * (i === 0 ? 0.8 : 1));
  });

  // Occasionally add a high note echo
  if (Math.random() > 0.55) {
    const echo = notes[Math.floor(Math.random() * notes.length)];
    playNote(echo * 2, now + notes.length * spacing + 0.3, vel * 0.22);
  }

  // Next loop — random gap between 5 and 9 seconds for organic feel
  const gap = 5000 + Math.random() * 4000;
  loopTimer = setTimeout(scheduleChord, gap);
}

function buildEngine() {
  const AC = getAC();
  if (!AC || ctx) return;
  ctx = new AC();

  master = ctx.createGain();
  master.gain.value = 0;

  // Compressor to keep it gentle and even
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -24;
  comp.knee.value = 12;
  comp.ratio.value = 4;
  comp.attack.value = 0.05;
  comp.release.value = 0.4;

  reverb = makeReverb(ctx);
  reverb.connect(comp);
  master.connect(comp);
  comp.connect(ctx.destination);
}

function startLoop() {
  if (loopTimer) return;
  scheduleChord();
}

function stopLoop() {
  if (loopTimer) { clearTimeout(loopTimer); loopTimer = null; }
}

function fademaster(target, duration = 1.5) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(target, t + duration);
}

export function activateAmbientOnUserGesture() {
  buildEngine();
  if (!ctx) return Promise.resolve();
  const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
  return resume.then(() => {
    running = true;
    if (enabled) {
      fademaster(0.72, 2.5);
      startLoop();
    }
  });
}

export function setAmbientForEmotion(emotion, isEnabled) {
  currentEmotion = emotion || 'calm';
  enabled = !!isEnabled;
  if (!running) return;
  if (!enabled) {
    fademaster(0, 1.2);
    stopLoop();
  } else {
    fademaster(0.72, 1.0);
    if (!loopTimer) scheduleChord();
  }
}

export function stopAmbient() {
  enabled = false;
  fademaster(0, 0.8);
  stopLoop();
}

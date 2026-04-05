// pixi-visuals.js — unique story-seeded PixiJS backgrounds

let _app = null;
let _seed = 0;

// Simple seeded random — same story always gets same feel
function seededRand(seed, idx) {
  const x = Math.sin(seed + idx) * 43758.5453;
  return x - Math.floor(x);
}

// Hash a string into a number
function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// ── Init ──────────────────────────────────────────────────────────────────
function initPixi() {
  document.getElementById('pixi-canvas')?.remove();
  if (_app) { _app.destroy(true); _app = null; }

  _app = new PIXI.Application({
    width:           window.innerWidth,
    height:          window.innerHeight,
    backgroundAlpha: 0,
    resolution:      window.devicePixelRatio || 1,
    autoDensity:     true,
    antialias:       true,
  });

  _app.view.id = 'pixi-canvas';
  // Behind scene image (z-index 0) but above the raw bg
_app.view.style.cssText = 'position:fixed;inset:0;z-index:1;pointer-events:none;';  document.body.insertBefore(_app.view, document.body.firstChild);

  window.addEventListener('resize', () => {
    if (_app) _app.renderer.resize(window.innerWidth, window.innerHeight);
  });
}

// ── Main entry — call with full story data ────────────────────────────────
function startPixiWorld(genre, emotion, storyData) {
  if (!window.PIXI) return;
  if (!_app) initPixi();

  // Seed from story title + location so every story is unique
  const seedStr = (storyData?.title || '') + (storyData?.location || '') + (genre || '');
  _seed = seedStr ? hashStr(seedStr) : Math.floor(Math.random() * 99999);

  _app.stage.removeChildren();
  _app.ticker.remove(_app.ticker.listeners);

  const W = window.innerWidth, H = window.innerHeight;
  const e = emotion || 'calm';
  const g = genre   || 'adventure';

  // Every story gets these base layers
  buildBaseLayer(W, H, e, g);
  buildParticleLayer(W, H, e, g);
  buildLightLayer(W, H, e, g);
}

// ── Update when emotion changes ───────────────────────────────────────────
function updatePixiEmotion(emotion, storyData) {
  startPixiWorld(window.selectedGenre, emotion, storyData);
}

function destroyPixi() {
  if (_app) { _app.destroy(true); _app = null; }
  document.getElementById('pixi-canvas')?.remove();
}

// ═══════════════════════════════════════════════════════════
// BASE LAYER — ambient background wash unique per story
// ═══════════════════════════════════════════════════════════
function buildBaseLayer(W, H, emotion, genre) {
  const stage = _app.stage;

  // Story-unique color palette derived from seed
  const hue1 = seededRand(_seed, 1) * 360;
  const hue2 = (hue1 + 40 + seededRand(_seed, 2) * 80) % 360;

  // Emotion overrides the base hue
  const emotionHues = {
    danger:    [0,   10],   // deep reds
    dread:     [260, 280],  // dark purples
    romance:   [320, 340],  // pinks
    happy:     [40,  60],   // warm golds
    euphoria:  [300, 330],  // magentas
    grief:     [220, 240],  // cold blues
    epic:      [30,  50],   // amber golds
    tension:   [270, 290],  // purples
    calm:      [180, 210],  // teals
    adventure: [120, 150],  // greens
  };

  const [h1, h2] = emotionHues[emotion] || [hue1, hue2];

  // Large slow-moving gradient blobs — unique positions per story
  for (let i = 0; i < 5; i++) {
    const g   = new PIXI.Graphics();
    const r   = W * (0.25 + seededRand(_seed, i + 10) * 0.35);
    const hue = h1 + (h2 - h1) * seededRand(_seed, i + 20);
    const col = hslToHex(hue, 0.5 + seededRand(_seed, i+30)*0.3, 0.08 + seededRand(_seed,i+40)*0.06);

    g.beginFill(col, 0.12 + seededRand(_seed, i+50) * 0.1);
    g.drawCircle(0, 0, r);
    g.endFill();
    g.x = seededRand(_seed, i+60) * W;
    g.y = seededRand(_seed, i+70) * H;
    g.vx = (seededRand(_seed, i+80) - 0.5) * 0.2;
    g.vy = (seededRand(_seed, i+90) - 0.5) * 0.15;
    g.phase = seededRand(_seed, i+100) * Math.PI * 2;
    stage.addChild(g);

    _app.ticker.add(() => {
      g.phase += 0.003 + seededRand(_seed, i) * 0.004;
      g.x += g.vx + 0.1 * Math.sin(g.phase);
      g.y += g.vy + 0.08 * Math.cos(g.phase * 0.7);
      if (g.x < -r) g.x = W + r;
      if (g.x > W + r) g.x = -r;
      if (g.y < -r) g.y = H + r;
      if (g.y > H + r) g.y = -r;
      g.alpha = 0.08 + 0.05 * Math.sin(g.phase * 0.5);
    });
  }
}

// ═══════════════════════════════════════════════════════════
// PARTICLE LAYER — type and behavior from genre + story seed
// ═══════════════════════════════════════════════════════════
function buildParticleLayer(W, H, emotion, genre) {
  const stage = _app.stage;

  // Particle type varies by genre
  const genreParticle = {
    victorian: 'ash',
    aot:       'debris',
    dystopian: 'rain',
    adventure: 'firefly',
  }[genre] || 'dust';

  // Count and speed scale with emotion intensity
  const intensity = {
    danger: 1.8, dread: 1.5, epic: 1.6, tension: 1.3,
    euphoria: 1.4, calm: 0.6, happy: 0.9, romance: 0.7,
    grief: 0.8, adventure: 1.1,
  }[emotion] || 1.0;

  // Story-unique particle count — same genre, different stories get more/fewer
  const baseCount = Math.floor(30 + seededRand(_seed, 200) * 40);
  const count     = Math.floor(baseCount * intensity);

  // Story-unique particle color
  const emotionColors = {
    danger: 0xff3322, dread: 0x8833cc, epic: 0xffcc00,
    tension: 0x9966cc, calm: 0x44ccdd, romance: 0xff88bb,
    happy: 0xffdd44, euphoria: 0xff44cc, grief: 0x6688aa,
    adventure: 0x88ff99,
  };
  const col = emotionColors[emotion] || 0xaaaaaa;

  const particles = [];

  for (let i = 0; i < count; i++) {
    const g = new PIXI.Graphics();
    const r = seededRand(_seed, i + 300);

    if (genreParticle === 'rain') {
      const len = 6 + r * 14;
      g.lineStyle(1, col, 0.15 + r * 0.25);
      g.moveTo(0, 0); g.lineTo(-1, len);
    } else if (genreParticle === 'debris') {
      const sz = 1.5 + r * 3.5;
      g.beginFill(col, 0.4 + r * 0.4);
      g.drawRect(-sz/2, -sz/2, sz, sz);
      g.endFill();
    } else if (genreParticle === 'firefly') {
      g.beginFill(col, 0.07);
      g.drawCircle(0, 0, 10 + r * 6);
      g.endFill();
      g.beginFill(col, 0.9);
      g.drawCircle(0, 0, 1.5 + r);
      g.endFill();
    } else {
      // ash / dust
      const sz = 0.8 + r * 2;
      g.beginFill(col, 0.3 + r * 0.4);
      g.drawCircle(0, 0, sz);
      g.endFill();
    }

    g.x = seededRand(_seed, i + 400) * W;
    g.y = seededRand(_seed, i + 500) * H;

    // Speed influenced by both story seed and intensity
    const baseSpeed = seededRand(_seed, i + 600);
    const vx = (seededRand(_seed, i + 700) - 0.5) * 1.2 * intensity;
    const vy = genreParticle === 'rain'
      ? (5 + baseSpeed * 6) * intensity
      : (seededRand(_seed, i + 800) - 0.5) * 1.5 * intensity;

    g.vx = vx; g.vy = vy;
    g.phase = seededRand(_seed, i + 900) * Math.PI * 2;
    g.blinkRate = 0.5 + seededRand(_seed, i + 1000) * 2;
    stage.addChild(g);
    particles.push({ g, type: genreParticle });
  }

  _app.ticker.add(() => {
    particles.forEach(({ g, type }, i) => {
      g.phase += 0.02 * (1 + seededRand(_seed, i) * 0.5);

      if (type === 'firefly') {
        const blink = Math.abs(Math.sin(g.phase * g.blinkRate));
        g.alpha = blink < 0.15 ? 0 : blink * 0.9;
        g.x += g.vx + 0.4 * Math.sin(g.phase * 0.6);
        g.y += g.vy + 0.3 * Math.cos(g.phase * 0.4);
      } else {
        g.x += g.vx + 0.3 * Math.sin(g.phase);
        g.y += g.vy;
        if (type === 'debris') g.rotation += 0.02;
      }

      // Wrap
      if (g.x < -20) g.x = W + 20;
      if (g.x > W + 20) g.x = -20;
      if (g.y > H + 20) g.y = -20;
      if (g.y < -20) g.y = H + 20;
    });
  });
}

// ═══════════════════════════════════════════════════════════
// LIGHT LAYER — volumetric light shafts, unique per story
// ═══════════════════════════════════════════════════════════
function buildLightLayer(W, H, emotion, genre) {
  const stage = _app.stage;

  // Number of light shafts — unique to this story
  const shaftCount = Math.floor(1 + seededRand(_seed, 1100) * 3);

  for (let i = 0; i < shaftCount; i++) {
    const g = new PIXI.Graphics();

    // Shaft origin — unique x position per story
    const originX = (0.2 + seededRand(_seed, i + 1200) * 0.6) * W;
    const width   = W * (0.08 + seededRand(_seed, i + 1300) * 0.15);
    const angle   = (seededRand(_seed, i + 1400) - 0.5) * 0.4; // slight tilt

    const emotionLightColors = {
      danger:    0xff2200, dread: 0x440088, epic: 0xffaa00,
      romance:   0xff88aa, calm: 0x88ddff, happy: 0xffee88,
      adventure: 0xaaffcc, tension: 0x8844cc, grief: 0x4466aa,
      euphoria:  0xff66ff,
    };
    const col = emotionLightColors[emotion] || 0xffffff;

    g.beginFill(col, 0.025 + seededRand(_seed, i+1500) * 0.03);
    // Draw tapered shaft
    g.moveTo(originX - width/2, 0);
    g.lineTo(originX + width/2, 0);
    g.lineTo(originX + width * (1.5 + seededRand(_seed, i+1600)), H);
    g.lineTo(originX - width * (1.5 + seededRand(_seed, i+1700)), H);
    g.closePath();
    g.endFill();

    g.rotation = angle;
    g.phase    = seededRand(_seed, i + 1800) * Math.PI * 2;
    g.pulseRate = 0.003 + seededRand(_seed, i + 1900) * 0.005;
    stage.addChild(g);

    _app.ticker.add(() => {
      g.phase += g.pulseRate;
      g.alpha = 0.5 + 0.3 * Math.sin(g.phase);
      // Danger makes shafts pulse aggressively
      if (emotion === 'danger' || emotion === 'dread') {
        g.alpha *= 0.6 + 0.4 * Math.sin(g.phase * 4);
      }
    });
  }

  // Vignette — intensity unique per story + emotion
  const vigAlpha = 0.3 + seededRand(_seed, 2000) * 0.2 + (emotion === 'danger' ? 0.2 : 0);
  const vig = new PIXI.Graphics();
  const vigGrad = new PIXI.Graphics();
  vig.beginFill(0x000000, vigAlpha * 0.4);
  vig.drawRect(0, 0, W * 0.15, H); // left
  vig.endFill();
  vig.beginFill(0x000000, vigAlpha * 0.4);
  vig.drawRect(W * 0.85, 0, W * 0.15, H); // right
  vig.endFill();
  vig.beginFill(0x000000, vigAlpha * 0.5);
  vig.drawRect(0, 0, W, H * 0.12); // top
  vig.endFill();
  vig.beginFill(0x000000, vigAlpha * 0.6);
  vig.drawRect(0, H * 0.88, W, H * 0.12); // bottom
  vig.endFill();
  stage.addChild(vig);
}

// ── Utility: HSL to hex ───────────────────────────────────────────────────
function hslToHex(h, s, l) {
  h /= 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l));
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
    const hue2rgb = (p,q,t) => { if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p; };
    r = hue2rgb(p,q,h+1/3); g = hue2rgb(p,q,h); b = hue2rgb(p,q,h-1/3);
  }
  return (Math.round(r*255)<<16)|(Math.round(g*255)<<8)|Math.round(b*255);
}
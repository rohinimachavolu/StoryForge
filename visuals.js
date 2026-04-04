// visuals.js — p5.js animated backgrounds

let currentEmotion = 'calm';
let targetEmotion  = 'calm';

// Called by app.js whenever emotion changes
function updateBG(emotion) {
  targetEmotion = emotion || 'calm';
}

// Trigger glitch flash for danger scenes
function triggerGlitch() {
  const el = document.getElementById('glitch-overlay');
  el.classList.remove('active');
  void el.offsetWidth; // reflow
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 700);
}

// ── Color palettes per emotion ─────────────────────────────────────────────
const PALETTES = {
  romance:   [[232,120,160],[255,180,200],[210,90,130]],
  happy:     [[247,200,80], [255,230,100],[220,180,60]],
  tension:   [[100,60,140], [140,80,180], [70,40,110]],
  danger:    [[200,30,30],  [240,60,50],  [150,10,10]],
  calm:      [[60,160,180], [80,200,190], [40,130,150]],
  adventure: [[80,180,80],  [180,200,60], [120,160,40]]
};

function getPalette(e) { return PALETTES[e] || PALETTES.calm; }

// ── p5 sketch ──────────────────────────────────────────────────────────────
new p5(function(p) {
  let particles   = [];
  let noiseOffset = 0;
  let shakeX = 0, shakeY = 0;
  let lastEmotion = 'calm';

  p.setup = function () {
    const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent('bg-canvas');
    p.colorMode(p.RGB, 255, 255, 255, 255);
    spawnParticles('calm');
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };

  // ── Spawn particles for the given emotion ────────────────────────────────
  function spawnParticles(emotion) {
    particles = [];
    const count = emotion === 'danger' ? 30 : emotion === 'tension' ? 20 : 40;
    for (let i = 0; i < count; i++) particles.push(newParticle(emotion));
  }

  function newParticle(e) {
    const pal = getPalette(e);
    const c   = pal[Math.floor(Math.random() * pal.length)];
    return {
      x:     Math.random() * p.width,
      y:     Math.random() * p.height,
      vx:    (Math.random() - .5) * (e === 'danger' ? 2 : .5),
      vy:    (Math.random() - .5) * (e === 'danger' ? 2 : .5) - (e === 'romance' ? .5 : 0),
      size:  Math.random() * 6 + 3,
      alpha: Math.random() * 150 + 80,
      r: c[0], g: c[1], b: c[2],
      angle: Math.random() * p.TWO_PI,
      rot:   (Math.random() - .5) * .05
    };
  }

  // ── Main draw loop ────────────────────────────────────────────────────────
  p.draw = function () {
    if (targetEmotion !== lastEmotion) {
      spawnParticles(targetEmotion);
      lastEmotion   = targetEmotion;
      currentEmotion = targetEmotion;
    }

    const pal = getPalette(currentEmotion);
    const bg  = pal[0];

    // Fading background
    p.background(bg[0] * 0.12, bg[1] * 0.12, bg[2] * 0.15, 30);

    // Perlin noise wave overlay
    noiseOffset += 0.003;
    p.noStroke();
    for (let x = 0; x < p.width; x += 60) {
      for (let y = 0; y < p.height; y += 60) {
        const n = p.noise(x * .005 + noiseOffset, y * .005 + noiseOffset * 1.3);
        const a = p.map(n, 0, 1, 0, 18);
        p.fill(bg[0], bg[1], bg[2], a);
        p.ellipse(x, y, 40, 40);
      }
    }

    // Screen shake for danger
    if (currentEmotion === 'danger') {
      shakeX = (Math.random() - .5) * 6;
      shakeY = (Math.random() - .5) * 4;
    } else {
      shakeX *= .85;
      shakeY *= .85;
    }
    p.translate(shakeX, shakeY);

    // Draw particles
    particles.forEach(pt => {
      pt.x += pt.vx + p.noise(pt.x * .004, pt.y * .004 + noiseOffset) *
        (currentEmotion === 'calm' ? 1.2 : currentEmotion === 'danger' ? 3 : .8) - .3;
      pt.y += pt.vy;
      pt.angle += pt.rot;
      if (pt.x < -20)         pt.x = p.width + 20;
      if (pt.x > p.width + 20) pt.x = -20;
      if (pt.y < -20)         pt.y = p.height + 20;
      if (pt.y > p.height + 20) pt.y = -20;

      p.push();
      p.translate(pt.x, pt.y);
      p.rotate(pt.angle);

      switch (currentEmotion) {
        case 'romance':   drawHeart(pt);    break;
        case 'happy':     drawFlower(pt);   break;
        case 'adventure': drawFirefly(pt);  break;
        case 'danger':    drawSpark(pt);    break;
        default:
          p.fill(pt.r, pt.g, pt.b, pt.alpha * 0.6);
          p.ellipse(0, 0, pt.size * 1.5, pt.size * 1.5);
      }
      p.pop();
    });
  };

  // ── Particle shapes ───────────────────────────────────────────────────────
  function drawHeart(pt) {
    p.fill(pt.r, pt.g, pt.b, pt.alpha * .7);
    const s = pt.size * .25;
    p.beginShape();
    for (let a = 0; a < p.TWO_PI; a += .1) {
      const hx =  s * 16 * Math.pow(Math.sin(a), 3);
      const hy = -s * (13*Math.cos(a) - 5*Math.cos(2*a) - 2*Math.cos(3*a) - Math.cos(4*a));
      p.vertex(hx, hy);
    }
    p.endShape(p.CLOSE);
  }

  function drawFlower(pt) {
    const s = pt.size;
    for (let i = 0; i < 6; i++) {
      const a = (p.TWO_PI / 6) * i;
      p.fill(pt.r, pt.g, pt.b, pt.alpha * .6);
      p.ellipse(Math.cos(a) * s, Math.sin(a) * s, s * 1.2, s * .8);
    }
    p.fill(255, 240, 100, pt.alpha);
    p.ellipse(0, 0, s * .9, s * .9);
  }

  function drawFirefly(pt) {
    p.fill(pt.r, pt.g, pt.b, pt.alpha * .4);
    p.ellipse(0, 0, pt.size * 3, pt.size * 3);
    p.fill(255, 255, 200, pt.alpha * .9);
    p.ellipse(0, 0, pt.size * .8, pt.size * .8);
  }

  function drawSpark(pt) {
    p.stroke(pt.r, pt.g, pt.b, pt.alpha * .8);
    p.strokeWeight(1.5);
    const l = pt.size * 2;
    p.line(-l, 0, l, 0);
    p.line(0, -l, 0, l);
    p.noStroke();
  }
});
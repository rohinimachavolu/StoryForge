// app.js — state management & UI

const state = {
  prompt:       '',
  title:        '',
  characters:   [],   // [{ name, description }]
  history:      [],   // [{ scene, emotion, chosen }]
  currentScene: null,
  sceneIndex:   0,
  historyOpen:  false
};

const EMOTION_CONFIG = {
  romance:   { color:'#e8aac0', badge:'rgba(232,120,160,.15)', icon:'🌹' },
  happy:     { color:'#f7d96e', badge:'rgba(247,200,80,.15)',  icon:'✨' },
  tension:   { color:'#9a8fa0', badge:'rgba(140,100,160,.15)', icon:'⚡' },
  danger:    { color:'#e05555', badge:'rgba(220,50,50,.15)',   icon:'🔴' },
  calm:      { color:'#7ecdc4', badge:'rgba(80,190,180,.15)',  icon:'🌊' },
  adventure: { color:'#8bcf72', badge:'rgba(100,200,80,.15)', icon:'🗺' }
};

// ── Utility ────────────────────────────────────────────────────────────────
function setPrompt(text) { document.getElementById('prompt-input').value = text; }
function escQ(s) { return s.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

// ── Loading ────────────────────────────────────────────────────────────────
function showLoading() {
  document.getElementById('scene-text').textContent = 'Weaving your story…';
  document.getElementById('emotion-badge').style.display = 'none';
  document.getElementById('choices-area').innerHTML = `
    <div class="loading"><div class="spinner"></div>Generating next scene…</div>`;
}

function disableChoices(d) {
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = d);
}

// ── Background scene image ─────────────────────────────────────────────────
function updateSceneBg(location, emotion) {
  const bg  = document.getElementById('scene-bg');
  const url = getSceneBgUrl(location, emotion);
  // Use an <img> tag as a hidden loader — avoids CORS preflight
  const loader = document.createElement('img');
  loader.crossOrigin = 'anonymous';
  loader.style.display = 'none';
  loader.src = url;
  loader.onload = () => {
    bg.style.backgroundImage = `url('${url}')`;
    loader.remove();
  };
  loader.onerror = () => {
    // fallback: set directly and let browser handle it
    bg.style.backgroundImage = `url('${url}')`;
    loader.remove();
  };
  document.body.appendChild(loader);
}

// ── Character portraits ────────────────────────────────────────────────────
function renderPortraits(characters) {
  const rail = document.getElementById('portrait-rail');
  rail.innerHTML = characters.map(c => {
    const url      = getCharacterPortraitUrl(c.description, c.name);
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=1a1a2e&color=c9a96e&size=200&bold=true`;
    return `
    <div class="portrait-wrap" title="${c.name}">
      <img class="portrait-img"
           src="${url}"
           alt="${c.name}"
           onload="this.classList.add('loaded')"
           onerror="this.onerror=null;this.src='${fallback}';this.classList.add('loaded')"/>
      <span class="portrait-name">${c.name}</span>
    </div>`;
  }).join('');
}

// ── Story title ────────────────────────────────────────────────────────────
function setStoryTitle(title) {
  state.title = title;
  document.getElementById('story-title').textContent = title;
}

// ── Render scene ───────────────────────────────────────────────────────────
function renderScene(data) {
  const cfg = EMOTION_CONFIG[data.emotion] || EMOTION_CONFIG.calm;

  // title (first scene sets it, keep after)
  if (data.title && !state.title) setStoryTitle(data.title);

  // emotion badge
  const badge = document.getElementById('emotion-badge');
  badge.style.display = 'inline-flex';
  badge.style.color   = cfg.color;
  badge.style.borderColor = cfg.color;
  badge.style.background  = cfg.badge;
  badge.textContent = `${cfg.icon} ${data.emotion.toUpperCase()}`;

  // scene text
  document.getElementById('scene-text').textContent = data.scene;

  // choices
  document.getElementById('choices-area').innerHTML = data.choices.map((c, i) => `
    <button class="choice-btn" onclick="makeChoice('${escQ(c)}')">
      <span class="choice-num">${['I','II','III'][i] || i+1}.</span>${c}
    </button>`).join('');

  // bg + portraits
  if (data.location) updateSceneBg(data.location, data.emotion);
  if (data.characters) renderPortraits(data.characters);

  // p5 ambient particles
  updateBG(data.emotion);
  if (data.emotion === 'danger') triggerGlitch();
}

function showError(msg) {
  document.getElementById('scene-text').textContent = `⚠ ${msg}`;
}

// ── History panel ──────────────────────────────────────────────────────────
function toggleHistory() {
  state.historyOpen = !state.historyOpen;
  const panel = document.getElementById('history-panel');
  const btn   = document.getElementById('history-btn');
  if (state.historyOpen) {
    renderHistoryPanel();
    panel.classList.add('open');
    btn.classList.add('active');
  } else {
    panel.classList.remove('open');
    btn.classList.remove('active');
  }
}

function renderHistoryPanel() {
  const list = document.getElementById('history-list');
  if (state.history.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);font-style:italic">No history yet.</p>';
    return;
  }
  list.innerHTML = state.history.map((h, i) => `
    <div class="history-item">
      <div class="history-num">Scene ${i + 1} — <span style="color:var(--accent)">${h.emotion}</span></div>
      <div class="history-scene">${h.scene}</div>
      ${h.chosen ? `<div class="chosen">▶ You chose: "${h.chosen}"</div>` : ''}
    </div>`).join('');
}

// ── Story actions ──────────────────────────────────────────────────────────
async function startStory() {
  const prompt = document.getElementById('prompt-input').value.trim();
  if (!prompt) { document.getElementById('prompt-input').focus(); return; }

  state.prompt = prompt;
  const btn = document.getElementById('start-btn');
  btn.disabled = true;

  document.getElementById('intro-screen').style.display = 'none';
  document.getElementById('story-screen').classList.add('active');
  showLoading();
  updateBG('calm');

  try {
    const raw  = await callAI(buildFirstMessage(prompt));
    const data = parseSceneJSON(raw);
    state.currentScene = data;
    state.characters   = data.characters || [];
    state.sceneIndex   = 1;
    renderScene(data);
  } catch(e) { showError(e.message); }

  btn.disabled = false;
}

async function makeChoice(choice) {
  disableChoices(true);
  state.history.push({
    scene:   state.currentScene.scene,
    emotion: state.currentScene.emotion,
    chosen:  choice
  });
  // update history panel if open
  if (state.historyOpen) renderHistoryPanel();

  showLoading();

  try {
    const msg  = buildNextMessage(state.history, state.characters, choice);
    const raw  = await callAI(msg);
    const data = parseSceneJSON(raw);

    if (data.characters && data.characters.length > 0) {
      const names    = new Set(state.characters.map(c => c.name));
      const merged   = [...state.characters];
      data.characters.forEach(c => { if (!names.has(c.name)) merged.push(c); });
      state.characters = merged.length > 6 ? state.characters : merged;
    }

    state.currentScene = data;
    state.sceneIndex++;
    renderScene(data);
  } catch(e) {
    showError(`${e.message} — try again.`);
    disableChoices(false);
  }
}

function resetStory() {
  Object.assign(state, {
    prompt:'', title:'', characters:[], history:[],
    currentScene:null, sceneIndex:0, historyOpen:false
  });
  document.getElementById('story-screen').classList.remove('active');
  document.getElementById('intro-screen').style.display = 'flex';
  document.getElementById('story-title').textContent = '';
  document.getElementById('scene-bg').style.backgroundImage = '';
  document.getElementById('history-panel').classList.remove('open');
  document.getElementById('history-btn').classList.remove('active');
  updateBG('calm');
}
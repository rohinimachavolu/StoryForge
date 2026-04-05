// app.js — state management & UI

const state = {
  prompt:       '',
  title:        '',
  characters:   [],
  history:      [],
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
  adventure: { color:'#8bcf72', badge:'rgba(100,200,80,.15)', icon:'🗺' },
  dread:     { color:'#6a3a8a', badge:'rgba(106,58,138,.15)', icon:'👁' },
  epic:      { color:'#e8b840', badge:'rgba(232,184,64,.15)',  icon:'⚡' },
  grief:     { color:'#7a8aaa', badge:'rgba(120,138,170,.15)', icon:'💧' },
  euphoria:  { color:'#ff88cc', badge:'rgba(255,136,204,.15)', icon:'🌟' }
};

// ── Utility ────────────────────────────────────────────────────────────────
function setPrompt(text) {
  const el = document.getElementById('prompt-input');
  if (el) el.value = text;
}
function escQ(s) { return s.replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

// ── Loading ────────────────────────────────────────────────────────────────
function showLoading() {
  const sceneText = document.getElementById('scene-text');
  if (sceneText) sceneText.textContent = 'Weaving your story…';
  const badge = document.getElementById('emotion-badge');
  if (badge) badge.style.display = 'none';
  const choices = document.getElementById('choices-area');
  if (choices) choices.innerHTML = `
    <div class="loading"><div class="spinner"></div>Generating next scene…</div>`;
}

function disableChoices(d) {
  document.querySelectorAll('.choice-btn').forEach(b => b.disabled = d);
}

// ── Background scene image ─────────────────────────────────────────────────
function updateSceneBg(location, emotion) {
  const bg  = document.getElementById('scene-bg');
  if (!bg) return;
  const url = getSceneBgUrl(location, emotion);
  const loader = document.createElement('img');
  loader.crossOrigin = 'anonymous';
  loader.style.display = 'none';
  loader.src = url;
  loader.onload  = () => { bg.style.backgroundImage = `url('${url}')`; loader.remove(); };
  loader.onerror = () => { bg.style.backgroundImage = `url('${url}')`; loader.remove(); };
  document.body.appendChild(loader);
}

// ── Character portraits ────────────────────────────────────────────────────
function renderPortraits(characters) {
  const rail = document.getElementById('portrait-rail');
  if (!rail) return;
  rail.innerHTML = characters.map(c => {
    const url      = getCharacterPortraitUrl(c.description, c.name);
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=1a1a2e&color=c9a96e&size=200&bold=true`;
    return `
    <div class="portrait-wrap" title="${c.name}">
      <img class="portrait-img"
           src="${url}" alt="${c.name}"
           onload="this.classList.add('loaded')"
           onerror="this.onerror=null;this.src='${fallback}';this.classList.add('loaded')"/>
      <span class="portrait-name">${c.name}</span>
    </div>`;
  }).join('');
}

// ── Story title ────────────────────────────────────────────────────────────
function setStoryTitle(title) {
  state.title = title;
  const el = document.getElementById('story-title');
  if (el) el.textContent = title;
}

// ── Render scene ───────────────────────────────────────────────────────────
function renderScene(data) {
  const cfg = EMOTION_CONFIG[data.emotion] || EMOTION_CONFIG.calm;

  if (data.title && !state.title) setStoryTitle(data.title);

  // Emotion badge
  const badge = document.getElementById('emotion-badge');
  if (badge) {
    badge.style.display     = 'inline-flex';
    badge.style.color       = cfg.color;
    badge.style.borderColor = cfg.color;
    badge.style.background  = cfg.badge;
    badge.textContent = `${cfg.icon} ${data.emotion.toUpperCase()}`;
  }

  // Scene text
  const sceneText = document.getElementById('scene-text');
  if (sceneText) sceneText.textContent = data.scene;

  // Choices
  const choicesArea = document.getElementById('choices-area');
  if (choicesArea) {
    choicesArea.innerHTML = data.choices.map((c, i) => `
      <button class="choice-btn" onclick="makeChoice('${escQ(c)}')">
        <span class="choice-num">${['I','II','III'][i] || i+1}.</span>${c}
      </button>`).join('');
  }

  if (data.location)   updateSceneBg(data.location, data.emotion);
  if (data.characters) renderPortraits(data.characters);
  if (typeof narrateScene === 'function') narrateScene(data.scene, data.characters || state.characters);

  // Intensity tracking for visuals
  if (typeof trackIntensity === 'function') trackIntensity(data.emotion);

  updateBG(data.emotion);
if (typeof updatePixiEmotion === 'function') updatePixiEmotion(data.emotion, state.currentScene);
  if (data.emotion === 'danger' || data.emotion === 'dread') triggerGlitch();

  // Chapter progression every 3 scenes
  if (state.sceneIndex > 0 && state.sceneIndex % 3 === 0) {
    const nextChapter = Math.min(Math.floor(state.sceneIndex / 3), 6);
    if (typeof updateChapterProgress === 'function') updateChapterProgress(nextChapter);
  }

  // Author mode — make scene clickable
  if (window.selectedAgency === 'author') {
    setTimeout(() => {
      if (typeof enableAuthorEditing === 'function') enableAuthorEditing();
    }, 100);
  }
}

function showError(msg) {
  const el = document.getElementById('scene-text');
  if (el) el.textContent = `⚠ ${msg}`;
}

// ── History panel ──────────────────────────────────────────────────────────
function toggleHistory() {
  state.historyOpen = !state.historyOpen;
  const panel = document.getElementById('history-panel');
  const btn   = document.getElementById('history-btn');
  if (state.historyOpen) {
    renderHistoryPanel();
    panel.classList.add('open');
    if (btn) btn.classList.add('active');
  } else {
    panel.classList.remove('open');
    if (btn) btn.classList.remove('active');
  }
}

function renderHistoryPanel() {
  const list = document.getElementById('history-list');
  if (!list) return;
  if (state.history.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);font-style:italic">No history yet.</p>';
    return;
  }
  list.innerHTML = state.history.map((h, i) => `
    <div class="history-item">
      <div class="history-num">Scene ${i+1} — <span style="color:var(--accent)">${h.emotion}</span></div>
      <div class="history-scene">${h.scene}</div>
      ${h.chosen ? `<div class="chosen">▶ You chose: "${h.chosen}"</div>` : ''}
    </div>`).join('');
}

// ── startStory ─────────────────────────────────────────────────────────────
async function startStory() {
  const prompt = document.getElementById('prompt-input').value.trim();
  if (!prompt) { document.getElementById('prompt-input').focus(); return; }
  if (!window.selectedGenre) { alert('Please choose a world first.'); return; }

  state.prompt = prompt;
  const btn = document.getElementById('start-btn');
  if (btn) btn.disabled = true;

  if (typeof resetGame === 'function') resetGame();

  document.getElementById('intro-screen').style.display = 'none';
  document.getElementById('story-screen').classList.add('active', 'with-sidebar');

  const sidebar = document.getElementById('chapter-sidebar');
  if (sidebar) sidebar.style.display = 'flex';
  if (typeof initChapters  === 'function') initChapters(window.selectedGenre);
  if (typeof initAgencyBar === 'function') initAgencyBar();
  if (typeof initHUD       === 'function') initHUD();
  if (typeof initVoiceControls === 'function') initVoiceControls();
  if (window.selectedAgency === 'author' && typeof initAuthorToolbar === 'function') initAuthorToolbar();

  showLoading();
  updateBG('calm');

  try {
    const raw  = await callAI(buildFirstMessage(prompt));
    const data = parseSceneJSON(raw);
    state.currentScene = data;
    state.characters   = data.characters || [];
    state.sceneIndex   = 1;
    renderScene(data);

    // ← PIXI must be inside try, after data exists
    if (typeof startPixiWorld === 'function') startPixiWorld(window.selectedGenre, data.emotion || 'calm', data);
    if (typeof awardXP === 'function') awardXP('scene', 'Story begins!');
    if (window.selectedAgency === 'author' && typeof enableAuthorEditing === 'function') enableAuthorEditing();
  } catch(e) { showError(e.message); }

  if (btn) btn.disabled = false;
}
// ── makeChoice ─────────────────────────────────────────────────────────────
async function makeChoice(choice) {
  disableChoices(true);

  // Gamification — evaluate before advancing
  if (typeof evaluateChoice === 'function' && state.currentScene) {
    evaluateChoice(choice, state.currentScene.emotion);
  }

  state.history.push({
    scene:   state.currentScene.scene,
    emotion: state.currentScene.emotion,
    chosen:  choice
  });
  if (state.historyOpen) renderHistoryPanel();

  showLoading();

  try {
    const msg  = buildNextMessage(state.history, state.characters, choice);
    const raw  = await callAI(msg);
    const data = parseSceneJSON(raw);

    if (data.characters && data.characters.length > 0) {
      const names  = new Set(state.characters.map(c => c.name));
      const merged = [...state.characters];
      data.characters.forEach(c => { if (!names.has(c.name)) merged.push(c); });
      state.characters = merged.length > 6 ? state.characters : merged;
    }

    state.currentScene = data;
    state.sceneIndex++;
    renderScene(data);

    // Chapter end every 3 scenes
    if (state.sceneIndex > 0 && state.sceneIndex % 3 === 0) {
      const chIdx    = Math.min(Math.floor(state.sceneIndex / 3) - 1, 6);
      const genre    = window.selectedGenre || 'adventure';
      const chapters = typeof CHAPTER_STRUCTURE !== 'undefined' ? CHAPTER_STRUCTURE[genre] : null;
      const title    = chapters ? (chapters[chIdx]?.title || `Chapter ${chIdx+1}`) : `Chapter ${chIdx+1}`;
      if (typeof showChapterEnd === 'function') setTimeout(() => showChapterEnd(chIdx+1, title), 700);
    }

  } catch(e) {
    showError(`${e.message} — try again.`);
    disableChoices(false);
  }
}

// ── resetStory ─────────────────────────────────────────────────────────────
function resetStory() {
  Object.assign(state, {
    prompt:'', title:'', characters:[], history:[],
    currentScene:null, sceneIndex:0, historyOpen:false
  });
  window.selectedGenre  = null;
  window.selectedAgency = 'player';

  document.getElementById('story-screen').classList.remove('active', 'with-sidebar');

  const els = {
    'chapter-sidebar': e => e.style.display = 'none',
    'story-title':     e => e.textContent = '',
    'scene-bg':        e => e.style.backgroundImage = '',
    'history-panel':   e => e.classList.remove('open'),
    'history-btn':     e => e.classList.remove('active'),
    'agency-input-bar':e => e.remove(),
    'author-toolbar':  e => e.remove(),
    'game-hud':        e => e.remove(),
    'ch-end':          e => e.remove(),
    
  };
  Object.entries(els).forEach(([id, fn]) => { const el = document.getElementById(id); if (el) fn(el); });

  if (typeof resetGame === 'function') resetGame();
  updateBG('calm');
  if (typeof renderIntro === 'function') renderIntro();
  document.getElementById('intro-screen').style.display = 'flex';
  if (typeof destroyPixi === 'function') destroyPixi();
}
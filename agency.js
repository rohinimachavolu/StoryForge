// agency.js — handles Witness / Player / Author modes

// Called after story screen is shown — adds the input bar
function initAgencyBar() {
  const mode = window.selectedAgency || 'player';

  // Remove existing if any
  const existing = document.getElementById('agency-input-bar');
  if (existing) existing.remove();

  if (mode === 'witness') return; // No input bar for witness

  const bar = document.createElement('div');
  bar.id = 'agency-input-bar';
  bar.innerHTML = `
    <span class="agency-mode-tag ${mode}">
      ${mode === 'player' ? '⚔️ PLAYER' : '✍️ AUTHOR'}
    </span>
    <input
      type="text"
      class="agency-input-field"
      id="agency-input"
      placeholder="${mode === 'author'
        ? 'Rewrite anything — "Eren survives", "it starts raining", "she betrays him"...'
        : 'What do you do? Type freely or pick a choice above...'}"
    />
    <button class="btn-agency-send" onclick="handleAgencyInput()">
      ${mode === 'author' ? 'Rewrite →' : 'Act →'}
    </button>
  `;

  // Insert before choices area or at bottom of story screen
  const storyScreen = document.getElementById('story-screen');
  storyScreen.appendChild(bar);

  // Enter key support
  document.getElementById('agency-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleAgencyInput();
  });
}

function handleAgencyInput() {
  const input = document.getElementById('agency-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  const mode = window.selectedAgency || 'player';

  if (mode === 'author') {
    applyRewrite(text);
  } else {
    // Player mode — treat as a free-form action choice
    makeChoice(text);
  }
}

// Author mode — inject a rewrite into the story
async function applyRewrite(rewriteText) {
  disableChoices(true);

  // Show the rewrite as a special event in scene
  const sceneText = document.getElementById('scene-text');
  const rewriteTag = document.createElement('div');
  rewriteTag.className = 'rewrite-tag';
  rewriteTag.innerHTML = `✍️ <em>You rewrote reality: "${rewriteText}"</em>`;
  sceneText.parentNode.insertBefore(rewriteTag, sceneText.nextSibling);

  showLoading();

  try {
    const ctx = getCurrentChapterContext();
    const msg = buildRewriteMessage(state.history, state.characters, rewriteText, ctx);
    const raw  = await callAI(msg);
    const data = parseSceneJSON(raw);

    if (data.characters && data.characters.length > 0) {
      const names  = new Set(state.characters.map(c => c.name));
      const merged = [...state.characters];
      data.characters.forEach(c => { if (!names.has(c.name)) merged.push(c); });
      state.characters = merged.length > 6 ? state.characters : merged;
    }

    // Add rewrite to history
    state.history.push({
      scene:   state.currentScene.scene,
      emotion: state.currentScene.emotion,
      chosen:  `[REWRITE] ${rewriteText}`
    });

    state.currentScene = data;
    state.sceneIndex++;
    renderScene(data);
  } catch(e) {
    showError(`Rewrite failed: ${e.message}`);
    disableChoices(false);
  }
}

// Build a special rewrite prompt
function buildRewriteMessage(history, characters, rewrite, chapterCtx) {
  const recent   = history.slice(-3).map(h => `Scene: ${h.scene} | Action: ${h.chosen}`).join('\n');
  const charNames = characters.map(c => c.name).join(', ');
  const beats    = chapterCtx.beats.join(' → ');

  return `Established characters: ${charNames}
Recent story:\n${recent}

AUTHOR INTERVENTION: The player has rewritten reality with: "${rewrite}"
You MUST accept this change as canon and continue the story incorporating it naturally.
Chapter ${chapterCtx.chapterNum}: "${chapterCtx.chapterTitle}" — beats: ${beats}

Continue the story with this rewrite woven in. Keep same title. JSON only.`;
}

// Make the scene text editable in Author mode (click to edit)
function enableAuthorEditing() {
  if (window.selectedAgency !== 'author') return;
  const sceneText = document.getElementById('scene-text');
  sceneText.classList.add('rewritable');
  sceneText.setAttribute('title', 'Click to edit this scene directly');
  sceneText.contentEditable = 'true';
  sceneText.addEventListener('blur', () => {
    // When they finish editing, store it
    state.currentScene.scene = sceneText.textContent;
  });
}

// Intensity tracker — tracks consecutive danger/tension scenes
let intensityStreak = 0;
let lastEmotionForStreak = null;

function trackIntensity(emotion) {
  if (emotion === 'danger' || emotion === 'tension' || emotion === 'dread' || emotion === 'epic') {
    if (emotion === lastEmotionForStreak) intensityStreak = Math.min(intensityStreak + 1, 5);
    else { intensityStreak = 1; lastEmotionForStreak = emotion; }
  } else {
    intensityStreak = Math.max(0, intensityStreak - 1);
    if (intensityStreak === 0) lastEmotionForStreak = null;
  }
  // Pass intensity to visuals
  if (typeof setIntensity === 'function') setIntensity(intensityStreak);
}
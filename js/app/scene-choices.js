import {
  buildNextMessage,
  callAI,
  parseSceneJSON,
  primaryPlotStopText
} from '../story/index.js';
import { setAmbientForEmotion } from './ambient-audio.js';
import { maybeIngestChapterThemesFromScene } from './chapter-themes.js';
import { updateChapterUI } from './chapter-ui.js';
import { EMOTION_CONFIG, SCENE_CAP, state } from './state.js';
import { escapeForHtml } from './html-utils.js';
import { mergeCharacterLists, renderPortraits, setStoryTitle } from './portraits.js';
import { formatSceneToHtml } from './scene-text.js';
import { updateSceneBg } from './scene-bg.js';
import {
  disableChoices,
  hideApiNotice,
  showApiNotice,
  showError,
  showLoading
} from './ui-loading.js';
import { storyContext, systemPromptNextScene } from './story-bridge.js';
import { renderHistoryPanel } from './history.js';

function updateBG(emotion) {
  if (typeof globalThis.updateBG === 'function') globalThis.updateBG(emotion);
}

function triggerGlitch() {
  if (typeof globalThis.triggerGlitch === 'function') globalThis.triggerGlitch();
}

export function renderChapterSceneCapNotice() {
  const area = document.getElementById('choices-area');
  area.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'chapter-scene-cap';
  const p = document.createElement('p');
  p.className = 'chapter-scene-cap-text';
  const isFinale =
    state.chapter >= state.maxChapters &&
    state.sceneInChapter >= SCENE_CAP;
  p.textContent = isFinale
    ? `You’ve reached the final scene of the saga (${SCENE_CAP} of ${SCENE_CAP} in this chapter). The tale concludes above. Claim rewards below, then start a new story from ✕ New when you’re ready.`
    : `You’ve played every scene in this chapter (${SCENE_CAP} of ${SCENE_CAP}). Use Next chapter below to continue — rewards tally when you advance.`;
  wrap.appendChild(p);
  if (isFinale && !state.finalSagaRewardsClaimed) {
    const row = document.createElement('div');
    row.className = 'chapter-scene-cap-actions';
    const claim = document.createElement('button');
    claim.type = 'button';
    claim.className = 'btn-claim-rewards';
    claim.textContent = 'Claim saga rewards';
    claim.addEventListener('click', () => {
      claim.disabled = true;
      void import('./chapter-rewards.js')
        .then(m => m.claimSagaFinalRewards())
        .finally(() => {
          if (!state.finalSagaRewardsClaimed) claim.disabled = false;
        });
    });
    row.appendChild(claim);
    wrap.appendChild(row);
  }
  area.appendChild(wrap);
}

export function renderChoices(choices) {
  const area = document.getElementById('choices-area');
  area.innerHTML = '';

  const list = Array.isArray(choices) ? choices.slice(0, 3) : [];
  while (list.length < 3) list.push('Press on — what do you do?');

  const hint = document.createElement('p');
  hint.className = 'choices-hint';
  hint.textContent = 'I = scenario fork · II–III = your move · IV = type your own.';
  area.appendChild(hint);

  const kinds = [
    { rom: 'I', label: 'Scenario' },
    { rom: 'II', label: 'Move' },
    { rom: 'III', label: 'Move' }
  ];
  kinds.forEach((k, i) => {
    const text = list[i];
    const block = document.createElement('div');
    block.className = 'choice-block' + (i === 0 ? ' choice-block-scenario' : ' choice-block-move');
    const kindEl = document.createElement('span');
    kindEl.className = 'choice-kind';
    kindEl.textContent = k.label;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'choice-btn' + (i === 0 ? ' choice-btn-scenario' : '');
    btn.innerHTML = `<span class="choice-num">${k.rom}.</span>${escapeForHtml(text)}`;
    btn.addEventListener('click', () => makeChoice(text));
    block.appendChild(kindEl);
    block.appendChild(btn);
    area.appendChild(block);
  });

  const userRow = document.createElement('div');
  userRow.className = 'choice-user-row';

  const lab = document.createElement('div');
  lab.className = 'choice-user-heading';
  lab.innerHTML = '<span class="choice-num">IV.</span><span>Your own action</span>';

  const ta = document.createElement('textarea');
  ta.id = 'choice-user-textarea';
  ta.className = 'choice-user-textarea';
  ta.rows = 3;
  ta.value = '';
  ta.autocomplete = 'off';
  ta.placeholder = 'Type your own move here, then Declare…';

  const goRow = document.createElement('div');
  goRow.className = 'choice-user-actions';
  const go = document.createElement('button');
  go.type = 'button';
  go.className = 'btn-user-choice-go';
  go.textContent = 'Declare';
  go.addEventListener('click', () => {
    if (ta.disabled) return;
    const v = ta.value.trim();
    if (!v) {
      ta.focus();
      return;
    }
    makeChoice(v);
  });
  ta.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      go.click();
    }
  });

  goRow.appendChild(go);
  userRow.appendChild(lab);
  userRow.appendChild(ta);
  userRow.appendChild(goRow);
  area.appendChild(userRow);
}

export function renderScene(data) {
  hideApiNotice();
  maybeIngestChapterThemesFromScene(data);
  const cfg = EMOTION_CONFIG[data.emotion] || EMOTION_CONFIG.calm;

  if (data.title && !state.title) setStoryTitle(data.title);

  const badge = document.getElementById('emotion-badge');
  badge.style.display = 'inline-flex';
  badge.style.color = cfg.color;
  badge.style.borderColor = cfg.color;
  badge.style.background = cfg.badge;
  badge.textContent = `${cfg.icon} ${data.emotion.toUpperCase()}`;

  const max = state.maxChapters;
  const beat = primaryPlotStopText(state.plotLines, state.chapter, max);
  const beatBit = beat.length > 56 ? `${beat.slice(0, 54)}…` : beat;
  const sceneLine = `Scene ${state.sceneInChapter} of ${SCENE_CAP}`;
  const line = beatBit
    ? `Chapter ${state.chapter} of ${max} · ${sceneLine} — ${beatBit}`
    : `Chapter ${state.chapter} of ${max} · ${sceneLine}`;
  const sceneHtml =
    `<span class="chapter-inline">${escapeForHtml(line)}</span>` + formatSceneToHtml(data.scene);
  const sceneTextEl = document.getElementById('scene-text');
  sceneTextEl.innerHTML = sceneHtml;
  sceneTextEl.dataset.theme = state.narrationTheme;
  const emKey = data.emotion && EMOTION_CONFIG[data.emotion] ? data.emotion : 'calm';
  sceneTextEl.dataset.emotion = emKey;

  if (state.sceneInChapter >= SCENE_CAP) renderChapterSceneCapNotice();
  else renderChoices(data.choices);

  if (data.location) updateSceneBg(data.location, data.emotion);
  if (data.characters) renderPortraits(data.characters);

  updateChapterUI();

  updateBG(data.emotion);
  if (data.emotion === 'danger') triggerGlitch();

  setAmbientForEmotion(data.emotion, state.ambientMusicEnabled);
}

/**
 * Advance to the next scene (player choice or author directive). Caller enforces scene cap if needed.
 */
export async function advanceStoryWithChoice(choice) {
  const nextBtn = document.getElementById('next-chapter-btn');
  if (nextBtn) nextBtn.disabled = true;
  disableChoices(true);
  state.history.push({
    scene: state.currentScene.scene,
    emotion: state.currentScene.emotion,
    chosen: choice,
    chapter: state.chapter,
    sceneInChapter: state.sceneInChapter
  });
  if (state.historyOpen) renderHistoryPanel();

  showLoading();

  try {
    const msg = buildNextMessage(
      state.history,
      state.characters,
      choice,
      storyContext(true)
    );
    const raw = await callAI(msg, systemPromptNextScene());
    const data = parseSceneJSON(raw);

    if (data.characters && data.characters.length > 0) {
      state.characters = mergeCharacterLists(state.characters, data.characters);
    }

    state.currentScene = data;
    state.sceneIndex++;
    state.sceneInChapter = Math.min(state.sceneInChapter + 1, SCENE_CAP);
    renderScene(data);
  } catch (e) {
    state.history.pop();
    if (state.currentScene) {
      renderScene(state.currentScene);
      showApiNotice(`Could not continue: ${e.message}`);
    } else {
      showError(`${e.message} — try again.`);
    }
    disableChoices(false);
    throw e;
  } finally {
    if (nextBtn) nextBtn.disabled = false;
  }
}

export async function makeChoice(choice) {
  if (state.sceneInChapter >= SCENE_CAP) return;
  try {
    await advanceStoryWithChoice(choice);
  } catch {
    /* surfaced in advanceStoryWithChoice */
  }
}

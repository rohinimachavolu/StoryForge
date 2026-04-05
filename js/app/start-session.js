import { buildFirstMessage, callAI, parseSceneJSON } from '../story/index.js';
import { updateChapterUI, updateRpgStatsBar } from './chapter-ui.js';
import {
  collectPlotLinesFromForm,
  initChapterArcState,
  premiseArcPlotLines
} from './plot-setup.js';
import { renderScene } from './scene-choices.js';
import { clearSceneVideo } from './scene-video.js';
import { state } from './state.js';
import { storyContext, systemPromptForChapterOpening } from './story-bridge.js';
import { hideApiNotice, showLoading } from './ui-loading.js';

function updateBG(emotion) {
  if (typeof globalThis.updateBG === 'function') globalThis.updateBG(emotion);
}

export async function startChapterOne() {
  if (document.querySelector('.plot-line-input')) {
    state.plotLines = collectPlotLinesFromForm();
    if (state.plotLines.length < 4) {
      while (state.plotLines.length < 4) {
        state.plotLines.push('Open arc — improvise with the player');
      }
    }
  } else {
    state.plotLines = premiseArcPlotLines(state.prompt);
  }
  state.chapter = 1;
  state.title = '';
  state.characters = [];
  state.history = [];
  state.currentScene = null;
  state.sceneIndex = 0;
  state.sceneInChapter = 1;
  state.hp = 20;
  state.maxHp = 20;
  state.xp = 0;
  state.coins = 0;
  state.level = 1;
  state.finalSagaRewardsClaimed = false;
  state.lastRewardsChapter = 0;
  initChapterArcState();

  const startBtn = document.getElementById('start-chapter-btn');
  if (startBtn) startBtn.disabled = true;
  const forgeBtn = document.getElementById('forge-story-btn');
  if (forgeBtn) forgeBtn.disabled = true;
  void executeStartChapterOneApi();
}

export async function executeStartChapterOneApi() {
  const startBtn = document.getElementById('start-chapter-btn');
  const forgeBtn = document.getElementById('forge-story-btn');
  document.getElementById('story-screen').classList.add('active');
  document.getElementById('story-screen').hidden = false;
  showLoading();
  updateChapterUI();
  updateBG('calm');

  try {
    const raw = await callAI(
      buildFirstMessage(state.prompt, storyContext(false)),
      systemPromptForChapterOpening(1)
    );
    const data = parseSceneJSON(raw);
    state.currentScene = data;
    state.characters = data.characters || [];
    state.sceneIndex = 1;
    renderScene(data);
    updateRpgStatsBar();
  } catch (e) {
    showStartFailure(e.message || String(e));
  } finally {
    if (startBtn) startBtn.disabled = false;
    if (forgeBtn) forgeBtn.disabled = false;
  }
}

export function showStartFailure(message) {
  hideApiNotice();
  clearSceneVideo();
  const story = document.getElementById('story-screen');
  story.classList.add('active');
  story.hidden = false;
  document.getElementById('emotion-badge').style.display = 'none';
  document.getElementById('story-title').textContent = 'Could not start session';
  const sceneEl = document.getElementById('scene-text');
  sceneEl.textContent = '';
  const area = document.getElementById('choices-area');
  const p = document.createElement('p');
  p.className = 'error-msg';
  p.textContent = message;
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'btn-primary';
  back.style.marginTop = '0.75rem';
  back.textContent = '← Back to plot setup';
  back.addEventListener('click', returnToPlotSetup);
  area.innerHTML = '';
  area.appendChild(p);
  area.appendChild(back);
}

export function returnToPlotSetup() {
  document.getElementById('story-screen').classList.remove('active');
  document.getElementById('story-screen').hidden = true;
  const intro = document.getElementById('intro-screen');
  intro.hidden = false;
  intro.style.display = 'flex';
  const forgeBtn = document.getElementById('forge-story-btn');
  if (forgeBtn) forgeBtn.disabled = false;
}

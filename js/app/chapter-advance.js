import {
  buildChapterAdvanceMessage,
  callAI,
  parseSceneJSON
} from '../story/index.js';
import { runChapterRewardsFlow } from './chapter-rewards.js';
import { mergeCharacterLists } from './portraits.js';
import { renderScene } from './scene-choices.js';
import { state } from './state.js';
import { systemPromptForChapterOpening } from './story-bridge.js';
import {
  disableChoices,
  showApiNotice,
  showError,
  showLoading
} from './ui-loading.js';

export async function advanceChapter() {
  if (state.chapter >= state.maxChapters || !state.currentScene) return;
  const completedCh = state.chapter;
  const nextCh = completedCh + 1;
  const nextBtn = document.getElementById('next-chapter-btn');
  if (nextBtn) nextBtn.disabled = true;
  disableChoices(true);

  try {
    if (state.lastRewardsChapter < completedCh) {
      showLoading('Tallying chapter rewards…');
      await runChapterRewardsFlow(completedCh);
      state.lastRewardsChapter = completedCh;
    }
    await executeAdvanceChapterApi(nextCh);
  } catch (e) {
    if (state.currentScene) {
      renderScene(state.currentScene);
      showApiNotice(`Could not advance: ${e.message}`);
    } else {
      showError(`${e.message} — try again.`);
    }
    disableChoices(false);
  } finally {
    if (nextBtn) nextBtn.disabled = false;
  }
}

export async function executeAdvanceChapterApi(nextCh) {
  const nextBtn = document.getElementById('next-chapter-btn');
  if (nextBtn) nextBtn.disabled = true;
  disableChoices(true);
  showLoading(`Opening chapter ${nextCh} of ${state.maxChapters}…`);

  try {
    const msg = buildChapterAdvanceMessage({
      plotLines: state.plotLines,
      chapter: nextCh,
      history: state.history,
      characters: state.characters,
      maxChapters: state.maxChapters,
      chapterBeats: [...(state.chapterBeats[nextCh] || [])],
      chapterNarrationNote: state.chapterNarrationNotes[nextCh] || '',
      sceneInChapter: 1,
      playerHp: state.hp,
      playerMaxHp: state.maxHp,
      playerXp: state.xp,
      playerCoins: state.coins,
      proseStyle: state.proseStyle
    });
    const raw = await callAI(msg, systemPromptForChapterOpening(nextCh));
    const data = parseSceneJSON(raw);

    if (data.characters && data.characters.length > 0) {
      state.characters = mergeCharacterLists(state.characters, data.characters);
    }

    state.chapter = nextCh;
    state.maxUnlockedChapter = Math.max(state.maxUnlockedChapter, nextCh);
    state.sceneInChapter = 1;
    state.currentScene = data;
    state.sceneIndex++;
    renderScene(data);
  } catch (e) {
    if (state.currentScene) {
      renderScene(state.currentScene);
      showApiNotice(`Could not open next chapter: ${e.message}`);
    } else {
      showError(`${e.message} — try again.`);
    }
    disableChoices(false);
  } finally {
    if (nextBtn) nextBtn.disabled = false;
  }
}

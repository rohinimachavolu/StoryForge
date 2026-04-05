import { TOTAL_CHAPTERS } from '../story/constants.js';
import { stopAmbient } from './ambient-audio.js';
import { renderStoryArcSidebar } from './sidebar.js';
import { clearVoiceAssignments, stopSpeech } from './story-speech.js';
import { state } from './state.js';

function updateBG(emotion) {
  if (typeof globalThis.updateBG === 'function') globalThis.updateBG(emotion);
}

export function resetStory() {
  clearVoiceAssignments();
  Object.assign(state, {
    prompt: '',
    title: '',
    characters: [],
    history: [],
    currentScene: null,
    sceneIndex: 0,
    historyOpen: false,
    playerMode: null,
    narrationTheme: 'dystopian',
    plotLines: [''],
    chapter: 1,
    maxChapters: TOTAL_CHAPTERS,
    maxUnlockedChapter: 1,
    chapterBeats: {},
    chapterNarrationNotes: {},
    chapterTitles: {},
    sceneInChapter: 1,
    chapterThemesUserEdited: {},
    ambientMusicEnabled: false,
    hp: 20,
    maxHp: 20,
    xp: 0,
    coins: 0,
    level: 1,
    finalSagaRewardsClaimed: false,
    lastRewardsChapter: 0
  });
  document.getElementById('story-screen').classList.remove('active');
  document.getElementById('story-screen').hidden = true;
  document.getElementById('intro-screen').hidden = false;
  document.getElementById('intro-screen').style.display = 'flex';
  document.getElementById('story-title').textContent = '';
  document.getElementById('scene-bg').style.backgroundImage = '';
  document.getElementById('history-panel').classList.remove('open');
  document.getElementById('history-btn').classList.remove('active');
  document.getElementById('chapter-chip').style.display = 'none';
  const progRow = document.getElementById('chapter-progress-row');
  if (progRow) progRow.style.display = 'none';
  document.getElementById('next-chapter-btn').style.display = 'none';
  document.querySelectorAll('.book-agency-btn').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll('.book-world-card').forEach(el => {
    el.classList.toggle('selected', el.dataset.theme === state.narrationTheme);
  });
  updateBG('calm');
  renderStoryArcSidebar();
}

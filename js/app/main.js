import {
  addBeatRow,
  dismissBeatsModal,
  saveBeatsFromModal
} from './beats-modal.js';
import { advanceChapter } from './chapter-advance.js';
import { initAuthorTools } from './author-tools.js';
import { activateAmbientOnUserGesture, setAmbientForEmotion } from './ambient-audio.js';
import { renderStoryArcSidebar } from './sidebar.js';
import {
  startChapterOne
} from './start-session.js';
import {
  goBackToAgency,
  goToAgencySetup,
  selectAgency,
  selectBookWorld,
  selectNarrationTheme,
  selectProseStyle,
  setPrompt,
  syncBookLandingUi,
  toggleStoryTag
} from './setup-wizard.js';
import { resetStory } from './reset.js';
import { toggleHistory } from './history.js';
import { state } from './state.js';
import { setOnSpeakingChange, speakScene, stopSpeech } from './story-speech.js';

function syncAmbientButton() {
  const btn = document.getElementById('ambient-toggle-btn');
  if (!btn) return;
  btn.classList.toggle('ambient-on', state.ambientMusicEnabled);
  btn.classList.toggle('ambient-off', !state.ambientMusicEnabled);
  btn.title = state.ambientMusicEnabled
    ? 'Background mood music on (click to mute)'
    : 'Background mood music off (click to enable)';
}

function syncSpeechButtons(speaking) {
  const read = document.getElementById('read-aloud-btn');
  const stop = document.getElementById('stop-speech-btn');
  if (read) read.style.display = speaking ? 'none' : '';
  if (stop) stop.style.display = speaking ? '' : 'none';
}

export function initApp() {
  const modal = document.getElementById('beats-modal');
  document.getElementById('beats-save-btn')?.addEventListener('click', saveBeatsFromModal);
  document.getElementById('beats-modal-close')?.addEventListener('click', dismissBeatsModal);
  document.getElementById('add-beat-btn')?.addEventListener('click', addBeatRow);
  modal?.querySelector('.beats-modal-scrim')?.addEventListener('click', dismissBeatsModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && !modal.hidden) dismissBeatsModal();
  });

  setOnSpeakingChange(syncSpeechButtons);
  syncSpeechButtons(false);

  document.getElementById('read-aloud-btn')?.addEventListener('click', () => {
    void activateAmbientOnUserGesture();
    if (state.currentScene && state.currentScene.scene) {
      void speakScene(state.currentScene, state.characters);
    }
  });
  document.getElementById('stop-speech-btn')?.addEventListener('click', () => stopSpeech());
  document.getElementById('ambient-toggle-btn')?.addEventListener('click', () => {
    state.ambientMusicEnabled = !state.ambientMusicEnabled;
    syncAmbientButton();
    const em = state.currentScene && state.currentScene.emotion;
    setAmbientForEmotion(em || 'calm', state.ambientMusicEnabled);
    void activateAmbientOnUserGesture();
  });
  syncAmbientButton();

  const storyScreen = document.getElementById('story-screen');
  storyScreen?.addEventListener(
    'pointerdown',
    () => {
      void activateAmbientOnUserGesture();
    },
    { capture: true, passive: true }
  );

  initAuthorTools();
  renderStoryArcSidebar();
  syncBookLandingUi();

  Object.assign(globalThis, {
    setPrompt,
    goToAgencySetup,
    selectAgency,
    selectBookWorld,
    goBackToAgency,
    selectNarrationTheme,
    selectProseStyle,
    toggleStoryTag,
    startChapterOne,
    advanceChapter,
    resetStory,
    toggleHistory
  });
}

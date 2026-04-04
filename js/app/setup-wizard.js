import { startChapterOne } from './start-session.js';
import { premiseArcPlotLines, renderPlotLinesList } from './plot-setup.js';
import { state } from './state.js';

export function setPrompt(text) { document.getElementById('prompt-input').value = text; }

export function syncBookLandingUi() {
  document.querySelectorAll('.book-world-card').forEach(el => {
    el.classList.toggle('selected', el.dataset.theme === state.narrationTheme);
  });
  document.querySelectorAll('.book-agency-btn').forEach(el => {
    const mode = el.dataset.agency;
    el.classList.toggle('selected', state.playerMode === mode);
  });
  document.querySelectorAll('.book-prose-btn').forEach(el => {
    const ps = el.dataset.prose;
    el.classList.toggle('selected', state.proseStyle === ps);
  });
}

export function selectProseStyle(style) {
  state.proseStyle = style === 'plain' ? 'plain' : 'literary';
  syncBookLandingUi();
}

export function selectBookWorld(theme) {
  selectNarrationTheme(theme);
  document.querySelectorAll('.book-world-card').forEach(el => {
    el.classList.toggle('selected', el.dataset.theme === theme);
  });
}

export function goToAgencySetup() {
  const prompt = document.getElementById('prompt-input').value.trim();
  if (!prompt) {
    document.getElementById('prompt-input').focus();
    return;
  }
  if (state.playerMode == null) {
    const first = document.querySelector('.book-agency-btn');
    if (first) first.focus();
    return;
  }
  state.prompt = prompt;
  selectNarrationTheme(state.narrationTheme);
  document.getElementById('intro-screen').style.display = 'none';
  document.getElementById('intro-screen').hidden = true;
  void startChapterOne();
}

export function selectAgency(mode) {
  state.playerMode = mode;
  document.querySelectorAll('.book-agency-btn').forEach(el => el.classList.remove('selected'));
  const el = document.getElementById(`agency-${mode}`);
  if (el) el.classList.add('selected');
}

export function goBackToAgency() {
  const intro = document.getElementById('intro-screen');
  intro.hidden = false;
  intro.style.display = 'flex';
  syncBookLandingUi();
}

export function selectNarrationTheme(theme) {
  state.narrationTheme = theme;
  const tabD = document.getElementById('tab-dystopian');
  const tabV = document.getElementById('tab-victorian');
  const tabW = document.getElementById('tab-veilwild');
  if (tabD) tabD.classList.toggle('active', theme === 'dystopian');
  if (tabV) tabV.classList.toggle('active', theme === 'victorian');
  if (tabW) tabW.classList.toggle('active', theme === 'veilwild');
  renderPlotLinesList();
}

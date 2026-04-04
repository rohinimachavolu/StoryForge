import { escapeForHtml } from './html-utils.js';
import { state } from './state.js';

export function toggleHistory() {
  state.historyOpen = !state.historyOpen;
  const panel = document.getElementById('history-panel');
  const btn = document.getElementById('history-btn');
  if (state.historyOpen) {
    renderHistoryPanel();
    panel.classList.add('open');
    btn.classList.add('active');
  } else {
    panel.classList.remove('open');
    btn.classList.remove('active');
  }
}

export function renderHistoryPanel() {
  const list = document.getElementById('history-list');
  if (state.history.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);font-style:italic">No history yet.</p>';
    return;
  }
  list.innerHTML = state.history.map((h, i) => `
    <div class="history-item">
      <div class="history-num">Ch.${h.chapter}${h.sceneInChapter != null ? ` · S${h.sceneInChapter}` : ''} · Beat ${i + 1} — <span style="color:var(--accent)">${escapeForHtml(h.emotion)}</span></div>
      <div class="history-scene">${escapeForHtml(h.scene)}</div>
      ${h.chosen ? `<div class="chosen">▶ You chose: “${escapeForHtml(h.chosen)}”</div>` : ''}
    </div>`).join('');
}

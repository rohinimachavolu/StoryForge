import { openBeatsModal } from './beats-modal.js';
import { state } from './state.js';

export function getChapterDisplayTitle(n) {
  const t = (state.chapterTitles[n] || '').trim();
  return t || `Chapter ${n}`;
}

export function renderStoryArcSidebar() {
  const ul = document.getElementById('story-arc-list');
  if (!ul) return;
  ul.innerHTML = '';
  const max = state.maxChapters;
  for (let n = 1; n <= max; n++) {
    const locked = n > state.maxUnlockedChapter;
    const active = n === state.chapter;
    const li = document.createElement('li');
    li.className =
      'story-arc-item' + (active ? ' is-active' : '') + (locked ? ' is-locked' : '');
    li.setAttribute('role', 'button');
    li.tabIndex = 0;
    li.title = locked
      ? 'Plan or reorder chapter themes (unlocks when you advance here). Click to open.'
      : 'Click to reorder AI-suggested themes and set narration steer for this chapter.';
    const label = document.createElement('span');
    label.className = 'story-arc-item-label';
    label.textContent = getChapterDisplayTitle(n);
    const meta = document.createElement('span');
    meta.className = 'story-arc-item-meta';
    meta.textContent = `Ch. ${n}`;
    const icon = document.createElement('span');
    icon.className = 'story-arc-item-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = locked ? '🔒' : active ? '▶' : '◇';
    li.appendChild(label);
    li.appendChild(meta);
    li.appendChild(icon);
    li.addEventListener('click', () => openBeatsModal(n));
    li.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openBeatsModal(n);
      }
    });
    ul.appendChild(li);
  }
}

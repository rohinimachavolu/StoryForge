import { DEFAULT_BEATS_MODAL_SUB, state } from './state.js';

export let beatsModalChapter = null;

export function openBeatsModal(chapterNum) {
  if (chapterNum < 1 || chapterNum > state.maxChapters) return;
  beatsModalChapter = chapterNum;
  const modal = document.getElementById('beats-modal');
  const titleEl = document.getElementById('beats-modal-heading');
  const subEl = document.getElementById('beats-modal-sub');
  const saveBtn = document.getElementById('beats-save-btn');
  const chapterTitleInput = document.getElementById('beats-chapter-title-input');
  const list = document.getElementById('beats-modal-list');
  const note = document.getElementById('beats-narration-note');
  if (!modal || !list) return;
  if (subEl) subEl.textContent = DEFAULT_BEATS_MODAL_SUB;
  if (saveBtn) saveBtn.textContent = '✓ Save themes';
  const beats = [...(state.chapterBeats[chapterNum] || [])];
  titleEl.textContent = `Chapter ${chapterNum} · themes`;
  chapterTitleInput.value = state.chapterTitles[chapterNum] || '';
  note.value = state.chapterNarrationNotes[chapterNum] || '';
  list.innerHTML = '';
  beats.forEach(text => {
    list.appendChild(createBeatRowEl(text));
  });
  modal.hidden = false;
  modal.classList.add('open');
  chapterTitleInput.focus();
}

export function createBeatRowEl(text) {
  const li = document.createElement('li');
  li.className = 'beat-row';
  const handle = document.createElement('span');
  handle.className = 'beat-drag-handle';
  handle.title = 'Drag to reorder';
  handle.textContent = '⋮⋮';
  handle.draggable = true;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'beat-input';
  input.value = text;
  input.placeholder = 'Thematic thread…';
  li.appendChild(handle);
  li.appendChild(input);
  handle.addEventListener('dragstart', e => {
    const list = document.getElementById('beats-modal-list');
    if (!list) return;
    const rows = [...list.querySelectorAll('.beat-row')];
    const idx = rows.indexOf(li);
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
    li.classList.add('dragging');
  });
  handle.addEventListener('dragend', () => li.classList.remove('dragging'));
  li.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });
  li.addEventListener('drop', e => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
    const list = document.getElementById('beats-modal-list');
    if (!list || Number.isNaN(from)) return;
    const rows = [...list.querySelectorAll('.beat-row')];
    const to = rows.indexOf(li);
    if (to < 0 || from === to) return;
    const ch = beatsModalChapter;
    const arr = [...(state.chapterBeats[ch] || [])];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    state.chapterBeats[ch] = arr;
    list.innerHTML = '';
    arr.forEach(t => list.appendChild(createBeatRowEl(t)));
  });
  return li;
}

function resetBeatsModalChrome() {
  const saveBtn = document.getElementById('beats-save-btn');
  const subEl = document.getElementById('beats-modal-sub');
  if (saveBtn) saveBtn.textContent = '✓ Save themes';
  if (subEl) subEl.textContent = DEFAULT_BEATS_MODAL_SUB;
}

export function closeBeatsModal() {
  const modal = document.getElementById('beats-modal');
  if (modal) {
    modal.hidden = true;
    modal.classList.remove('open');
  }
  beatsModalChapter = null;
  resetBeatsModalChrome();
}

export function dismissBeatsModal() {
  closeBeatsModal();
}

export function saveBeatsFromModal() {
  if (beatsModalChapter == null) return;
  const ch = beatsModalChapter;
  const list = document.getElementById('beats-modal-list');
  const chapterTitleInput = document.getElementById('beats-chapter-title-input');
  const note = document.getElementById('beats-narration-note');
  const inputs = list ? [...list.querySelectorAll('.beat-input')] : [];
  const beats = inputs.map(inp => inp.value.trim()).filter(Boolean);
  state.chapterBeats[ch] = beats;
  state.chapterThemesUserEdited[ch] = true;
  state.chapterTitles[ch] = (chapterTitleInput && chapterTitleInput.value.trim()) || '';
  state.chapterNarrationNotes[ch] = (note && note.value.trim()) || '';
  closeBeatsModal();
  import('./sidebar.js').then(m => m.renderStoryArcSidebar());
}

export function addBeatRow() {
  if (beatsModalChapter == null) return;
  const ch = beatsModalChapter;
  const list = document.getElementById('beats-modal-list');
  if (!list) return;
  const arr = [...(state.chapterBeats[ch] || [])];
  arr.push('New theme');
  state.chapterBeats[ch] = arr;
  list.innerHTML = '';
  arr.forEach(t => list.appendChild(createBeatRowEl(t)));
}

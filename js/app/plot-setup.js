import { state } from './state.js';

/** Single-arc line derived from the premise (no preset template plot). */
export function premiseArcPlotLines(prompt) {
  const t = String(prompt || '').trim();
  const line = t || 'The adventure the player described — stay faithful to it.';
  return [line];
}

export function renderPlotLinesList() {
  const ol = document.getElementById('plot-lines-list');
  if (!ol) return;
  ol.innerHTML = '';
  state.plotLines.forEach((text, i) => {
    const li = document.createElement('li');
    li.className = 'plot-row';
    const idx = document.createElement('span');
    idx.className = 'plot-idx';
    idx.textContent = String(i + 1);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plot-line-input';
    input.value = text;
    input.dataset.index = String(i);
    const nav = document.createElement('div');
    nav.className = 'plot-reorder';
    const up = document.createElement('button');
    up.type = 'button';
    up.textContent = '↑';
    up.disabled = i === 0;
    up.addEventListener('click', () => movePlotLine(i, -1));
    const down = document.createElement('button');
    down.type = 'button';
    down.textContent = '↓';
    down.disabled = i === state.plotLines.length - 1;
    down.addEventListener('click', () => movePlotLine(i, 1));
    nav.appendChild(up);
    nav.appendChild(down);
    li.appendChild(idx);
    li.appendChild(input);
    li.appendChild(nav);
    ol.appendChild(li);
  });
}

export function movePlotLine(index, delta) {
  const j = index + delta;
  if (j < 0 || j >= state.plotLines.length) return;
  const lines = [...state.plotLines];
  const inputs = [...document.querySelectorAll('.plot-line-input')];
  lines[index] = inputs[index] ? inputs[index].value : lines[index];
  lines[j] = inputs[j] ? inputs[j].value : lines[j];
  [lines[index], lines[j]] = [lines[j], lines[index]];
  state.plotLines = lines;
  renderPlotLinesList();
}

export function collectPlotLinesFromForm() {
  const inputs = [...document.querySelectorAll('.plot-line-input')];
  return inputs.map(inp => {
    const t = inp.value.trim();
    return t || 'Open arc — improvise with the player';
  });
}

/** Clears per-chapter theme lists; themes are filled from the model on scene 1 of each chapter unless the player edits them in the modal. */
export function initChapterArcState() {
  state.maxUnlockedChapter = 1;
  state.chapterBeats = {};
  state.chapterNarrationNotes = {};
  state.chapterTitles = {};
  state.chapterThemesUserEdited = {};
  const max = state.maxChapters;
  for (let c = 1; c <= max; c++) {
    state.chapterBeats[c] = [];
    state.chapterNarrationNotes[c] = '';
    state.chapterTitles[c] = '';
  }
}

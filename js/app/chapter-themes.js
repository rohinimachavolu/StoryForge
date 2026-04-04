import { state } from './state.js';

/**
 * On scene 1 only: copy model-proposed chapterThemes into the ordered list used in prompts,
 * unless the player has already saved an order in the chapter modal.
 */
export function maybeIngestChapterThemesFromScene(data) {
  const ch = state.chapter;
  const s = state.sceneInChapter;
  if (s !== 1) return;
  if (state.chapterThemesUserEdited[ch]) return;
  const themes = data && data.chapterThemes;
  if (!Array.isArray(themes) || themes.length < 2) return;
  const cleaned = themes.map(t => String(t).trim()).filter(Boolean).slice(0, 8);
  if (cleaned.length < 2) return;
  state.chapterBeats[ch] = cleaned;
}

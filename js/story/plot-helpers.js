import { NUM_PLOT_STOPS } from './constants.js';

/** Map chapter 1..maxChapters onto user-ordered plot stop indices 0..numStops-1 */
export function primaryBeatIndex(chapter, maxChapters, numStops) {
  if (numStops <= 1) return 0;
  const cap = Math.max(2, maxChapters);
  const t = (chapter - 1) / (cap - 1);
  return Math.min(numStops - 1, Math.floor(t * numStops));
}

export function primaryPlotStopText(plotLines, chapter, maxChapters) {
  const n = plotLines.length || NUM_PLOT_STOPS;
  const i = primaryBeatIndex(chapter, maxChapters, n);
  return plotLines[i] || plotLines[0] || '';
}

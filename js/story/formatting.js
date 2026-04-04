export function formatPlotStops(plotLines) {
  return plotLines.map((p, i) => `${i + 1}. ${p.trim() || '(plot stop)'}`).join('\n');
}

/** Per-chapter thematic threads + optional player steer; injected into user messages */
export function formatChapterDirectives(beats, narrationNote) {
  const lines = Array.isArray(beats) ? beats.map(t => String(t || '').trim()).filter(Boolean) : [];
  const note = String(narrationNote || '').trim();
  let out = '';
  if (lines.length) {
    out += `This chapter’s **thematic threads in this exact order** (the player arranged them — honor the sequence):\n${lines.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`;
    out += `Let the fiction pay off those threads **in the numbered order above** across scenes. If the player derails hard, adapt in-fiction but still try to land each thread in order when possible.\n`;
  }
  if (note) {
    out += `Player narration steer for this chapter (honor strongly unless it contradicts the premise or prior canon): ${note}\n`;
  }
  return out.trim();
}

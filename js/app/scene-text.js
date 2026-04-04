import { escapeForHtml } from './html-utils.js';

/** Strip lines the model echoed from prompt rubrics (not player-facing prose). */
export function stripModelMetaEcho(raw) {
  const original = String(raw || '').trim();
  if (!original) return original;
  const lines = original.split(/\r?\n/);
  const metaStart = /^(Dialogue-heavy|Second person;|Finale:|Recap \+|Short narration lines|2–4 narrative|About \d+–\d+ words)/i;
  while (lines.length) {
    const t = lines[0].trim();
    if (!t) {
      lines.shift();
      continue;
    }
    if (metaStart.test(t) || /^many Speaker\s*—/i.test(t)) {
      lines.shift();
      continue;
    }
    break;
  }
  const out = lines.join('\n').trim();
  return out || original;
}

export function getSceneSpeechSegments(raw) {
  if (!raw) return [];
  const cleaned = stripModelMetaEcho(raw);
  const lines = String(cleaned).replace(/\r\n/g, '\n').split('\n');
  const segments = [];
  const narrBuf = [];
  function flushNarr() {
    if (!narrBuf.length) return;
    const t = narrBuf.join(' ').replace(/\s+/g, ' ').trim();
    if (t) segments.push({ type: 'narr', text: t });
    narrBuf.length = 0;
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushNarr();
      continue;
    }
    const dlg = tryParseDialogueLine(trimmed);
    if (dlg && dlg.speaker && dlg.text) {
      flushNarr();
      segments.push({ type: 'dlg', text: dlg.text, speaker: dlg.speaker });
    } else {
      narrBuf.push(trimmed);
    }
  }
  flushNarr();
  return segments;
}

function tryParseDialogueLine(trimmed) {
  const patterns = [
    /^(.+?)\s*—\s*\u201c(.+)\u201d\s*$/,
    /^(.+?)\s*—\s*"([\s\S]*)"\s*$/,
    /^(.+?)\s*-\s*"([\s\S]*)"\s*$/
  ];
  for (const re of patterns) {
    const m = trimmed.match(re);
    if (m) return { speaker: m[1].trim(), text: m[2].trim() };
  }
  return null;
}

/** Parse scene text: dialogue lines as Speaker — "words" vs narration paragraphs */
export function formatSceneToHtml(raw) {
  if (!raw) return '';
  const cleaned = stripModelMetaEcho(raw);
  const lines = String(cleaned).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  const narrBuf = [];
  function flushNarr() {
    if (!narrBuf.length) return;
    const t = narrBuf.join(' ').replace(/\s+/g, ' ').trim();
    if (t) blocks.push({ type: 'narr', html: escapeForHtml(t) });
    narrBuf.length = 0;
  }
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushNarr();
      continue;
    }
    const dlg = tryParseDialogueLine(trimmed);
    if (dlg && dlg.speaker && dlg.text) {
      flushNarr();
      blocks.push({
        type: 'dlg',
        speaker: escapeForHtml(dlg.speaker),
        text: escapeForHtml(dlg.text)
      });
    } else {
      narrBuf.push(trimmed);
    }
  }
  flushNarr();
  return blocks
    .map(b =>
      b.type === 'narr'
        ? `<p class="scene-narration">${b.html}</p>`
        : `<div class="dialogue-line"><span class="dialogue-speaker">${b.speaker}</span><span class="dialogue-quote">“${b.text}”</span></div>`
    )
    .join('');
}

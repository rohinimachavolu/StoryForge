import { primaryPlotStopText } from '../story/index.js';
import { syncAuthorToolsVisibility } from './author-tools.js';
import { renderStoryArcSidebar } from './sidebar.js';
import { state, SCENE_CAP } from './state.js';

export function updateRpgStatsBar() {
  const bar = document.getElementById('rpg-stats-bar');
  if (!bar) return;
  const active = document.getElementById('story-screen')?.classList.contains('active');
  bar.style.display = active && state.currentScene ? 'flex' : 'none';
  const hp = document.getElementById('stat-hp');
  const mx = document.getElementById('stat-maxhp');
  const xp = document.getElementById('stat-xp');
  const co = document.getElementById('stat-coins');
  const lv = document.getElementById('stat-level');
  if (hp) hp.textContent = String(state.hp);
  if (mx) mx.textContent = String(state.maxHp);
  if (xp) xp.textContent = String(state.xp);
  if (co) co.textContent = String(state.coins);
  if (lv) lv.textContent = String(state.level);
}

export function updateChapterUI() {
  const chip = document.getElementById('chapter-chip');
  const nextBtn = document.getElementById('next-chapter-btn');
  const max = state.maxChapters;
  const beat = primaryPlotStopText(state.plotLines, state.chapter, max);
  const short = beat.length > 36 ? `${beat.slice(0, 34)}…` : beat;
  chip.style.display = 'flex';
  chip.textContent = `Ch.${state.chapter}/${max} · S${state.sceneInChapter}/${SCENE_CAP} · ${short}`;

  const storyScreen = document.getElementById('story-screen');
  if (storyScreen) {
    const t = state.narrationTheme;
    if (t === 'victorian' || t === 'dystopian' || t === 'veilwild') {
      storyScreen.dataset.storyTheme = t;
    } else {
      delete storyScreen.dataset.storyTheme;
    }
  }

  const row = document.getElementById('chapter-progress-row');
  const label = document.getElementById('chapter-progress-label');
  const fill = document.getElementById('chapter-progress-fill');
  const bar = document.getElementById('chapter-progress-bar');
  if (row && label && fill) {
    row.style.display = 'block';
    label.textContent = `Chapter ${state.chapter} of ${max} · Scene ${state.sceneInChapter} of ${SCENE_CAP}`;
    const pct = Math.min(100, Math.round((state.chapter / max) * 100));
    fill.style.width = `${pct}%`;
    if (bar) {
      bar.setAttribute('aria-valuenow', String(state.chapter));
      bar.setAttribute('aria-valuemax', String(max));
    }
  }

  nextBtn.style.display = state.chapter < max ? 'inline-flex' : 'none';

  renderStoryArcSidebar();
  updateRpgStatsBar();
  syncAuthorToolsVisibility();
}

import { callAI } from '../story/openai.js';
import { state } from './state.js';
import { updateChapterUI } from './chapter-ui.js';

const REWARDS_SYSTEM = `You are scoring a solo story-game chapter. Output **only** valid JSON, no markdown:
{
  "hpDelta": <integer>,
  "maxHpDelta": <integer, usually 0>,
  "xpDelta": <integer>,
  "coinsDelta": <integer>,
  "summary": "<one vivid line for the player>"
}
Rules:
- hpDelta typically -12 to +18 (damage from danger/betrayal; healing from rest/allies). Player cannot go below 1 HP when applied (app clamps).
- maxHpDelta only if training/endurance changed (-3 to +5); usually 0.
- xpDelta 10–140: higher for bold, risky, clever, or emotionally costly choices; lower for passive or repetitive play.
- **coinsDelta (required):** Almost every chapter pays **something**. Use **18–55** for a normal chapter with play; **8–20** only if the fiction was pure broke/hiding in a hole with zero loot. **Never omit** coinsDelta; never default to 0 unless the log truly justified utter poverty. Loot, tips, found coin, employer pay, stolen purse, quest payout — pick what fits the story.
- **Vary numbers every chapter** from the actual choices — do not output the same hp/xp/coins triple every time.
- Read emotions and choice text: danger/tension often hurt hp but pay xp and sometimes extra coin (spoils); calm/happy may heal; custom long actions deserve distinct treatment.

Use exact keys: hpDelta, maxHpDelta, xpDelta, coinsDelta, summary.`;

function parseRewardsJSON(raw) {
  const clean = String(raw).replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No rewards JSON');
  const data = JSON.parse(clean.slice(start, end + 1));
  return normalizeRewardsKeys(data);
}

function normalizeRewardsKeys(data) {
  if (!data || typeof data !== 'object') return {};
  const firstCoin = Array.isArray(data.coins) ? data.coins[0] : undefined;
  return {
    hpDelta: data.hpDelta ?? data.hp_change ?? data.hpChange,
    maxHpDelta: data.maxHpDelta ?? data.max_hp_delta ?? 0,
    xpDelta: data.xpDelta ?? data.xp ?? data.xpGain ?? data.xp_gain,
    coinsDelta: data.coinsDelta ?? data.coinDelta ?? data.gold ?? data.goldDelta ?? firstCoin,
    summary: data.summary ?? data.message ?? data.flavor
  };
}

function buildRewardsUserMessage(completedChapter) {
  const slice = state.history.filter(h => h.chapter === completedChapter);
  const log = slice
    .map(
      h =>
        `Scene ${h.sceneInChapter}: [${h.emotion}] ${String(h.chosen).slice(0, 220)}`
    )
    .join('\n');
  return `Chapter ${completedChapter} just ended.

Current stats: HP ${state.hp}/${state.maxHp}, XP ${state.xp}, coins ${state.coins}.

This chapter's decisions (newest relevant lines):
${log || '(no log lines — minimal rewards)'}

The player’s coin total should usually **go up** after a played chapter unless the fiction was truly destitute.

Score this chapter and output JSON only.`;
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function applyRewardsPayload(data, opts = {}) {
  const hpDelta = clamp(Math.round(Number(data.hpDelta) || 0), -30, 25);
  const maxHpDelta = clamp(Math.round(Number(data.maxHpDelta) || 0), -8, 8);
  const xpDelta = clamp(Math.round(Number(data.xpDelta) || 0), 0, 200);
  let coinsDelta = clamp(Math.round(Number(data.coinsDelta) || 0), -50, 120);
  const minStipend = opts.minCoinsStipend;
  if (minStipend != null && coinsDelta < minStipend) {
    coinsDelta = minStipend;
  }
  const summary = String(data.summary || 'The road takes its toll.').slice(0, 280);

  state.maxHp = clamp(state.maxHp + maxHpDelta, 10, 99);
  state.hp = clamp(state.hp + hpDelta, 1, state.maxHp);
  state.xp = Math.max(0, state.xp + xpDelta);
  state.coins = Math.max(0, state.coins + coinsDelta);
  state.level = Math.floor(state.xp / 150) + 1;

  return { hpDelta, maxHpDelta, xpDelta, coinsDelta, summary };
}

function fallbackRewards(completedChapter) {
  const n = state.history.filter(h => h.chapter === completedChapter).length || 1;
  const danger = state.history.filter(h => h.chapter === completedChapter && h.emotion === 'danger').length;
  const xpDelta = clamp(18 + n * 8 + danger * 12, 15, 95);
  const coinsDelta = clamp(18 + n * 4 + danger * 6, 15, 55);
  const hpDelta = danger > 1 ? -clamp(3 + danger * 2, 2, 14) : clamp(2 + Math.floor(n / 2), 0, 10);
  return applyRewardsPayload({
    hpDelta,
    maxHpDelta: 0,
    xpDelta,
    coinsDelta,
    summary: 'You close the chapter — fate tallies your choices.'
  });
}

export function showRewardsModal(payload) {
  return new Promise(resolve => {
    const overlay = document.getElementById('rewards-modal');
    const sumEl = document.getElementById('rewards-modal-summary');
    const hpEl = document.getElementById('rewards-modal-hp');
    const xpEl = document.getElementById('rewards-modal-xp');
    const coinEl = document.getElementById('rewards-modal-coins');
    const ok = document.getElementById('rewards-modal-ok');
    if (!overlay || !ok) {
      resolve();
      return;
    }
    if (sumEl) sumEl.textContent = payload.summary;
    if (hpEl) {
      const maxPart =
        payload.maxHpDelta !== 0
          ? ` (${payload.hpDelta >= 0 ? '+' : ''}${payload.hpDelta} HP, max ${payload.maxHpDelta >= 0 ? '+' : ''}${payload.maxHpDelta})`
          : ` (${payload.hpDelta >= 0 ? '+' : ''}${payload.hpDelta} HP)`;
      hpEl.textContent = `❤ Now ${state.hp} / ${state.maxHp}${maxPart}`;
    }
    if (xpEl) xpEl.textContent = `✧ XP ${payload.xpDelta >= 0 ? '+' : ''}${payload.xpDelta} → ${state.xp} total`;
    if (coinEl) coinEl.textContent = `🪙 Coins ${payload.coinsDelta >= 0 ? '+' : ''}${payload.coinsDelta} → ${state.coins} total`;
    overlay.hidden = false;
    overlay.classList.add('open');
    const done = () => {
      overlay.hidden = true;
      overlay.classList.remove('open');
      ok.removeEventListener('click', done);
      overlay.querySelector('.rewards-modal-scrim')?.removeEventListener('click', done);
      resolve();
    };
    ok.addEventListener('click', done);
    overlay.querySelector('.rewards-modal-scrim')?.addEventListener('click', done);
  });
}

/**
 * AI-scored rewards for a completed chapter; updates state and shows modal.
 */
export async function runChapterRewardsFlow(completedChapter) {
  const sliceLen = state.history.filter(h => h.chapter === completedChapter).length;
  const minCoinsStipend = Math.max(15, 12 + sliceLen * 3);
  let payload;
  try {
    const raw = await callAI(buildRewardsUserMessage(completedChapter), REWARDS_SYSTEM);
    const data = parseRewardsJSON(raw);
    payload = applyRewardsPayload(data, { minCoinsStipend });
  } catch {
    payload = fallbackRewards(completedChapter);
  }
  updateChapterUI();
  await showRewardsModal(payload);
}

export async function claimSagaFinalRewards() {
  if (state.finalSagaRewardsClaimed) return;
  await runChapterRewardsFlow(state.maxChapters);
  state.finalSagaRewardsClaimed = true;
}

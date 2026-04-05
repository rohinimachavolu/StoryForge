import { TOTAL_CHAPTERS, SCENES_PER_CHAPTER_MAX } from './constants.js';
import { formatChapterDirectives } from './formatting.js';
import { primaryPlotStopText } from './plot-helpers.js';

export function buildFirstMessage(prompt, ctx) {
  const {
    plotLines,
    chapter,
    maxChapters,
    chapterBeats,
    chapterNarrationNote,
    sceneInChapter,
    playerHp,
    playerMaxHp,
    playerXp,
    playerCoins,
    proseStyle
  } = ctx;
  const max = maxChapters || TOTAL_CHAPTERS;
  const s = sceneInChapter || 1;
  const beat = primaryPlotStopText(plotLines, chapter, max);
  const directives = formatChapterDirectives(chapterBeats, chapterNarrationNote);
  const dirBlock = directives ? `${directives}\n\n` : '';
  const sheet =
    playerHp != null
      ? `Starting sheet: ${playerHp}/${playerMaxHp} HP \u00b7 ${playerXp} XP \u00b7 ${playerCoins} coins.\n`
      : '';
  const proseHint =
    proseStyle === 'plain'
      ? 'Player chose **plain prose** \u2014 keep scene text simple and direct.\n'
      : 'Player chose **literary / D&D table** prose \u2014 rich but not purple.\n';
  return `Premise: "${prompt}"
${sheet}${proseHint}
Follow that premise and player choices \u2014 no generic template arc. If the premise references an existing fictional universe, ground the world in that lore (locations, factions, tone, rules) and **include key canon characters by name as NPCs** with their real personalities and speech patterns \u2014 but let the player reshape events. Ch.${chapter}/${max}, scene ${s}/${SCENES_PER_CHAPTER_MAX} (opening). Thread: "${beat}"
${dirBlock}Strong hook, clear stakes, 3\u20135 characters (incl. You) each with **gender** (female/male/neutral) and **voiceProfile** aligned to that gender. JSON only; scene text = readable prose only (no meta labels). **Include chapterThemes** (3\u20135 story-specific thematic labels for this chapter). Three choices: I vivid fork; II\u2013III short with quoted speech.`;
}

export function buildNextMessage(history, characters, choice, ctx) {
  const {
    plotLines,
    chapter,
    maxChapters,
    chapterBeats,
    chapterNarrationNote,
    sceneInChapter,
    playerHp,
    playerMaxHp,
    playerXp,
    playerCoins,
    proseStyle
  } = ctx;
  const max = maxChapters || TOTAL_CHAPTERS;
  const s = sceneInChapter || 2;
  const beat = primaryPlotStopText(plotLines, chapter, max);
  const recent = history.slice(-12)
    .map(h => {
      const sc = h.sceneInChapter != null ? ` S${h.sceneInChapter}` : '';
      return `Ch.${h.chapter}${sc}: ${h.scene} | chose: ${h.chosen}`;
    })
    .join('\n');
  const charNames = characters.map(c => c.name).join(', ');
  const directives = formatChapterDirectives(chapterBeats, chapterNarrationNote);
  const dirBlock = directives ? `${directives}\n` : '';
  let sceneNote = '';
  if (chapter === TOTAL_CHAPTERS && s === SCENES_PER_CHAPTER_MAX) {
    sceneNote = `Finale \u2014 full ending from the log.`;
  } else if (s === SCENES_PER_CHAPTER_MAX) {
    sceneNote = `Chapter beat \u2014 close this arc beat.`;
  } else if (s >= 2 && s < SCENES_PER_CHAPTER_MAX) {
    sceneNote = `Mid-scene \u2014 dialogue-led, grounded, distinct voices.`;
  }
  const sheet =
    playerHp != null
      ? `Player sheet: ${playerHp}/${playerMaxHp} HP \u00b7 ${playerXp} XP \u00b7 ${playerCoins} coins.\n`
      : '';
  const proseHint =
    proseStyle === 'plain'
      ? 'Prose: **plain / direct** for this scene.\n'
      : 'Prose: **literary D&D table** tone for this scene.\n';
  return `Cast: ${charNames}
${sheet}${proseHint}Log:\n${recent}
Ch.${chapter}/${max} \u00b7 sc.${s}/${SCENES_PER_CHAPTER_MAX} \u00b7 thread: "${beat}"
${dirBlock}Action: "${choice}"
${sceneNote}
Resolve the player's action with **real consequences** — if they confronted someone, that NPC must react meaningfully (confess, lash out, reveal a secret, or betray). Never stall or deflect when the player pushed hard. The story can complicate the outcome but must not ignore the player's intent. Echo prior picks when it fits. Scene field = story prose only (no rubric pasted into the story). Three choices as usual.`;
}

export function buildChapterAdvanceMessage(ctx) {
  const {
    plotLines, chapter, history, characters, maxChapters,
    chapterBeats, chapterNarrationNote, sceneInChapter,
    playerHp, playerMaxHp, playerXp, playerCoins, proseStyle
  } = ctx;
  const max = maxChapters || TOTAL_CHAPTERS;
  const s = sceneInChapter || 1;
  const beat = primaryPlotStopText(plotLines, chapter, max);
  const recent = history.slice(-12)
    .map(h => {
      const sc = h.sceneInChapter != null ? ` S${h.sceneInChapter}` : '';
      return `Ch.${h.chapter}${sc}: ${h.scene} | chose: ${h.chosen}`;
    })
    .join('\n');
  const charNames = characters.map(c => c.name).join(', ');
  const directives = formatChapterDirectives(chapterBeats, chapterNarrationNote);
  const dirBlock = directives ? `${directives}\n\n` : '';
  let openNote = '';
  if (chapter === max) {
    openNote = `Final chapter open \u2014 recap stakes, hook the climax.`;
  } else if (chapter >= 2) {
    openNote = `New chapter \u2014 recap + fresh hook.`;
  }
  const sheet =
    playerHp != null
      ? `Player sheet: ${playerHp}/${playerMaxHp} HP \u00b7 ${playerXp} XP \u00b7 ${playerCoins} coins.\n`
      : '';
  const proseHint =
    proseStyle === 'plain'
      ? 'Prose: **plain / direct** for this chapter open.\n'
      : 'Prose: **literary D&D table** for this chapter open.\n';
  return `Advance to CHAPTER ${chapter}/${max}. Thread: "${beat}"
${sheet}${proseHint}${dirBlock}Premise-driven; no template arc. Cast: ${charNames}
Log:\n${recent}
${openNote}
Scene 1 of this chapter: include **chapterThemes** (3\u20135 story-specific labels) and voiceProfile on each character. Continue from the log \u2014 carry forward consequences, relationships, and story threads. Don't end saga before ch.${max} sc.${SCENES_PER_CHAPTER_MAX}. Same title. Scene = prose only. Three choices.`;
}

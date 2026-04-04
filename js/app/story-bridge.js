import { buildSystemPrompt } from '../story/index.js';
import { state, SCENE_CAP } from './state.js';

export function storyContext(forNextScene = false) {
  const ch = state.chapter;
  let scene = state.sceneInChapter;
  if (forNextScene) scene = Math.min(scene + 1, SCENE_CAP);
  return {
    playerMode:     state.playerMode,
    narrationTheme: state.narrationTheme,
    plotLines:      [...state.plotLines],
    chapter:        ch,
    maxChapters:    state.maxChapters,
    chapterBeats:   [...(state.chapterBeats[ch] || [])],
    chapterNarrationNote: state.chapterNarrationNotes[ch] || '',
    sceneInChapter: scene,
    playerHp:       state.hp,
    playerMaxHp:    state.maxHp,
    playerXp:       state.xp,
    playerCoins:    state.coins,
    proseStyle:     state.proseStyle
  };
}

/** System prompt for the scene currently on screen (after render). */
export function systemPrompt() {
  return buildSystemPrompt(
    state.playerMode,
    state.narrationTheme,
    state.chapter,
    state.sceneInChapter,
    state.proseStyle
  );
}

const AUTHOR_NEXT_SCENE_SUFFIX = `

**Author mode:** If the player's action line begins with \`✍ AUTHOR\`, it is a **mandatory editorial directive**. Execute it as the core of this beat — visible consequences in prose, cast JSON updated if needed — while staying coherent with the adventure log. Still output valid scene JSON with three choices.`;

/** System prompt for the **next** scene after the player picks a choice. */
export function systemPromptNextScene() {
  const next = Math.min(state.sceneInChapter + 1, SCENE_CAP);
  let base = buildSystemPrompt(
    state.playerMode,
    state.narrationTheme,
    state.chapter,
    next
  );
  if (state.playerMode === 'author') base += AUTHOR_NEXT_SCENE_SUFFIX;
  return base;
}

/** First scene of a chapter (after Next chapter). */
export function systemPromptForChapterOpening(chapterNum) {
  return buildSystemPrompt(
    state.playerMode,
    state.narrationTheme,
    chapterNum,
    1,
    state.proseStyle
  );
}

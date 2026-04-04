import { TOTAL_CHAPTERS, SCENES_PER_CHAPTER_MAX } from '../story/constants.js';

export const SCENE_CAP = SCENES_PER_CHAPTER_MAX;

export const state = {
  prompt:           '',
  title:            '',
  characters:       [],
  history:          [],
  currentScene:     null,
  sceneIndex:       0,
  historyOpen:      false,
  playerMode:       null,
  /** literary = rich D&D-style narration; plain = simple direct English */
  proseStyle:       'literary',
  narrationTheme:   'dystopian',
  plotLines:        [''],
  chapter:          1,
  maxChapters:      TOTAL_CHAPTERS,
  maxUnlockedChapter: 1,
  chapterBeats:     {},
  chapterNarrationNotes: {},
  chapterTitles:    {},
  sceneInChapter:   1,
  /** When true for chapter N, do not overwrite ordered themes from the model on scene 1. */
  chapterThemesUserEdited: {},
  ambientMusicEnabled: true,
  hp:               20,
  maxHp:            20,
  xp:               0,
  coins:            0,
  level:            1,
  finalSagaRewardsClaimed: false,
  /** Last chapter number that already received end-of-chapter rewards (avoids double tally). */
  lastRewardsChapter: 0
};

export const DEFAULT_BEATS_MODAL_SUB =
  'Themes are suggested by the AI after the first scene — drag to reorder (**order is sent to the model**). Edit labels anytime.';

export const EMOTION_CONFIG = {
  romance:   { color:'#e8aac0', badge:'rgba(232,120,160,.15)', icon:'🌹' },
  happy:     { color:'#f7d96e', badge:'rgba(247,200,80,.15)',  icon:'✨' },
  tension:   { color:'#9a8fa0', badge:'rgba(140,100,160,.15)', icon:'⚡' },
  danger:    { color:'#e05555', badge:'rgba(220,50,50,.15)',   icon:'🔴' },
  calm:      { color:'#7ecdc4', badge:'rgba(80,190,180,.15)',  icon:'🌊' },
  adventure: { color:'#8bcf72', badge:'rgba(100,200,80,.15)', icon:'🗺' }
};

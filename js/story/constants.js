export const TOTAL_CHAPTERS = 10;
/** Max scene beats per chapter (scene 1 = opening; each choice advances). */
export const SCENES_PER_CHAPTER_MAX = 8;
export const NUM_PLOT_STOPS = 4;

export const PLOT_PRESETS = {
  dystopian: [
    'Lower strata — precarity, surveillance, and uncertainty among the underclass',
    'Into the heights — infiltration, patronage, or a door opening into the ruling tier',
    'Forging the path — alliances, moral cost, learning the real rules of power',
    'The rise — public reckoning; collapse, coup, or reform; what “hero” means here'
  ],
  victorian: [
    'Respectability under strain — reputation, money, and whispers in drawing rooms',
    'The city’s underbelly — fog, disappearances, and the poor who know too much',
    'Industry’s grip — the factory, the workhouse, secrets in ledgers and blood',
    'The old house — inheritance, scandal, and the face the era shows the world'
  ]
};

export const THEME_LABELS = {
  dystopian: 'dystopian near-future megacity (corporate control, decay, resistance — not necessarily a fixed ending)',
  victorian: 'Victorian-era Britain (class, industry, manners, gaslight mystery — not necessarily a fixed ending)',
  /** Premise-driven only — no bundled plot ladder; shape comes entirely from the player. */
  veilwild:
    'Veilwild — mythic borderlands where old roads cross into forgotten bargains: enchanted wilds, fey-adjacent strangeness, living weather, ruins that seem to remember, odd humor and sharp peril. Not medieval kitchen-sink fantasy by default — let the player’s premise define factions, magic, and scale. Each run is shaped by what they asked for, not a fixed story template.'
};

export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
/** Change in js/story/openai.js if you prefer another OpenAI model. */
export const OPENAI_MODEL = 'gpt-4o-mini';

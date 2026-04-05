import { TOTAL_CHAPTERS, SCENES_PER_CHAPTER_MAX, THEME_LABELS } from './constants.js';

function proseInstruction(proseStyle) {
  if (proseStyle === 'plain') {
    return `**Prose:** Use **simple, direct English** — mostly short sentences, everyday vocabulary, clear cause and effect. No ornate or purple prose, no archaic diction, no showy metaphors every line. Dialogue sounds like real people talking. You can still be exciting; just stay readable and plainspoken.`;
  }
  return `**Prose:** Rich **tabletop-DM narration** — sensory, a little elevated when it fits (like a skilled live Dungeon Master), witty or tense as the scene needs. Avoid gratuitous thesaurus words; stay immersive, not pretentious.`;
}

function agencyInstruction(playerMode) {
  if (playerMode === 'player' || playerMode === 'active') {
    return `Agency — PLAYER: ~80% honor player direction vs DM twists.`;
  }
  if (playerMode === 'witness' || playerMode === 'passive') {
    return `Agency — WITNESS: ~50% player vs world pressure (factions, coincidence, NPCs push back).`;
  }
  if (playerMode === 'author') {
    return `Agency — AUTHOR: ~65% player steering; world still surprises with consequences.`;
  }
  return `Agency — WITNESS: ~50% player vs world-driven pressure.`;
}

export function buildSystemPrompt(
  playerMode,
  narrationTheme,
  promptChapter = 1,
  sceneInChapter = 1,
  proseStyle = 'literary'
) {
  const themeLabel = THEME_LABELS[narrationTheme] || THEME_LABELS.dystopian;
  const agency = agencyInstruction(playerMode);
  const prose = proseInstruction(proseStyle);

  const ch = Math.max(1, Math.min(promptChapter || 1, TOTAL_CHAPTERS));
  const s = Math.min(Math.max(1, sceneInChapter || 1), SCENES_PER_CHAPTER_MAX);
  const isCh1Open = ch === 1 && s === 1;
  const isCh2PlusOpen = ch >= 2 && s === 1;
  const isFinalChOpen = ch === TOTAL_CHAPTERS && s === 1;
  const isMid = s >= 2 && s <= 7;
  const isClosingScene = s === SCENES_PER_CHAPTER_MAX;
  const isGrandFinale = ch === TOTAL_CHAPTERS && isClosingScene;

  const dialogueRules = `Dialogue scenes: mostly \`Speaker — "quote"\` lines + 2–4 short grounding beats (action, place, stakes). Distinct voices; no generic NPC tone. ~70–100 words mid-scenes unless a block below says tighter.`;

  let chapterModeBlock = `**This reply:** Ch.${ch}, scene ${s}/${SCENES_PER_CHAPTER_MAX}. Ch.1 sc.1 = hook + setup; sc.2–7 = dialogue-forward; sc.${SCENES_PER_CHAPTER_MAX} = chapter beat. One continuous story across ${TOTAL_CHAPTERS} chapters.\n`;

  if (isGrandFinale) {
    chapterModeBlock += `**Finale:** Definitive ending; consequences from log; closure. ~120–200 words. Tight narration + a few quoted lines OK.\n`;
  } else if (isCh1Open) {
    chapterModeBlock += `**Ch.1 open:** Strong hook; who/where/stakes clear. 2–4 narrative paragraphs, second person; almost no dialogue. ~130–185 words. JSON: 3–5 characters + You.\n`;
  } else if (isFinalChOpen) {
    chapterModeBlock += `**Final ch. open:** Recap + sharpen endgame stakes. ~100–140 words.\n`;
  } else if (isCh2PlusOpen) {
    chapterModeBlock += `**Ch.${ch} open:** Brief recap + fresh hook. ~95–130 words.\n`;
  } else if (ch === TOTAL_CHAPTERS && isMid) {
    chapterModeBlock += `**Build to finale (sc.${s}):** Narrow toward resolution. ${dialogueRules} ~65–95 words.\n`;
  } else if (isMid) {
    chapterModeBlock += `**Mid-scene:** ${dialogueRules}\n`;
  } else if (isClosingScene && !isGrandFinale) {
    const chLabel = ch === 1 ? 'opening act' : `chapter ${ch}`;
    chapterModeBlock += `**Chapter close (${chLabel}):** Milestone + dialogue-forward. ~80–115 words.\n`;
  }

  const scene1ThemesInstruction =
    s === 1
      ? `
**Scene 1 JSON:** Include \`"chapterThemes"\`: **3–5 short labels** for **this chapter’s** thematic threads (from premise + log). Story-specific wording — not generic filler. **Order** = payoff sequence you propose; the player may reorder in the app.`
      : '';

  const chapterThemesJson =
    s === 1
      ? `,
  "chapterThemes": ["concrete thread from this story", "another thread", "third"]`
      : '';

  return `You are Storyforge's solo DM in the browser.
Setting: ${themeLabel}
Blend fantasy/D&D flavor from the premise with this setting (avoid default medieval soup unless the premise asks).
${agency}
${prose}
**Existing lore:** If the premise references a known fictional universe (books, anime, manga, games, film, TV \u2014 e.g. a specific world, faction, or character name), use your full knowledge of that universe as the foundation: canon locations, factions, power systems, tone, and lore. **Populate the cast with key canon characters from that universe** \u2014 use their real names, personalities, relationships, and speech patterns. The player interacts with these iconic characters as NPCs. The player is the protagonist \u2014 they may diverge from canon freely and reshape events. Treat canon as the backdrop, not a rail. If the premise doesn't reference any known universe, ignore this rule.
Core: Story follows the **player premise + log**, not a template. 3–5 named characters (incl. You); stable cast; sharp personalities for speech.
Second person, sensory stakes, memorable NPCs.
${chapterModeBlock}
**Scene output (critical):** The JSON \`"scene"\` value must be **only prose the player reads** — second person, in-world. **Never** paste instructions, rubric lines, or labels from this prompt (e.g. never start with "Dialogue-heavy:" or "Second person;" as meta text).

**Choices:** Three strings that present genuine **dilemmas** — each should cost something, reveal something, or commit the player to a relationship/stance they can't easily undo. No safe "observe" options; at least one choice should be emotionally risky. **I** ~22–38 words, vivid fork with clear stakes and trade-offs. **II–III** ~8–14 words each, include quoted speech + consequence hint. Ban empty verbs (Investigate, Wait, Look around…). Every prior pick should ripple into these options — choices must feel like they grow from what already happened. Finale scene: still output three short choice strings for valid JSON.
No chapter_label in JSON. Match app chapter numbers if you mention them.

**Read-aloud cast:** Each character MUST include \`"gender"\`: \`"female"\` | \`"male"\` | \`"neutral"\` (presentation in the fiction), and \`"voiceProfile"\`: exactly one of \`narrator\`, \`woman\`, \`woman_alt\`, \`child\`, \`warrior\`, \`man\`, \`elder\`. **Align voiceProfile with gender** (female NPCs → \`woman\` or \`woman_alt\`; male → \`man\`, \`warrior\`, or \`elder\`). Two women in the scene → one \`woman\`, one \`woman_alt\`. \`child\` for kids. \`narrator\` for "You" only.

**speechSegments (required for read-aloud):** Break the \`"scene"\` text into ordered segments for TTS. Each segment is \`{ "type": "narr" | "dlg", "text": "…" }\`. Dialogue segments **must** also include \`"speaker": "CharacterName"\` and \`"voiceProfile"\` (one of \`woman\`, \`woman_alt\`, \`child\`, \`warrior\`, \`man\`, \`elder\`). Pick the voiceProfile that matches the speaker's gender/age — female → \`woman\` or \`woman_alt\`, male → \`man\`/\`warrior\`/\`elder\`, child → \`child\`. Two different women in the same scene should use \`woman\` and \`woman_alt\`. Every word of \`"scene"\` must appear in exactly one segment. Narration = type \`"narr"\`; any quoted speech by a named character = type \`"dlg"\` with just the spoken words (no quotes).
${scene1ThemesInstruction}
Respond with **only** valid JSON, no markdown:
{
  "title": "3-6 words; repeat after first response",
  "scene": "Only in-world prose the player reads (use Speaker — quoted speech when rules require dialogue)",
  "speechSegments": [
    { "type": "narr", "text": "Narration text here…" },
    { "type": "dlg", "speaker": "NPC", "voiceProfile": "woman", "text": "What the character says" },
    { "type": "narr", "text": "More narration…" }
  ],
  "emotion": "romance | happy | tension | danger | calm | adventure",
  "location": "wide environment for image, no people, match theme",
  "characters": [
    { "name": "NPC", "gender": "female", "description": "portrait prompt", "personality": "how they speak", "voiceProfile": "woman" },
    { "name": "You", "gender": "neutral", "description": "player look/role", "personality": "optional", "voiceProfile": "narrator" }
  ],
  "choices": ["I: ...", "II: ...", "III: ..."]${chapterThemesJson}
}
Include "You" in characters.`;
}

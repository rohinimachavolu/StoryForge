var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// js/app/beats-pending.js
function registerBeatsPendingHandler(fn) {
  onResolved = fn;
}
function runPendingAfterBeatsSave(pending) {
  onResolved(pending);
}
var onResolved;
var init_beats_pending = __esm({
  "js/app/beats-pending.js"() {
    onResolved = () => {
    };
  }
});

// js/story/constants.js
var TOTAL_CHAPTERS, SCENES_PER_CHAPTER_MAX, NUM_PLOT_STOPS, PLOT_PRESETS, THEME_LABELS, OPENAI_API_URL, OPENAI_MODEL;
var init_constants = __esm({
  "js/story/constants.js"() {
    TOTAL_CHAPTERS = 10;
    SCENES_PER_CHAPTER_MAX = 8;
    NUM_PLOT_STOPS = 4;
    PLOT_PRESETS = {
      dystopian: [
        "Lower strata \u2014 precarity, surveillance, and uncertainty among the underclass",
        "Into the heights \u2014 infiltration, patronage, or a door opening into the ruling tier",
        "Forging the path \u2014 alliances, moral cost, learning the real rules of power",
        "The rise \u2014 public reckoning; collapse, coup, or reform; what \u201Chero\u201D means here"
      ],
      victorian: [
        "Respectability under strain \u2014 reputation, money, and whispers in drawing rooms",
        "The city\u2019s underbelly \u2014 fog, disappearances, and the poor who know too much",
        "Industry\u2019s grip \u2014 the factory, the workhouse, secrets in ledgers and blood",
        "The old house \u2014 inheritance, scandal, and the face the era shows the world"
      ]
    };
    THEME_LABELS = {
      dystopian: "dystopian near-future megacity (corporate control, decay, resistance \u2014 not necessarily a fixed ending)",
      victorian: "Victorian-era Britain (class, industry, manners, gaslight mystery \u2014 not necessarily a fixed ending)"
    };
    OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    OPENAI_MODEL = "gpt-4o-mini";
  }
});

// js/app/state.js
var SCENE_CAP, state, DEFAULT_BEATS_MODAL_SUB, EMOTION_CONFIG;
var init_state = __esm({
  "js/app/state.js"() {
    init_constants();
    SCENE_CAP = SCENES_PER_CHAPTER_MAX;
    state = {
      prompt: "",
      title: "",
      characters: [],
      history: [],
      currentScene: null,
      sceneIndex: 0,
      historyOpen: false,
      /** 'author' | 'player' | 'witness' | null until chosen */
      playerMode: null,
      playerIdentity: "",
      playerStoryRole: "",
      narrationTheme: "dystopian",
      plotLines: [...PLOT_PRESETS.dystopian],
      chapter: 1,
      maxChapters: TOTAL_CHAPTERS,
      maxUnlockedChapter: 1,
      chapterBeats: {},
      chapterNarrationNotes: {},
      chapterTitles: {},
      sceneInChapter: 1,
      pendingAfterBeatsSave: null
    };
    DEFAULT_BEATS_MODAL_SUB = "Drag to rearrange story beats for this chapter. They steer the AI while you play this chapter. Open anytime from the Story arc sidebar.";
    EMOTION_CONFIG = {
      romance: { color: "#e8aac0", badge: "rgba(232,120,160,.15)", icon: "\u{1F339}" },
      happy: { color: "#f7d96e", badge: "rgba(247,200,80,.15)", icon: "\u2728" },
      tension: { color: "#9a8fa0", badge: "rgba(140,100,160,.15)", icon: "\u26A1" },
      danger: { color: "#e05555", badge: "rgba(220,50,50,.15)", icon: "\u{1F534}" },
      calm: { color: "#7ecdc4", badge: "rgba(80,190,180,.15)", icon: "\u{1F30A}" },
      adventure: { color: "#8bcf72", badge: "rgba(100,200,80,.15)", icon: "\u{1F5FA}" }
    };
  }
});

// js/app/sidebar.js
var sidebar_exports = {};
__export(sidebar_exports, {
  getChapterDisplayTitle: () => getChapterDisplayTitle,
  renderStoryArcSidebar: () => renderStoryArcSidebar
});
function getChapterDisplayTitle(n) {
  const t = (state.chapterTitles[n] || "").trim();
  return t || `Chapter ${n}`;
}
function renderStoryArcSidebar() {
  const ul = document.getElementById("story-arc-list");
  if (!ul) return;
  ul.innerHTML = "";
  const max = state.maxChapters;
  for (let n = 1; n <= max; n++) {
    const locked = n > state.maxUnlockedChapter;
    const active = n === state.chapter;
    const li = document.createElement("li");
    li.className = "story-arc-item" + (active ? " is-active" : "") + (locked ? " is-locked" : "");
    li.setAttribute("role", "button");
    li.tabIndex = 0;
    li.title = locked ? "Plan or edit beats for this chapter (story unlocks here when you advance). Click to open." : "Click to edit beats and narration steer for this chapter.";
    const label = document.createElement("span");
    label.className = "story-arc-item-label";
    label.textContent = getChapterDisplayTitle(n);
    const meta = document.createElement("span");
    meta.className = "story-arc-item-meta";
    meta.textContent = `Ch. ${n}`;
    const icon = document.createElement("span");
    icon.className = "story-arc-item-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = locked ? "\u{1F512}" : active ? "\u25B6" : "\u25C7";
    li.appendChild(label);
    li.appendChild(meta);
    li.appendChild(icon);
    li.addEventListener("click", () => openBeatsModal(n));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openBeatsModal(n);
      }
    });
    ul.appendChild(li);
  }
}
var init_sidebar = __esm({
  "js/app/sidebar.js"() {
    init_beats_modal();
    init_state();
  }
});

// js/app/beats-modal.js
function openBeatsModal(chapterNum, opts = {}) {
  if (chapterNum < 1 || chapterNum > state.maxChapters) return;
  beatsModalChapter = chapterNum;
  const modal = document.getElementById("beats-modal");
  const titleEl = document.getElementById("beats-modal-heading");
  const subEl = document.getElementById("beats-modal-sub");
  const saveBtn = document.getElementById("beats-save-btn");
  const chapterTitleInput = document.getElementById("beats-chapter-title-input");
  const list = document.getElementById("beats-modal-list");
  const note = document.getElementById("beats-narration-note");
  if (!modal || !list) return;
  if (subEl) {
    if (opts.gateFor === "start") {
      subEl.textContent = "Set beats for Chapter 1 before the first scene loads. You can reopen this anytime from the Story arc sidebar.";
    } else if (opts.gateFor === "advance") {
      subEl.textContent = `Review or edit beats for chapter ${chapterNum} before it begins. Change beats anytime from the sidebar.`;
    } else {
      subEl.textContent = DEFAULT_BEATS_MODAL_SUB;
    }
  }
  if (saveBtn) {
    if (opts.gateFor === "start") saveBtn.textContent = "\u2713 Start story";
    else if (opts.gateFor === "advance") saveBtn.textContent = "\u2713 Continue to chapter";
    else saveBtn.textContent = "\u2713 Set story beats";
  }
  const beats = [...state.chapterBeats[chapterNum] || ["Beat 1", "Beat 2", "Beat 3"]];
  state.chapterBeats[chapterNum] = beats;
  titleEl.textContent = `CHAPTER ${chapterNum}`;
  chapterTitleInput.value = state.chapterTitles[chapterNum] || "";
  note.value = state.chapterNarrationNotes[chapterNum] || "";
  list.innerHTML = "";
  beats.forEach((text) => {
    list.appendChild(createBeatRowEl(text));
  });
  modal.hidden = false;
  modal.classList.add("open");
  chapterTitleInput.focus();
}
function createBeatRowEl(text) {
  const li = document.createElement("li");
  li.className = "beat-row";
  const handle = document.createElement("span");
  handle.className = "beat-drag-handle";
  handle.title = "Drag to reorder";
  handle.textContent = "\u22EE\u22EE";
  handle.draggable = true;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "beat-input";
  input.value = text;
  input.placeholder = "Story beat\u2026";
  li.appendChild(handle);
  li.appendChild(input);
  handle.addEventListener("dragstart", (e) => {
    const list = document.getElementById("beats-modal-list");
    if (!list) return;
    const rows = [...list.querySelectorAll(".beat-row")];
    const idx = rows.indexOf(li);
    e.dataTransfer.setData("text/plain", String(idx));
    e.dataTransfer.effectAllowed = "move";
    li.classList.add("dragging");
  });
  handle.addEventListener("dragend", () => li.classList.remove("dragging"));
  li.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });
  li.addEventListener("drop", (e) => {
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData("text/plain"), 10);
    const list = document.getElementById("beats-modal-list");
    if (!list || Number.isNaN(from)) return;
    const rows = [...list.querySelectorAll(".beat-row")];
    const to = rows.indexOf(li);
    if (to < 0 || from === to) return;
    const ch = beatsModalChapter;
    const arr = [...state.chapterBeats[ch] || []];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    state.chapterBeats[ch] = arr;
    list.innerHTML = "";
    arr.forEach((t) => list.appendChild(createBeatRowEl(t)));
  });
  return li;
}
function resetBeatsModalChrome() {
  const saveBtn = document.getElementById("beats-save-btn");
  const subEl = document.getElementById("beats-modal-sub");
  if (saveBtn) saveBtn.textContent = "\u2713 Set story beats";
  if (subEl) subEl.textContent = DEFAULT_BEATS_MODAL_SUB;
}
function closeBeatsModal() {
  const modal = document.getElementById("beats-modal");
  if (modal) {
    modal.hidden = true;
    modal.classList.remove("open");
  }
  beatsModalChapter = null;
  resetBeatsModalChrome();
}
function cancelPendingAfterBeatsSave() {
  const p = state.pendingAfterBeatsSave;
  state.pendingAfterBeatsSave = null;
  if (p === "start") {
    const btn = document.getElementById("start-chapter-btn");
    if (btn) btn.disabled = false;
  } else if (typeof p === "number") {
    const nextBtn = document.getElementById("next-chapter-btn");
    if (nextBtn) nextBtn.disabled = false;
  }
}
function dismissBeatsModal() {
  if (state.pendingAfterBeatsSave != null) cancelPendingAfterBeatsSave();
  closeBeatsModal();
}
function saveBeatsFromModal() {
  if (beatsModalChapter == null) return;
  const ch = beatsModalChapter;
  const list = document.getElementById("beats-modal-list");
  const chapterTitleInput = document.getElementById("beats-chapter-title-input");
  const note = document.getElementById("beats-narration-note");
  const inputs = list ? [...list.querySelectorAll(".beat-input")] : [];
  const beats = inputs.map((inp) => inp.value.trim()).filter(Boolean);
  state.chapterBeats[ch] = beats.length ? beats : ["Story beat"];
  state.chapterTitles[ch] = chapterTitleInput && chapterTitleInput.value.trim() || "";
  state.chapterNarrationNotes[ch] = note && note.value.trim() || "";
  const pending = state.pendingAfterBeatsSave;
  state.pendingAfterBeatsSave = null;
  closeBeatsModal();
  Promise.resolve().then(() => (init_sidebar(), sidebar_exports)).then((m) => {
    m.renderStoryArcSidebar();
    runPendingAfterBeatsSave(pending);
  });
}
function addBeatRow() {
  if (beatsModalChapter == null) return;
  const ch = beatsModalChapter;
  const list = document.getElementById("beats-modal-list");
  if (!list) return;
  const arr = [...state.chapterBeats[ch] || []];
  arr.push("New beat");
  state.chapterBeats[ch] = arr;
  list.innerHTML = "";
  arr.forEach((t) => list.appendChild(createBeatRowEl(t)));
}
var beatsModalChapter;
var init_beats_modal = __esm({
  "js/app/beats-modal.js"() {
    init_beats_pending();
    init_state();
    beatsModalChapter = null;
  }
});

// js/app/main.js
init_beats_pending();
init_beats_modal();

// js/story/index.js
init_constants();

// js/story/plot-helpers.js
init_constants();
function primaryBeatIndex(chapter, maxChapters, numStops) {
  if (numStops <= 1) return 0;
  const cap = Math.max(2, maxChapters);
  const t = (chapter - 1) / (cap - 1);
  return Math.min(numStops - 1, Math.floor(t * numStops));
}
function primaryPlotStopText(plotLines, chapter, maxChapters) {
  const n = plotLines.length || NUM_PLOT_STOPS;
  const i = primaryBeatIndex(chapter, maxChapters, n);
  return plotLines[i] || plotLines[0] || "";
}

// js/story/formatting.js
function formatPlotStops(plotLines) {
  return plotLines.map((p, i) => `${i + 1}. ${p.trim() || "(plot stop)"}`).join("\n");
}
function formatChapterDirectives(beats, narrationNote) {
  const lines = Array.isArray(beats) ? beats.map((t) => String(t || "").trim()).filter(Boolean) : [];
  const note = String(narrationNote || "").trim();
  let out = "";
  if (lines.length) {
    out += `This chapter\u2019s story beats (in order \u2014 hit them naturally across scenes in this chapter; don\u2019t skip without cause):
${lines.map((t, i) => `${i + 1}. ${t}`).join("\n")}
`;
  }
  if (note) {
    out += `Player narration steer for this chapter (honor strongly unless it contradicts the premise or prior canon): ${note}
`;
  }
  return out.trim();
}

// js/story/system-prompt.js
init_constants();
function agencyBlock(playerMode) {
  if (playerMode === "author") {
    return `Story role \u2014 AUTHOR: The player's choices, backstory, and declared actions may **reshape** scenes, NPCs, factions, and plot turns. Honor their direction strongly; the world reacts and complicates, but does not railroad away from their steering. Emergent twists should feel like consequences of their play, not replacement of it.`;
  }
  if (playerMode === "player") {
    return `Story role \u2014 PLAYER: Prioritize the **playable character's** declared actions and dialogue (~50% player steering vs world pressure). Factions, coincidence, and NPC agendas still push back with real weight. Avoid overwriting their character's agency with unrelated plot swerves.`;
  }
  if (playerMode === "witness") {
    return `Story role \u2014 WITNESS: Hold a **fixed narrative backbone** \u2014 user plot stops, chapter beats, and narration steer are primary. Player choices should **narrowly** interpret, flavor, or momentarily branch scenes; avoid large unprompted rewrites of the arc. The world may surprise them, but major story shape stays on the rails they set.`;
  }
  if (playerMode === "active") {
    return agencyBlock("author");
  }
  if (playerMode === "passive") {
    return agencyBlock("player");
  }
  return agencyBlock("player");
}
function buildSystemPrompt(playerMode, narrationTheme, promptChapter = 1, sceneInChapter = 1) {
  const themeLabel = THEME_LABELS[narrationTheme] || THEME_LABELS.dystopian;
  const agency = agencyBlock(playerMode);
  const ch = Math.max(1, Math.min(promptChapter || 1, TOTAL_CHAPTERS));
  const s = Math.min(Math.max(1, sceneInChapter || 1), SCENES_PER_CHAPTER_MAX);
  const isCh1Open = ch === 1 && s === 1;
  const isCh2PlusOpen = ch >= 2 && s === 1;
  const isFinalChOpen = ch === TOTAL_CHAPTERS && s === 1;
  const isMid = s >= 2 && s <= 7;
  const isClosingScene = s === SCENES_PER_CHAPTER_MAX;
  const isGrandFinale = ch === TOTAL_CHAPTERS && isClosingScene;
  const dialogueHeavyMid = `**SCENES 2\u20137 \u2014 DIALOGUE-HEAVY (every chapter):**
- **Most of the scene must be spoken exchange** \u2014 back-and-forth, tension, humor, or subtext \u2014 using **SpeakerName \u2014 "words"** on their own lines (em dash, straight double quotes); **You** when the player speaks aloud.
- **Always** weave in **2\u20134 short narration lines** that explain **what is happening** (where you are, what just shifted, what\u2019s at stake) so the player never feels lost.
- **Voices must be vivid and unmistakably different**: vocabulary, rhythm, attitude, and worldview per NPC \u2014 no samey dialogue. Make lines **fun to read** and **actorly**.
- **About 70\u2013100 words** \u2014 prioritize **dialogue volume** over long exposition blocks.`;
  let chapterModeBlock = `**SCENE & CHAPTER STRUCTURE (app-enforced):**
- Each chapter has **at most ${SCENES_PER_CHAPTER_MAX} scenes**. This response is **chapter ${ch}, scene ${s} of ${SCENES_PER_CHAPTER_MAX}**.
- **Scene 1** of every chapter = **scenario-setting** (situation frame, recap when needed). **Chapter 1 scene 1** = the **strongest** hook \u2014 defines the whole story start.
- **Scenes 2\u20137** = **dialogue-heavy** + **brief situational explanation** every time (see below).
- **Scene ${SCENES_PER_CHAPTER_MAX}** = **chapter milestone** (still dialogue-forward unless saga finale rules say otherwise).
- **Chapters 2\u2013${TOTAL_CHAPTERS}** continue **one continuous story** from prior chapters.
`;
  if (isGrandFinale) {
    chapterModeBlock += `**FINALE \u2014 CHAPTER ${TOTAL_CHAPTERS}, SCENE ${SCENES_PER_CHAPTER_MAX}:** Deliver the **definitive ending** of the whole saga. **Weave in consequences** of the player\u2019s major choices from the adventure log \u2014 who lived, what broke, what was won, what price was paid. Aim for **emotional satisfaction**, **surprise with hindsight**, and **closure** (no cliffhanger). You may use **tight narration** plus **a few** \`Speaker \u2014 "quote"\` lines if it serves the ending. About **120\u2013200 words**. This is the **last** story beat \u2014 land it.`;
  } else if (isCh1Open) {
    chapterModeBlock += `**CHAPTER 1 \u2014 OPENING SCENE (strongest scenario):**
- This is the **first scene of the entire story**. Make it **impossible to skim**: crystal-clear **who/where/when/why it matters**, visceral stakes, and a **magnetic** hook into what could happen next.
- **2\u20134 narrative paragraphs**, second person. **No** screenplay-style stacked dialogue. **At most one** tiny spoken line in the whole scene if essential.
- **About 130\u2013185 words** \u2014 prioritize **definition and punch** over length.
- Still define **3\u20135 named characters** (including "You") in JSON with personalities.`;
  } else if (isFinalChOpen) {
    chapterModeBlock += `**CHAPTER ${TOTAL_CHAPTERS} \u2014 OPENING (final chapter):**
- Start with a **tight recap** of the journey so far (key turns, wounds, allies, enemies) \u2014 **then** sharpen **final stakes** and **pull the player forward** with urgency and hunger to see the end.
- **2\u20133 short paragraphs**; may include light dialogue. **About 100\u2013140 words.**`;
  } else if (isCh2PlusOpen) {
    chapterModeBlock += `**CHAPTER ${ch} \u2014 OPENING AFTER A BREAK:**
- Begin with a **brief recap** of what mattered last chapter and overall (3\u20136 sentences) \u2014 **then** a **fresh hook**: new pressure, opportunity, or mystery that makes the player want **another scene**.
- Transition smoothly into **this chapter\u2019s** path emphasis. **About 95\u2013130 words.** Dialogue optional but energizing.`;
  } else if (ch === TOTAL_CHAPTERS && isMid) {
    chapterModeBlock += `**CHAPTER ${TOTAL_CHAPTERS} \u2014 BUILD TO FINALE (scene ${s}):**
- Every beat **narrows** toward the **final resolution**; escalate, complicate, or deepen \u2014 **no** premature full ending yet.
${dialogueHeavyMid}
- Slightly **tighter** if needed: **65\u201395 words** total.`;
  } else if (isMid) {
    chapterModeBlock += `**CHAPTER ${ch} \u2014 SCENE ${s} (dialogue-first):**
${dialogueHeavyMid}`;
  } else if (isClosingScene && !isGrandFinale) {
    const chLabel = ch === 1 ? "opening act" : `chapter ${ch}`;
    chapterModeBlock += `**CHAPTER ${ch} \u2014 CLOSING SCENE ${SCENES_PER_CHAPTER_MAX} (milestone):**
- Land a **clear milestone** for the **${chLabel}**: revelation, cost, commitment, or shift that **closes this chapter\u2019s arc** and tees up what\u2019s next.
- **Dialogue-heavy** like scenes 2\u20137, plus **short situational beats** so the turn lands. **About 80\u2013115 words.**`;
  }
  let sceneJsonHint = "Second person; no chapter header in scene text.";
  if (isGrandFinale) {
    sceneJsonHint = 'Finale: resolution and closure reflecting player choices; may mix tight narration and a few Speaker \u2014 "quote" lines';
  } else if (isCh1Open) {
    sceneJsonHint = "2\u20134 narrative paragraphs; strongest story-start scenario; second person";
  } else if ((isMid || isClosingScene && !isGrandFinale) && ch === 1) {
    sceneJsonHint = 'Dialogue-heavy: many Speaker \u2014 "quote" lines + short situational narration; second person';
  } else if (isCh2PlusOpen || isFinalChOpen) {
    sceneJsonHint = "Recap + hook + continuation; 2\u20133 paragraphs; second person";
  } else if (ch >= 2 && (isMid || isClosingScene && !isGrandFinale)) {
    sceneJsonHint = 'Dialogue-heavy: Speaker \u2014 "quote" lines + situational narration; second person';
  } else if (ch >= 2) {
    sceneJsonHint = "Short narration lines + dialogue as Speaker \u2014 spoken lines in double quotes; second person";
  }
  return `You are the narrator and game master for Storyforge \u2014 a solo interactive story in the browser.
Setting and tone: ${themeLabel}
If the player premise mentions fantasy or D&D-style elements, weave them into this setting (e.g. strange powers, odd kin, arcane tech) instead of defaulting to medieval fantasy.
${agency}
Structure (critical distinctions):
- The player ordered exactly FOUR **story-path stops** (plot backbone). These define the ORDER and SHAPE of the narrative (e.g. underclass \u2192 infiltration \u2192 power struggle \u2192 reckoning). They are NOT a cast list and NOT character names \u2014 treat them as milestones the plot should move through across the session.
- **Characters** are separate: you invent 3-5 named roles (including "You") as people in the world. Do not confuse a plot stop with a character.
- The tale runs in **${TOTAL_CHAPTERS} chapters** total (see user messages for current chapter). Spread the four path stops across those chapters: early chapters emphasize earlier stops in the player\u2019s order, later chapters later stops, with smooth handoffs. The user may click \u201CNext chapter\u201D to advance; each chapter opening should feel like a new narrative unit while staying one continuous story.
- Do not mandate a single fixed ending in advance; stay emergent within the chosen path.
- Second person to the player ("You"). Sharp sensory detail, clear stakes, memorable NPCs.
- Create ONLY 3-5 named characters (including "You"). Keep the cast stable; add new names only when necessary. In **personality** fields, make speech habits and worldview **sharp and different** so dialogue in scenes 2+ can stay vivid and readable.
${chapterModeBlock}
**CHOICES \u2014 every chapter; Option I must hook instantly (creative, never boilerplate):**
- **choices[0] (Option I) \u2014 the scenario fork / main hook:** **Always the longest option** and the one that should **grab the player in one read**. One string, about **22\u201338 words.** Spell out a **clear, exciting branch**: what tilts (place, faction, risk, secret, timer, moral line) in **vivid, specific** fiction tied to **this** beat. **Banned** unless completely reimagined with unique detail: "Investigate", "Keep going", "Talk to them", "Wait", "Look around", "Proceed", "See what happens", "Stay quiet", "Follow", "Attack", "Run" as single-word or empty verbs. **Vary** how you phrase I each time so options never feel copy-pasted.
- **choices[1] and choices[2] (II & III) \u2014 shorter, dialogue-led, scenario-grounded:** Each must be **noticeably shorter than I** \u2014 about **8\u201314 words total** (tight). **Lead with voice:** include **at least one spoken line** in straight double quotes (what You say, whisper, or snap). **Immediately add** a **tiny scenario explanation** \u2014 who might hear, what it gambles, what it forces, or what door it opens/closes \u2014 so the player feels the **fiction**, not a menu label. Good shape: \`You say, "The roof, now." \u2014 dragging them toward the hatch before the lights die.\` Bad: \`Ask about the map.\` with no quote and no stakes.
- **CONSEQUENCES (non-negotiable):** User messages include a **log of what the player chose** (options I\u2013IV). **Every** pick \u2014 most recent **and** earlier ones you still see \u2014 must **ripple**: consequences **this scene** (trust, injury, clue, alarm, debt, ally, enemy, object, rumor) **and/or** a **planted payoff** one or more beats later that lands as a **wow** (twist, irony, betrayal, mercy, cosmic joke, unlikely rescue) while still feeling **earned**. **Never** answer a choice with "nothing really changes" or a shrug. Surprise them when you can; **fair surprise** beats random chaos.
- **Finale note:** If this is **chapter ${TOTAL_CHAPTERS}, scene ${SCENES_PER_CHAPTER_MAX}**, the app **hides** choice buttons \u2014 still output **three short choice strings** (thematic echoes or postscript labels) so JSON stays valid.
- Offer exactly THREE strings in "choices" in that order. The UI adds IV for free-typed input \u2014 never a fourth string.
- The UI shows the real chapter number from the app. Do not output chapter_label. Do not open the scene with "Chapter 2" or similar unless it matches the chapter number in the user message.
- ALWAYS respond with ONLY valid JSON. No markdown, no preamble. Format:
{
  "title": "Evocative story title (3-6 words; first response only, then repeat exactly)",
  "scene": "${sceneJsonHint}",
  "emotion": "romance | happy | tension | danger | calm | adventure",
  "location": "brief environment for a wide scene image, no people \u2014 match the chosen theme",
  "characters": [
    { "name": "NPC name", "description": "brief portrait prompt matching the era/theme", "personality": "one sentence: worldview, motives, and how they speak" },
    { "name": "You", "description": "player character appearance and role", "personality": "optional; omit or one short line if it helps consistency" }
  ],
  "choices": ["I: long hooking scenario fork (22\u201338 words, specific)", "II: 8\u201314 words \u2014 dialogue in quotes + scenario bite", "III: 8\u201314 words \u2014 dialogue in quotes + scenario bite"]
}
- Always include "You" in characters.`;
}

// js/story/messages.js
init_constants();
function playerCastBlock(ctx) {
  const id = ctx.playerIdentity && String(ctx.playerIdentity).trim() || "";
  const role = ctx.playerStoryRole && String(ctx.playerStoryRole).trim() || "";
  if (!id && !role) return "";
  let out = "Player casting (honor in JSON cast and scenes):\n";
  if (id) out += `- Who they play: ${id}
`;
  if (role) out += `- What they want in the story: ${role}
`;
  return `${out}
`;
}
function buildFirstMessage(prompt, ctx) {
  const { plotLines, chapter, maxChapters, chapterBeats, chapterNarrationNote, sceneInChapter } = ctx;
  const max = maxChapters || TOTAL_CHAPTERS;
  const s = sceneInChapter || 1;
  const beat = primaryPlotStopText(plotLines, chapter, max);
  const directives = formatChapterDirectives(chapterBeats, chapterNarrationNote);
  const dirBlock = directives ? `${directives}

` : "";
  const castBlock = playerCastBlock(ctx);
  return `Adventure premise from the player: "${prompt}"

${castBlock}User-ordered STORY PATH (four plot stops \u2014 narrative shape only, NOT characters). This order is fixed for the run; honor it across ${max} chapters:
${formatPlotStops(plotLines)}

Current: CHAPTER ${chapter} of ${max}, **SCENE ${s} of ${SCENES_PER_CHAPTER_MAX}** (chapter opening). Primary path emphasis for this stage: "${beat}"
${dirBlock}Write the **definitive story-start**: strongest scenario hook, world and stakes crystal-clear. Introduce 3-5 characters (including "You") in JSON. **Choices:** **I** = long, irresistible scenario fork; **II\u2013III** = shorter, **dialogue + mini scenario** each. **Every** choice must **matter** with surprising, earned payoffs later. Set title once.`;
}
function buildNextMessage(history, characters, choice, ctx) {
  const { plotLines, chapter, maxChapters, chapterBeats, chapterNarrationNote, sceneInChapter } = ctx;
  const max = maxChapters || TOTAL_CHAPTERS;
  const s = sceneInChapter || 2;
  const beat = primaryPlotStopText(plotLines, chapter, max);
  const recent = history.slice(-12).map((h) => {
    const sc = h.sceneInChapter != null ? ` S${h.sceneInChapter}` : "";
    return `Ch.${h.chapter}${sc}: ${h.scene} | Player chose: ${h.chosen}`;
  }).join("\n");
  const charNames = characters.map((c) => c.name).join(", ");
  const directives = formatChapterDirectives(chapterBeats, chapterNarrationNote);
  const dirBlock = directives ? `${directives}
` : "";
  let sceneNote = "";
  if (chapter === TOTAL_CHAPTERS && s === SCENES_PER_CHAPTER_MAX) {
    sceneNote = `This is the **SAGA FINALE** (chapter ${TOTAL_CHAPTERS}, scene ${SCENES_PER_CHAPTER_MAX}). Deliver the **full ending**; reflect their choices from the log.`;
  } else if (s === SCENES_PER_CHAPTER_MAX) {
    sceneNote = `This is **scene ${SCENES_PER_CHAPTER_MAX} of ${SCENES_PER_CHAPTER_MAX}** \u2014 land a **chapter milestone** that closes this arc and points forward.`;
  } else if (s >= 2 && s < SCENES_PER_CHAPTER_MAX) {
    sceneNote = `Scene ${s}: **dialogue-heavy** \u2014 vivid, **distinct** character voices; always include **short situational explanation** so the player knows what\u2019s happening.`;
  }
  const castReminder = playerCastBlock(ctx).replace(/\n\n$/, "");
  const reminderLine = castReminder ? `${castReminder}
` : "";
  return `${reminderLine}Cast: ${charNames}
Log:
${recent}
Chapter ${chapter} of ${max} \u2014 **scene ${s} of ${SCENES_PER_CHAPTER_MAX}** \u2014 story-path emphasis: "${beat}"
${dirBlock}Player declares: "${choice}"
${sceneNote}
${s >= 2 && s < SCENES_PER_CHAPTER_MAX ? `Resolve with **lots of** \`Speaker \u2014 "quote"\` lines, **different** voices, plus tight situational narration between beats.` : s === SCENES_PER_CHAPTER_MAX && !(chapter === TOTAL_CHAPTERS && s === SCENES_PER_CHAPTER_MAX) ? `Resolve the **chapter milestone** with dialogue + clarity on what changed.` : ""}
**Honor their declared action:** make the outcome **bold and felt** \u2014 immediate twist, cost, revelation, or gain; **no flat "nothing happens".** Let prior log choices **echo** when it fits. Then three new choices: **I** = long scenario hook; **II\u2013III** = **8\u201314 words**, each with **quoted dialogue + scenario bite** (unless finale scene \u2014 see system prompt). Same title. Same cast unless unavoidable.`;
}
function buildChapterAdvanceMessage(ctx) {
  const { plotLines, chapter, history, characters, maxChapters, chapterBeats, chapterNarrationNote, sceneInChapter } = ctx;
  const max = maxChapters || TOTAL_CHAPTERS;
  const s = sceneInChapter || 1;
  const beat = primaryPlotStopText(plotLines, chapter, max);
  const last = history.length ? history[history.length - 1] : null;
  const charNames = characters.map((c) => c.name).join(", ");
  const directives = formatChapterDirectives(chapterBeats, chapterNarrationNote);
  const dirBlock = directives ? `${directives}

` : "";
  let openNote = "";
  if (chapter === max) {
    openNote = `**Final chapter opening** \u2014 **scene ${s} of ${SCENES_PER_CHAPTER_MAX}**: recap the journey, sharpen endgame stakes, **hook** them hard for the climax arc.`;
  } else if (chapter >= 2) {
    openNote = `**New chapter \u2014 scene ${s} of ${SCENES_PER_CHAPTER_MAX}**: start with a **recap** of what just mattered, **then** a fresh hook and continuation (not as long or heavy as chapter 1\u2019s very first scene).`;
  }
  const castReminder = playerCastBlock(ctx).replace(/\n\n$/, "");
  const openCast = castReminder ? `${castReminder}

` : "";
  return `${openCast}The player advances to CHAPTER ${chapter} of ${max}.
Story-path emphasis for this chapter: "${beat}"
${dirBlock}Full ordered path stops:
${formatPlotStops(plotLines)}
Cast: ${charNames}
${last ? `Last player action before chapter break: "${last.chosen}"` : ""}
${openNote}
Carry **forward consequences** from prior chapters \u2014 at least one **surprising but fair** beat or planted payoff. Do not fully **end** the saga until **chapter ${max}, scene ${SCENES_PER_CHAPTER_MAX}**. Same ongoing title if set. New choices: **I** = long scenario hook (22\u201338 words); **II\u2013III** = **8\u201314 words**, dialogue in quotes + scenario.`;
}

// js/story/openai.js
init_constants();
function getOpenAiKey() {
  if (typeof window === "undefined") return "";
  const fromWindow = typeof window.STORYFORGE_OPENAI_KEY !== "undefined" && window.STORYFORGE_OPENAI_KEY !== null ? String(window.STORYFORGE_OPENAI_KEY).trim() : "";
  if (fromWindow) return fromWindow;
  const legacyKey = typeof globalThis.API_KEY !== "undefined" ? globalThis.API_KEY : "";
  if (legacyKey) {
    const k = String(legacyKey).trim();
    if (k) return k;
  }
  return "";
}
function isPlaceholderKey(key) {
  const p = (key || "").toUpperCase();
  return p.includes("PASTE_YOUR") || p.includes("PASTE_HERE") || p === "YOUR_OPENAI_API_KEY_HERE" || p === "YOUR_GROQ_API_KEY_HERE";
}
async function callAI(userMessage, systemPrompt) {
  let key = getOpenAiKey();
  if (key && isPlaceholderKey(key)) key = "";
  if (!key) {
    const wrongServer = typeof window !== "undefined" && window.__STORYFORGE_CONFIG_JS_FAILED__;
    if (wrongServer) {
      throw new Error(
        "config.js did not load. Copy config.example.js to config.js with your OpenAI key, or run python serve.py with OPENAI_API_KEY in .env."
      );
    }
    throw new Error(
      "No OpenAI API key. Put your key in config.js (copy config.example.js) or OPENAI_API_KEY in .env and run python serve.py."
    );
  }
  const res = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 1200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "API error");
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content || !String(content).trim()) {
    throw new Error("Empty reply from the model. Try again or check your API key.");
  }
  return content;
}
function parseSceneJSON(raw) {
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Could not parse story response.");
  return JSON.parse(clean.slice(start, end + 1));
}

// js/story/images.js
function sceneImageStyle(narrationTheme) {
  if (narrationTheme === "victorian") return "Victorian England 1890s, gaslight, cinematic environment, highly detailed, painterly, no people, atmospheric";
  return "dystopian sci-fi city, cinematic environment, highly detailed, painterly, no people, atmospheric, neon and decay";
}
function portraitStyle(narrationTheme) {
  if (narrationTheme === "victorian") return "Victorian era character portrait, period costume, painterly, detailed face, soft dramatic lighting, upper body";
  return "dystopian sci-fi character portrait, detailed face, painterly, cinematic lighting, upper body";
}
function getSceneBgUrl(location, emotion, narrationTheme) {
  const style = sceneImageStyle(narrationTheme);
  const prompt = `${location}, ${emotion} mood, ${style}, wide angle`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
}
function getCharacterPortraitUrl(description, name, narrationTheme) {
  const style = portraitStyle(narrationTheme);
  const prompt = `portrait of ${description}, character named ${name}, ${style}`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=500&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
}

// js/app/chapter-advance.js
init_beats_modal();

// js/app/html-utils.js
function escapeForHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
function escapeAttr(s) {
  if (s == null || s === "") return "";
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;");
}

// js/app/portraits.js
init_state();
function mergeCharacterLists(prev, incoming) {
  if (!incoming || incoming.length === 0) return prev;
  const merged = prev.map((c) => ({ ...c }));
  const indexByName = new Map(merged.map((c, i) => [c.name, i]));
  incoming.forEach((c) => {
    const i = indexByName.get(c.name);
    if (i !== void 0) {
      if (c.personality) merged[i].personality = c.personality;
      if (c.description) merged[i].description = c.description;
    } else if (merged.length < 6) {
      merged.push({ ...c });
      indexByName.set(c.name, merged.length - 1);
    }
  });
  return merged.length > 6 ? prev : merged;
}
function renderPortraits(characters) {
  const rail = document.getElementById("portrait-rail");
  rail.innerHTML = characters.map((c) => {
    const url = getCharacterPortraitUrl(c.description, c.name, state.narrationTheme);
    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=1a1a2e&color=c9a96e&size=200&bold=true`;
    const tip = c.personality ? `${c.name} \u2014 ${c.personality}` : c.name;
    const titleAttr = escapeAttr(tip);
    const altName = escapeAttr(c.name);
    return `
    <div class="portrait-wrap" title="${titleAttr}">
      <img class="portrait-img"
           src="${url}"
           alt="${altName}"
           onload="this.classList.add('loaded')"
           onerror="this.onerror=null;this.src='${fallback}';this.classList.add('loaded')"/>
      <span class="portrait-name">${escapeForHtml(c.name)}</span>
    </div>`;
  }).join("");
}
function setStoryTitle(title) {
  state.title = title;
  document.getElementById("story-title").textContent = title;
}

// js/app/chapter-ui.js
init_sidebar();
init_state();
function updateChapterUI() {
  const chip = document.getElementById("chapter-chip");
  const nextBtn = document.getElementById("next-chapter-btn");
  const max = state.maxChapters;
  const beat = primaryPlotStopText(state.plotLines, state.chapter, max);
  const short = beat.length > 36 ? `${beat.slice(0, 34)}\u2026` : beat;
  chip.style.display = "flex";
  chip.textContent = `Ch.${state.chapter}/${max} \xB7 S${state.sceneInChapter}/${SCENE_CAP} \xB7 ${short}`;
  const row = document.getElementById("chapter-progress-row");
  const label = document.getElementById("chapter-progress-label");
  const fill = document.getElementById("chapter-progress-fill");
  const bar = document.getElementById("chapter-progress-bar");
  if (row && label && fill) {
    row.style.display = "block";
    label.textContent = `Chapter ${state.chapter} of ${max} \xB7 Scene ${state.sceneInChapter} of ${SCENE_CAP}`;
    const pct = Math.min(100, Math.round(state.chapter / max * 100));
    fill.style.width = `${pct}%`;
    if (bar) {
      bar.setAttribute("aria-valuenow", String(state.chapter));
      bar.setAttribute("aria-valuemax", String(max));
    }
  }
  nextBtn.style.display = state.chapter < max ? "inline-flex" : "none";
  renderStoryArcSidebar();
}

// js/app/scene-choices.js
init_state();

// js/app/scene-text.js
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
function formatSceneToHtml(raw) {
  if (!raw) return "";
  const lines = String(raw).replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  const narrBuf = [];
  function flushNarr() {
    if (!narrBuf.length) return;
    const t = narrBuf.join(" ").replace(/\s+/g, " ").trim();
    if (t) blocks.push({ type: "narr", html: escapeForHtml(t) });
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
        type: "dlg",
        speaker: escapeForHtml(dlg.speaker),
        text: escapeForHtml(dlg.text)
      });
    } else {
      narrBuf.push(trimmed);
    }
  }
  flushNarr();
  return blocks.map(
    (b) => b.type === "narr" ? `<p class="scene-narration">${b.html}</p>` : `<div class="dialogue-line"><span class="dialogue-speaker">${b.speaker}</span><span class="dialogue-quote">\u201C${b.text}\u201D</span></div>`
  ).join("");
}

// js/app/scene-bg.js
init_state();
function updateSceneBg(location, emotion) {
  const bg = document.getElementById("scene-bg");
  const url = getSceneBgUrl(location, emotion, state.narrationTheme);
  const loader = document.createElement("img");
  loader.crossOrigin = "anonymous";
  loader.style.display = "none";
  loader.src = url;
  loader.onload = () => {
    bg.style.backgroundImage = `url('${url}')`;
    loader.remove();
  };
  loader.onerror = () => {
    bg.style.backgroundImage = `url('${url}')`;
    loader.remove();
  };
  document.body.appendChild(loader);
}

// js/app/ui-loading.js
function hideApiNotice() {
  const n = document.getElementById("api-notice");
  if (n) {
    n.style.display = "none";
    n.textContent = "";
    if (n._hideTimer) clearTimeout(n._hideTimer);
  }
}
function showApiNotice(message) {
  const n = document.getElementById("api-notice");
  if (!n) return;
  n.textContent = message;
  n.style.display = "block";
  if (n._hideTimer) clearTimeout(n._hideTimer);
  n._hideTimer = setTimeout(() => hideApiNotice(), 14e3);
}
function showLoading(subline) {
  hideApiNotice();
  document.getElementById("scene-text").textContent = subline ? `The DM ponders the dice\u2026

${subline}` : "The DM ponders the dice\u2026";
  document.getElementById("emotion-badge").style.display = "none";
  document.getElementById("choices-area").innerHTML = `
    <div class="loading"><div class="spinner"></div>Weaving the next beat\u2026</div>`;
}
function disableChoices(d) {
  document.querySelectorAll(".choice-btn").forEach((b) => {
    b.disabled = d;
  });
  const ta = document.getElementById("choice-user-textarea");
  const go = document.querySelector(".btn-user-choice-go");
  if (ta) ta.disabled = d;
  if (go) go.disabled = d;
}
function showError(msg) {
  document.getElementById("scene-text").textContent = `\u26A0 ${msg}`;
}

// js/app/story-bridge.js
init_state();
function storyContext(forNextScene = false) {
  const ch = state.chapter;
  let scene = state.sceneInChapter;
  if (forNextScene) scene = Math.min(scene + 1, SCENE_CAP);
  return {
    playerMode: state.playerMode,
    playerIdentity: state.playerIdentity,
    playerStoryRole: state.playerStoryRole,
    narrationTheme: state.narrationTheme,
    plotLines: [...state.plotLines],
    chapter: ch,
    maxChapters: state.maxChapters,
    chapterBeats: [...state.chapterBeats[ch] || []],
    chapterNarrationNote: state.chapterNarrationNotes[ch] || "",
    sceneInChapter: scene
  };
}
function systemPromptNextScene() {
  const next = Math.min(state.sceneInChapter + 1, SCENE_CAP);
  return buildSystemPrompt(
    state.playerMode,
    state.narrationTheme,
    state.chapter,
    next
  );
}
function systemPromptForChapterOpening(chapterNum) {
  return buildSystemPrompt(state.playerMode, state.narrationTheme, chapterNum, 1);
}

// js/app/history.js
init_state();
function toggleHistory() {
  state.historyOpen = !state.historyOpen;
  const panel = document.getElementById("history-panel");
  const btn = document.getElementById("history-btn");
  if (state.historyOpen) {
    renderHistoryPanel();
    panel.classList.add("open");
    btn.classList.add("active");
  } else {
    panel.classList.remove("open");
    btn.classList.remove("active");
  }
}
function renderHistoryPanel() {
  const list = document.getElementById("history-list");
  if (state.history.length === 0) {
    list.innerHTML = '<p style="color:var(--muted);font-style:italic">No history yet.</p>';
    return;
  }
  list.innerHTML = state.history.map((h, i) => `
    <div class="history-item">
      <div class="history-num">Ch.${h.chapter}${h.sceneInChapter != null ? ` \xB7 S${h.sceneInChapter}` : ""} \xB7 Beat ${i + 1} \u2014 <span style="color:var(--accent)">${escapeForHtml(h.emotion)}</span></div>
      <div class="history-scene">${escapeForHtml(h.scene)}</div>
      ${h.chosen ? `<div class="chosen">\u25B6 You chose: \u201C${escapeForHtml(h.chosen)}\u201D</div>` : ""}
    </div>`).join("");
}

// js/app/scene-choices.js
function updateBG(emotion) {
  if (typeof globalThis.updateBG === "function") globalThis.updateBG(emotion);
}
function triggerGlitch() {
  if (typeof globalThis.triggerGlitch === "function") globalThis.triggerGlitch();
}
function renderChapterSceneCapNotice() {
  const area = document.getElementById("choices-area");
  area.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "chapter-scene-cap";
  const p = document.createElement("p");
  p.className = "chapter-scene-cap-text";
  const isFinale = state.chapter >= state.maxChapters && state.sceneInChapter >= SCENE_CAP;
  p.textContent = isFinale ? `You\u2019ve reached the final scene of the saga (${SCENE_CAP} of ${SCENE_CAP} in this chapter). The tale concludes above. Start a new story from \u2715 New when you\u2019re ready.` : `You\u2019ve played every scene in this chapter (${SCENE_CAP} of ${SCENE_CAP}). Use Next chapter below to continue the story \u2014 or end the chapter early next time by advancing sooner.`;
  wrap.appendChild(p);
  area.appendChild(wrap);
}
function renderChoices(choices) {
  const area = document.getElementById("choices-area");
  area.innerHTML = "";
  const list = Array.isArray(choices) ? choices.slice(0, 3) : [];
  while (list.length < 3) list.push("Press on \u2014 what do you do?");
  const hint = document.createElement("p");
  hint.className = "choices-hint";
  hint.textContent = "I = scenario fork \xB7 II\u2013III = your move \xB7 IV = type your own.";
  area.appendChild(hint);
  const kinds = [
    { rom: "I", label: "Scenario" },
    { rom: "II", label: "Move" },
    { rom: "III", label: "Move" }
  ];
  kinds.forEach((k, i) => {
    const text = list[i];
    const block = document.createElement("div");
    block.className = "choice-block" + (i === 0 ? " choice-block-scenario" : " choice-block-move");
    const kindEl = document.createElement("span");
    kindEl.className = "choice-kind";
    kindEl.textContent = k.label;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice-btn" + (i === 0 ? " choice-btn-scenario" : "");
    btn.innerHTML = `<span class="choice-num">${k.rom}.</span>${escapeForHtml(text)}`;
    btn.addEventListener("click", () => makeChoice(text));
    block.appendChild(kindEl);
    block.appendChild(btn);
    area.appendChild(block);
  });
  const userRow = document.createElement("div");
  userRow.className = "choice-user-row";
  const lab = document.createElement("div");
  lab.className = "choice-user-heading";
  lab.innerHTML = '<span class="choice-num">IV.</span><span>Your own action</span>';
  const ta = document.createElement("textarea");
  ta.id = "choice-user-textarea";
  ta.className = "choice-user-textarea";
  ta.rows = 3;
  ta.value = "";
  ta.autocomplete = "off";
  ta.placeholder = "Type your own move here, then Declare\u2026";
  const goRow = document.createElement("div");
  goRow.className = "choice-user-actions";
  const go = document.createElement("button");
  go.type = "button";
  go.className = "btn-user-choice-go";
  go.textContent = "Declare";
  go.addEventListener("click", () => {
    if (ta.disabled) return;
    const v = ta.value.trim();
    if (!v) {
      ta.focus();
      return;
    }
    makeChoice(v);
  });
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      go.click();
    }
  });
  goRow.appendChild(go);
  userRow.appendChild(lab);
  userRow.appendChild(ta);
  userRow.appendChild(goRow);
  area.appendChild(userRow);
}
function renderScene(data) {
  hideApiNotice();
  const cfg = EMOTION_CONFIG[data.emotion] || EMOTION_CONFIG.calm;
  if (data.title && !state.title) setStoryTitle(data.title);
  const badge = document.getElementById("emotion-badge");
  badge.style.display = "inline-flex";
  badge.style.color = cfg.color;
  badge.style.borderColor = cfg.color;
  badge.style.background = cfg.badge;
  badge.textContent = `${cfg.icon} ${data.emotion.toUpperCase()}`;
  const max = state.maxChapters;
  const beat = primaryPlotStopText(state.plotLines, state.chapter, max);
  const beatBit = beat.length > 72 ? `${beat.slice(0, 70)}\u2026` : beat;
  const sceneLine = `Scene ${state.sceneInChapter} of ${SCENE_CAP}`;
  const line = beatBit ? `Chapter ${state.chapter} of ${max} \xB7 ${sceneLine} \u2014 ${beatBit}` : `Chapter ${state.chapter} of ${max} \xB7 ${sceneLine}`;
  const sceneHtml = `<span class="chapter-inline">${escapeForHtml(line)}</span>` + formatSceneToHtml(data.scene);
  document.getElementById("scene-text").innerHTML = sceneHtml;
  if (state.sceneInChapter >= SCENE_CAP) renderChapterSceneCapNotice();
  else renderChoices(data.choices);
  if (data.location) updateSceneBg(data.location, data.emotion);
  if (data.characters) renderPortraits(data.characters);
  updateChapterUI();
  updateBG(data.emotion);
  if (data.emotion === "danger") triggerGlitch();
}
async function makeChoice(choice) {
  if (state.sceneInChapter >= SCENE_CAP) return;
  const nextBtn = document.getElementById("next-chapter-btn");
  if (nextBtn) nextBtn.disabled = true;
  disableChoices(true);
  state.history.push({
    scene: state.currentScene.scene,
    emotion: state.currentScene.emotion,
    chosen: choice,
    chapter: state.chapter,
    sceneInChapter: state.sceneInChapter
  });
  if (state.historyOpen) renderHistoryPanel();
  showLoading();
  try {
    const msg = buildNextMessage(
      state.history,
      state.characters,
      choice,
      storyContext(true)
    );
    const raw = await callAI(msg, systemPromptNextScene());
    const data = parseSceneJSON(raw);
    if (data.characters && data.characters.length > 0) {
      state.characters = mergeCharacterLists(state.characters, data.characters);
    }
    state.currentScene = data;
    state.sceneIndex++;
    state.sceneInChapter = Math.min(state.sceneInChapter + 1, SCENE_CAP);
    renderScene(data);
  } catch (e) {
    if (state.currentScene) {
      renderScene(state.currentScene);
      showApiNotice(`Could not continue: ${e.message}`);
    } else {
      showError(`${e.message} \u2014 try again.`);
    }
    disableChoices(false);
  } finally {
    if (nextBtn) nextBtn.disabled = false;
  }
}

// js/app/chapter-advance.js
init_state();
async function advanceChapter() {
  if (state.chapter >= state.maxChapters || !state.currentScene) return;
  const nextBtn = document.getElementById("next-chapter-btn");
  nextBtn.disabled = true;
  const nextCh = state.chapter + 1;
  state.pendingAfterBeatsSave = nextCh;
  openBeatsModal(nextCh, { gateFor: "advance" });
}
async function executeAdvanceChapterApi(nextCh) {
  const nextBtn = document.getElementById("next-chapter-btn");
  nextBtn.disabled = true;
  disableChoices(true);
  showLoading(`Opening chapter ${nextCh} of ${state.maxChapters}\u2026`);
  try {
    const msg = buildChapterAdvanceMessage({
      plotLines: state.plotLines,
      chapter: nextCh,
      history: state.history,
      characters: state.characters,
      maxChapters: state.maxChapters,
      chapterBeats: [...state.chapterBeats[nextCh] || []],
      chapterNarrationNote: state.chapterNarrationNotes[nextCh] || "",
      sceneInChapter: 1
    });
    const raw = await callAI(msg, systemPromptForChapterOpening(nextCh));
    const data = parseSceneJSON(raw);
    if (data.characters && data.characters.length > 0) {
      state.characters = mergeCharacterLists(state.characters, data.characters);
    }
    state.chapter = nextCh;
    state.maxUnlockedChapter = Math.max(state.maxUnlockedChapter, nextCh);
    state.sceneInChapter = 1;
    state.currentScene = data;
    state.sceneIndex++;
    renderScene(data);
  } catch (e) {
    if (state.currentScene) {
      renderScene(state.currentScene);
      showApiNotice(`Could not open next chapter: ${e.message}`);
    } else {
      showError(`${e.message} \u2014 try again.`);
    }
    disableChoices(false);
  } finally {
    nextBtn.disabled = false;
  }
}

// js/app/setup-landing.js
init_constants();
var LANDING_ARC_PREVIEW_TITLES = [
  "Life inside the walls",
  "The breach",
  "First contact",
  "The secret",
  "Betrayal",
  "The assault",
  "After the thunder",
  "Turning point",
  "Reckoning",
  "What endures"
];
function renderLandingArcPreview() {
  const ul = document.getElementById("landing-story-arc-list");
  if (!ul) return;
  ul.innerHTML = "";
  const max = TOTAL_CHAPTERS;
  for (let n = 1; n <= max; n++) {
    const locked = n > 1;
    const active = n === 1;
    const li = document.createElement("li");
    li.className = "story-arc-item" + (active ? " is-active" : "") + (locked ? " is-locked" : "");
    li.setAttribute("aria-current", active ? "step" : "false");
    const label = document.createElement("span");
    label.className = "story-arc-item-label";
    const titleText = LANDING_ARC_PREVIEW_TITLES[n - 1] || `Chapter ${n}`;
    label.textContent = titleText;
    const meta = document.createElement("span");
    meta.className = "story-arc-item-meta";
    meta.textContent = `Ch. ${n}`;
    const icon = document.createElement("span");
    icon.className = "story-arc-item-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = locked ? "\u{1F512}" : active ? "\u25B6" : "\u25C7";
    li.appendChild(label);
    li.appendChild(meta);
    li.appendChild(icon);
    ul.appendChild(li);
  }
}
function setPreplayTopbarDisabled(disabled) {
  const h = document.getElementById("preplay-history-btn");
  const n = document.getElementById("preplay-new-btn");
  [h, n].forEach((btn) => {
    if (!btn) return;
    btn.disabled = disabled;
    btn.setAttribute("aria-disabled", disabled ? "true" : "false");
  });
}
function setStoryPlayActionsEnabled(enabled) {
  const h = document.getElementById("history-btn");
  const r = document.getElementById("reset-story-btn");
  [h, r].forEach((btn) => {
    if (!btn) return;
    btn.disabled = !enabled;
    btn.setAttribute("aria-disabled", !enabled ? "true" : "false");
  });
}

// js/app/main.js
init_sidebar();

// js/app/start-session.js
init_beats_modal();

// js/app/plot-setup.js
init_state();
function renderPlotLinesList() {
  const ol = document.getElementById("plot-lines-list");
  ol.innerHTML = "";
  state.plotLines.forEach((text, i) => {
    const li = document.createElement("li");
    li.className = "plot-row";
    const idx = document.createElement("span");
    idx.className = "plot-idx";
    idx.textContent = String(i + 1);
    const input = document.createElement("input");
    input.type = "text";
    input.className = "plot-line-input";
    input.value = text;
    input.dataset.index = String(i);
    const nav = document.createElement("div");
    nav.className = "plot-reorder";
    const up = document.createElement("button");
    up.type = "button";
    up.textContent = "\u2191";
    up.disabled = i === 0;
    up.addEventListener("click", () => movePlotLine(i, -1));
    const down = document.createElement("button");
    down.type = "button";
    down.textContent = "\u2193";
    down.disabled = i === state.plotLines.length - 1;
    down.addEventListener("click", () => movePlotLine(i, 1));
    nav.appendChild(up);
    nav.appendChild(down);
    li.appendChild(idx);
    li.appendChild(input);
    li.appendChild(nav);
    ol.appendChild(li);
  });
}
function movePlotLine(index, delta) {
  const j = index + delta;
  if (j < 0 || j >= state.plotLines.length) return;
  const lines = [...state.plotLines];
  const inputs = [...document.querySelectorAll(".plot-line-input")];
  lines[index] = inputs[index] ? inputs[index].value : lines[index];
  lines[j] = inputs[j] ? inputs[j].value : lines[j];
  [lines[index], lines[j]] = [lines[j], lines[index]];
  state.plotLines = lines;
  renderPlotLinesList();
}
function collectPlotLinesFromForm() {
  const inputs = [...document.querySelectorAll(".plot-line-input")];
  return inputs.map((inp) => {
    const t = inp.value.trim();
    return t || "Open arc \u2014 improvise with the player";
  });
}
function initChapterArcState() {
  state.maxUnlockedChapter = 1;
  state.chapterBeats = {};
  state.chapterNarrationNotes = {};
  state.chapterTitles = {};
  const max = state.maxChapters;
  for (let c = 1; c <= max; c++) {
    const pl = primaryPlotStopText(state.plotLines, c, max);
    state.chapterBeats[c] = [
      `Anchor: ${pl}`,
      "Complication or obstacle",
      "Revelation, choice, or shift"
    ];
    state.chapterNarrationNotes[c] = "";
    state.chapterTitles[c] = "";
  }
}

// js/app/start-session.js
init_state();

// js/app/setup-wizard.js
init_constants();
init_state();
function setPrompt(text) {
  document.getElementById("prompt-input").value = text;
}
function setPlayerIdentity(text) {
  const el = document.getElementById("player-identity-input");
  if (el) el.value = text;
}
function selectStoryRole(mode) {
  state.playerMode = mode;
  document.querySelectorAll(".role-card").forEach((el2) => el2.classList.remove("selected"));
  const el = document.getElementById(
    mode === "author" ? "role-author" : mode === "player" ? "role-player" : "role-witness"
  );
  if (el) el.classList.add("selected");
}
function continueFromLanding() {
  const prompt = document.getElementById("prompt-input").value.trim();
  if (!prompt) {
    document.getElementById("prompt-input").focus();
    return;
  }
  if (!state.playerMode) {
    document.getElementById("role-author")?.focus();
    return;
  }
  state.prompt = prompt;
  document.getElementById("preplay-panel-landing").hidden = true;
  document.getElementById("preplay-panel-character").hidden = false;
  document.getElementById("preplay-panel-theme").hidden = true;
}
function goBackToLanding() {
  document.getElementById("preplay-panel-character").hidden = true;
  document.getElementById("preplay-panel-theme").hidden = true;
  document.getElementById("preplay-panel-landing").hidden = false;
}
function continueFromCharacter() {
  const idEl = document.getElementById("player-identity-input");
  const roleEl = document.getElementById("player-story-role-input");
  state.playerIdentity = idEl && idEl.value.trim() || "";
  state.playerStoryRole = roleEl && roleEl.value.trim() || "";
  document.getElementById("preplay-panel-landing").hidden = true;
  document.getElementById("preplay-panel-character").hidden = true;
  document.getElementById("preplay-panel-theme").hidden = false;
  selectNarrationTheme(state.narrationTheme);
}
function goBackToCharacter() {
  document.getElementById("preplay-panel-theme").hidden = true;
  document.getElementById("preplay-panel-character").hidden = false;
  document.getElementById("preplay-panel-landing").hidden = true;
}
function selectNarrationTheme(theme) {
  state.narrationTheme = theme;
  state.plotLines = [...PLOT_PRESETS[theme]];
  document.getElementById("tab-dystopian").classList.toggle("active", theme === "dystopian");
  document.getElementById("tab-victorian").classList.toggle("active", theme === "victorian");
  renderPlotLinesList();
}
var goToAgencySetup = continueFromLanding;
var goBackToIntro = goBackToLanding;
var selectAgency = selectStoryRole;
var goBackToAgency = goBackToCharacter;

// js/app/start-session.js
function updateBG2(emotion) {
  if (typeof globalThis.updateBG === "function") globalThis.updateBG(emotion);
}
function hidePreplayShell() {
  const shell = document.getElementById("preplay-shell");
  if (shell) {
    shell.hidden = true;
  }
}
async function startChapterOne() {
  state.plotLines = collectPlotLinesFromForm();
  if (state.plotLines.length < 4) {
    while (state.plotLines.length < 4) {
      state.plotLines.push("Open arc \u2014 improvise with the player");
    }
  }
  state.chapter = 1;
  state.title = "";
  state.characters = [];
  state.history = [];
  state.currentScene = null;
  state.sceneIndex = 0;
  state.sceneInChapter = 1;
  initChapterArcState();
  const btn = document.getElementById("start-chapter-btn");
  btn.disabled = true;
  state.pendingAfterBeatsSave = "start";
  openBeatsModal(1, { gateFor: "start" });
}
async function executeStartChapterOneApi() {
  const btn = document.getElementById("start-chapter-btn");
  hidePreplayShell();
  document.getElementById("story-screen").classList.add("active");
  document.getElementById("story-screen").hidden = false;
  showLoading();
  updateChapterUI();
  updateBG2("calm");
  try {
    const raw = await callAI(
      buildFirstMessage(state.prompt, storyContext(false)),
      systemPromptForChapterOpening(1)
    );
    const data = parseSceneJSON(raw);
    state.currentScene = data;
    state.characters = data.characters || [];
    state.sceneIndex = 1;
    renderScene(data);
    setStoryPlayActionsEnabled(true);
  } catch (e) {
    showStartFailure(e.message || String(e));
  } finally {
    if (btn) btn.disabled = false;
  }
}
function showStartFailure(message) {
  hideApiNotice();
  const story = document.getElementById("story-screen");
  story.classList.add("active");
  story.hidden = false;
  document.getElementById("emotion-badge").style.display = "none";
  document.getElementById("story-title").textContent = "Could not start session";
  const sceneEl = document.getElementById("scene-text");
  sceneEl.textContent = "";
  const area = document.getElementById("choices-area");
  const p = document.createElement("p");
  p.className = "error-msg";
  p.textContent = message;
  const back = document.createElement("button");
  back.type = "button";
  back.className = "btn-primary";
  back.style.marginTop = "0.75rem";
  back.textContent = "\u2190 Back to plot setup";
  back.addEventListener("click", returnToPlotSetup);
  area.innerHTML = "";
  area.appendChild(p);
  area.appendChild(back);
}
function returnToPlotSetup() {
  document.getElementById("story-screen").classList.remove("active");
  document.getElementById("story-screen").hidden = true;
  const shell = document.getElementById("preplay-shell");
  if (shell) {
    shell.hidden = false;
    shell.style.display = "";
  }
  document.getElementById("preplay-panel-landing").hidden = true;
  document.getElementById("preplay-panel-character").hidden = true;
  document.getElementById("preplay-panel-theme").hidden = false;
  selectNarrationTheme(state.narrationTheme);
}

// js/app/reset.js
init_constants();
init_sidebar();
init_state();
function updateBG3(emotion) {
  if (typeof globalThis.updateBG === "function") globalThis.updateBG(emotion);
}
function showPreplayLandingOnly() {
  const shell = document.getElementById("preplay-shell");
  if (shell) {
    shell.hidden = false;
    shell.style.display = "";
  }
  document.getElementById("preplay-panel-landing").hidden = false;
  document.getElementById("preplay-panel-character").hidden = true;
  document.getElementById("preplay-panel-theme").hidden = true;
}
function resetStory() {
  Object.assign(state, {
    prompt: "",
    title: "",
    characters: [],
    history: [],
    currentScene: null,
    sceneIndex: 0,
    historyOpen: false,
    playerMode: null,
    playerIdentity: "",
    playerStoryRole: "",
    narrationTheme: "dystopian",
    plotLines: [...PLOT_PRESETS.dystopian],
    chapter: 1,
    maxChapters: TOTAL_CHAPTERS,
    maxUnlockedChapter: 1,
    chapterBeats: {},
    chapterNarrationNotes: {},
    chapterTitles: {},
    sceneInChapter: 1,
    pendingAfterBeatsSave: null
  });
  document.getElementById("story-screen").classList.remove("active");
  document.getElementById("story-screen").hidden = true;
  document.getElementById("story-title").textContent = "";
  document.getElementById("scene-bg").style.backgroundImage = "";
  document.getElementById("history-panel").classList.remove("open");
  document.getElementById("history-btn").classList.remove("active");
  document.getElementById("chapter-chip").style.display = "none";
  const progRow = document.getElementById("chapter-progress-row");
  if (progRow) progRow.style.display = "none";
  document.getElementById("next-chapter-btn").style.display = "none";
  const promptInput = document.getElementById("prompt-input");
  if (promptInput) promptInput.value = "";
  const idInput = document.getElementById("player-identity-input");
  if (idInput) idInput.value = "";
  const roleInput = document.getElementById("player-story-role-input");
  if (roleInput) roleInput.value = "";
  document.querySelectorAll(".role-card").forEach((el) => el.classList.remove("selected"));
  showPreplayLandingOnly();
  renderLandingArcPreview();
  setStoryPlayActionsEnabled(false);
  updateBG3("calm");
  renderStoryArcSidebar();
}

// js/app/main.js
function initApp() {
  registerBeatsPendingHandler((pending) => {
    if (pending === "start") void executeStartChapterOneApi();
    else if (typeof pending === "number") void executeAdvanceChapterApi(pending);
  });
  const modal = document.getElementById("beats-modal");
  document.getElementById("beats-save-btn")?.addEventListener("click", saveBeatsFromModal);
  document.getElementById("beats-modal-close")?.addEventListener("click", dismissBeatsModal);
  document.getElementById("add-beat-btn")?.addEventListener("click", addBeatRow);
  modal?.querySelector(".beats-modal-scrim")?.addEventListener("click", dismissBeatsModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && !modal.hidden) dismissBeatsModal();
  });
  renderLandingArcPreview();
  setPreplayTopbarDisabled(true);
  setStoryPlayActionsEnabled(false);
  renderStoryArcSidebar();
  Object.assign(globalThis, {
    setPrompt,
    setPlayerIdentity,
    goToAgencySetup,
    continueFromLanding,
    goBackToIntro,
    goBackToLanding,
    selectAgency,
    selectStoryRole,
    continueFromCharacter,
    goBackToAgency,
    goBackToCharacter,
    selectNarrationTheme,
    startChapterOne,
    advanceChapter,
    resetStory,
    toggleHistory
  });
}

// app.js
initApp();

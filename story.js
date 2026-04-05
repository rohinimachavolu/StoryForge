// story.js — updated AI logic with chapters, genres, agency

const SYSTEM_PROMPT = `You are a master storyteller for Storyforge, an AI interactive fiction game.

RULES:
- Create ONLY 3-5 named characters (including "You"). Fix them early.
- Keep story compelling, emotionally rich, consistent with all prior scenes.
- ALWAYS respond with ONLY valid JSON. No markdown, no preamble.
- Scene text: 2-4 vivid sentences, max 120 words.
- Choices must be meaningfully different.

FORMAT:
{
  "title": "Short story title (3-6 words, first scene only, keep same after)",
  "scene": "2-4 sentence vivid scene paragraph",
  "emotion": "romance | happy | tension | danger | calm | adventure | dread | epic | grief | euphoria",
  "location": "brief location for background image, e.g. 'dark alley rain', 'burning village at sunset'",
  "characters": [
    { "name": "Name", "description": "brief visual description for portrait" },
    { "name": "You",  "description": "brief visual description of player" }
  ],
  "choices": ["choice 1", "choice 2", "choice 3"]
}

EMOTION GUIDE:
- romance: love, longing, intimacy
- happy: joy, celebration, relief
- tension: suspense, unease, conflict brewing
- danger: immediate threat, combat, life at risk
- calm: peace, rest, reflection
- adventure: exploration, discovery, momentum
- dread: horror, deep fear, the unknown
- epic: grand battles, legendary moments, sacrifice
- grief: loss, mourning, heartbreak
- euphoria: triumph, ecstasy, overwhelming joy`;

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Model fallback chain — tries each in order if rate limited
const MODELS = [
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'llama-3.1-8b-instant',
];
let _modelIndex = 0;

function currentModel() { return MODELS[_modelIndex]; }

function nextModel() {
  _modelIndex = (_modelIndex + 1) % MODELS.length;
  console.warn(`Switching to model: ${currentModel()}`);
  return currentModel();
}

function buildFirstMessage(prompt) {
  const genre   = window.selectedGenre || 'adventure';
  const agency  = window.selectedAgency || 'player';
  const ctx     = typeof getCurrentChapterContext === 'function'
    ? getCurrentChapterContext()
    : { chapterNum: 1, chapterTitle: 'The Beginning', beats: [] };

  const agencyNote = agency === 'witness'
    ? 'The player is a Witness — they observe and choose, but do not act freely.'
    : agency === 'author'
    ? 'The player is the Author — they can rewrite anything. Make the story acknowledge their power.'
    : 'The player is active — they type actions and make choices.';

  return `Genre: ${genre.toUpperCase()}
Story premise: "${prompt}"
Agency mode: ${agencyNote}
Chapter ${ctx.chapterNum}: "${ctx.chapterTitle}"
Story beats for this chapter: ${ctx.beats.join(' → ')}

Generate the OPENING scene. Introduce setting and 3-5 characters (include "You").
Follow the story beats. Set the tone dramatically. Provide 3 first choices. Generate story title.`;
}

function buildNextMessage(history, characters, choice) {
  const ctx       = typeof getCurrentChapterContext === 'function'
    ? getCurrentChapterContext()
    : { chapterNum: 1, chapterTitle: '', beats: [] };
  const recent    = history.slice(-4).map(h => `Scene: ${h.scene} | Action: ${h.chosen}`).join('\n');
  const charNames = characters.map(c => c.name).join(', ');
  const beats     = ctx.beats.join(' → ');

  return `Established characters: ${charNames}
Chapter ${ctx.chapterNum}: "${ctx.chapterTitle}" — beats to follow: ${beats}
Recent story:\n${recent}
Player just chose/did: "${choice}"

Continue the story. Stay consistent with characters and beats. Keep same title. JSON only.`;
}

async function callAI(userMessage, retryCount = 0) {
  if (retryCount >= MODELS.length) throw new Error('All models rate limited. Please wait a few minutes.');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: currentModel(),
      max_tokens: 800,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage }
      ]
    })
  });

  const data = await res.json();

  // If rate limited — auto switch to next model and retry
  if (data.error) {
    const msg = data.error.message || '';
    if (msg.includes('rate limit') || msg.includes('Rate limit') || msg.includes('tokens per')) {
      nextModel();
      return callAI(userMessage, retryCount + 1);
    }
    throw new Error(msg || 'API error');
  }

  return data.choices[0].message.content;
}

function parseSceneJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Could not parse story response.');
  return JSON.parse(clean.slice(start, end + 1));
}

function getSceneBgUrl(location, emotion) {
  const genreStyle = {
    aot:       'attack on titan anime style, dark military',
    dystopian: 'dystopian cyberpunk, neon and concrete',
    victorian: 'victorian era, gas lamps, fog, dark London',
    adventure: 'fantasy adventure, painterly, epic'
  }[window.selectedGenre] || 'cinematic fantasy';

  const prompt = `${location}, ${emotion} mood, ${genreStyle}, atmospheric lighting, wide angle, no people, highly detailed`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random()*99999)}`;
}

function getCharacterPortraitUrl(description, name) {
  const genreStyle = {
    aot:       'attack on titan anime style character',
    dystopian: 'cyberpunk character, detailed, cinematic',
    victorian: 'victorian era character, painterly, dramatic lighting',
    adventure: 'fantasy character, detailed portrait, dramatic lighting'
  }[window.selectedGenre] || 'detailed painterly portrait';

  const prompt = `${genreStyle}, ${description}, character named ${name}, upper body, soft dramatic lighting`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=500&nologo=true&seed=${Math.floor(Math.random()*99999)}`;
}
// story.js — AI API logic

const SYSTEM_PROMPT = `You are a master storyteller for an interactive fiction game called Storyforge.
Rules:
- Create ONLY 3-5 named characters (including "You" as the player). Fix them early; do not add new ones.
- Keep the story compelling, emotionally rich, and consistent with previous scenes.
- ALWAYS respond with ONLY valid JSON. No markdown, no preamble. Format:
{
  "title": "Short evocative story title (3-6 words, generated only on first scene, keep same after)",
  "scene": "2-4 sentence vivid scene paragraph",
  "emotion": "romance | happy | tension | danger | calm | adventure",
  "location": "brief location description for background image, e.g. 'cozy bedroom at night', 'dark alley in rain', 'medieval throne room'",
  "characters": [
    { "name": "Character name", "description": "brief visual description for portrait, e.g. 'young woman with red hair, elegant dress'" },
    { "name": "You", "description": "brief visual description of the player character" }
  ],
  "choices": ["choice 1", "choice 2", "choice 3"]
}
- Choices must be meaningfully different and move the story forward.
- Keep scene text under 120 words.
- Always include "You" as one of the characters.`;

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';


function buildFirstMessage(prompt) {
  return `Story premise: "${prompt}"
Generate the OPENING scene. Introduce the setting and 3-5 characters (include "You"). Set the tone. Provide 3 dramatic first choices. Also generate a short story title.`;
}

function buildNextMessage(history, characters, choice) {
  const recent = history.slice(-4)
    .map(h => `Scene: ${h.scene} | Player chose: ${h.chosen}`)
    .join('\n');
  const charNames = characters.map(c => c.name).join(', ');
  return `Established characters: ${charNames}
Recent story:\n${recent}
Player just chose: "${choice}"
Continue the story. Keep same title. Stay consistent with established characters. Do NOT add new characters unless essential.`;
}

async function callAI(userMessage) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userMessage }
      ]
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'API error');
  return data.choices[0].message.content;
}

function parseSceneJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Could not parse story response.');
  return JSON.parse(clean.slice(start, end + 1));
}

// Pollinations.ai — free, no key needed
function getSceneBgUrl(location, emotion) {
  const prompt = `${location}, ${emotion} mood, cinematic environment, highly detailed, painterly, no people, atmospheric lighting, wide angle`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${Math.floor(Math.random()*99999)}`;
}

function getCharacterPortraitUrl(description, name) {
  const prompt = `portrait of ${description}, character named ${name}, detailed face, painterly art style, soft dramatic lighting, upper body, fantasy realism`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=400&height=500&nologo=true&seed=${Math.floor(Math.random()*99999)}`;
}
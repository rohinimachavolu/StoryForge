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
  "comicPrompt": "single detailed prompt for a close-up comic-style character portrait based on this exact scene, focusing on the most important character moment, expression, outfit, mood, and dramatic lighting",
  "comicCaption": "short dramatic caption for this comic panel, under 12 words",
  "characters": [
    { "name": "Character name", "description": "brief visual description for portrait, e.g. 'young woman with red hair, elegant dress'" },
    { "name": "You", "description": "brief visual description of the player character" }
  ],
  "choices": ["choice 1", "choice 2", "choice 3"]
}
- Choices must be meaningfully different and move the story forward.
- Keep scene text under 120 words.
- comicPrompt must be visually specific and consistent with the named characters.
- Style every comicPrompt as a polished graphic novel character portrait with expressive facial emotion, dramatic comic lighting, and a simple background.
- Always include "You" as one of the characters.`;

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const API_KEY = 'YOUR_API_KEY';


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
        { role: 'user', content: userMessage }
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
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Could not parse story response.');
  return JSON.parse(clean.slice(start, end + 1));
}

function buildPollinationsUrl(prompt, width = 1280, height = 720) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
}

function getPollinationsSceneBgUrl(location, emotion) {
  const prompt = `${location}, ${emotion} mood, high quality anime artwork, studio ghibli style, cel-shaded, vibrant colors, beautiful anime scenery, wide angle`;
  return buildPollinationsUrl(prompt);
}

function sanitizeImagePrompt(text) {
  if (!text) return '';

  return text
    .replace(/\b(Iron Man|Spider-Man|Batman|Superman|Wolverine|Captain America|Thor|Hulk|Avengers|Marvel|DC)\b/gi, 'original comic hero')
    .replace(/\b(kill|killing|murder|blood|gore|weapon|gun|knife|stab|shoot|dead|corpse|fight|punch|fist|attack|hit|battle|versus|vs\.?)\b/gi, 'dramatic')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildComicScenePrompt(sceneData) {
  const primaryCharacter = (sceneData.characters || [])[0];
  const primaryDescription = primaryCharacter
    ? `${sanitizeImagePrompt(primaryCharacter.name)}, ${sanitizeImagePrompt(primaryCharacter.description)}`
    : 'an original fictional hero with expressive features';

  const basePrompt = sceneData.comicPrompt || [
    'cartoony character portrait',
    `emotion: ${sceneData.emotion}`,
    primaryDescription,
    'calm heroic pose',
    'gentle confident expression',
    'head-and-shoulders portrait',
    'friendly animated style, soft dramatic lighting, simple abstract background, colorful cartoon art, original characters only, no action scene'
  ].filter(Boolean).join(', ');

  return sanitizeImagePrompt(basePrompt);
}

async function getSceneBgUrl(sceneData) {
  const prompt = buildComicScenePrompt(sceneData);

  try {
    const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt,
        size: "1024x1024",
        quality: "low",
        output_format: "jpeg",
        output_compression: 70
      })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.startsWith('image/')) {
      let details = '';
      try {
        if (contentType.includes('application/json')) {
          const data = await res.json();
          details = data.error || data.message || data.estimated_time || JSON.stringify(data);
        } else {
          details = await res.text();
        }
      } catch (parseError) {
        details = parseError.message;
      }
      throw new Error(`Image API Error${details ? `: ${details}` : ''}`);
    }

    const blob = await res.blob();
    return {
      url: URL.createObjectURL(blob),
      provider: 'openai'
    };
  } catch (e) {
    console.error("openai generation failed, falling back to pollinations...", e);
    return {
      url: buildPollinationsUrl(prompt, 512, 512),
      provider: 'pollinations'
    };
  }
}

function getCharacterPortraitUrl(description, name) {
  const prompt = `portrait of ${description}, character named ${name}, detailed face, painterly art style, soft dramatic lighting, upper body, fantasy realism`;
  return buildPollinationsUrl(prompt, 400, 500);
}

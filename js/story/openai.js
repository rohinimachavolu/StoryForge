import { OPENAI_API_URL, OPENAI_MODEL } from './constants.js';

export function getOpenAiKey() {
  if (typeof window === 'undefined') return '';
  const fromWindow =
    typeof window.STORYFORGE_OPENAI_KEY !== 'undefined' && window.STORYFORGE_OPENAI_KEY !== null
      ? String(window.STORYFORGE_OPENAI_KEY).trim()
      : '';
  if (fromWindow) return fromWindow;
  const fromConfig =
    window.STORYFORGE_CONFIG &&
    typeof window.STORYFORGE_CONFIG.openAiApiKey !== 'undefined' &&
    window.STORYFORGE_CONFIG.openAiApiKey !== null
      ? String(window.STORYFORGE_CONFIG.openAiApiKey).trim()
      : '';
  if (fromConfig) return fromConfig;
  const legacyKey = typeof globalThis.API_KEY !== 'undefined' ? globalThis.API_KEY : '';
  if (legacyKey) {
    const k = String(legacyKey).trim();
    if (k) return k;
  }
  return '';
}

export function isPlaceholderKey(key) {
  const p = (key || '').toUpperCase();
  return (
    p.includes('PASTE_YOUR') ||
    p.includes('PASTE_HERE') ||
    p === 'YOUR_OPENAI_API_KEY_HERE' ||
    p === 'YOUR_GROQ_API_KEY_HERE'
  );
}

export async function callAI(userMessage, systemPrompt) {
  let key = getOpenAiKey();
  if (key && isPlaceholderKey(key)) key = '';
  if (!key) {
    const wrongServer =
      typeof window !== 'undefined' && window.__STORYFORGE_CONFIG_JS_FAILED__;
    if (wrongServer) {
      throw new Error(
        'config.js did not load. Copy config.example.js to config.js with your OpenAI key, or run python serve.py with OPENAI_API_KEY in .env.'
      );
    }
    throw new Error(
      'No OpenAI API key. Put your key in config.js (copy config.example.js) or OPENAI_API_KEY in .env and run python serve.py.'
    );
  }

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage }
      ]
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message || 'API error');
  const content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!content || !String(content).trim()) {
    throw new Error('Empty reply from the model. Try again or check your API key.');
  }
  return content;
}

export function parseSceneJSON(raw) {
  const clean = raw.replace(/```json|```/g, '').trim();
  const start = clean.indexOf('{');
  const end   = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Could not parse story response.');
  return JSON.parse(clean.slice(start, end + 1));
}

/**
 * Vercel / CI: writes root config.js from OPENAI_API_KEY.
 * Local: if OPENAI_API_KEY is unset, exits without touching config.js (keep your gitignored file).
 */
const fs = require('fs');
const path = require('path');

const key = (process.env.OPENAI_API_KEY || '').trim();
const onVercel = !!process.env.VERCEL;

if (!key) {
  if (onVercel) {
    console.error(
      'StoryForge: OPENAI_API_KEY is missing. Add it in Vercel → Settings → Environment Variables, then redeploy.'
    );
    process.exit(1);
  }
  console.log(
    'StoryForge: OPENAI_API_KEY not set — skipping config.js (use local config.js or serve.py + .env).'
  );
  process.exit(0);
}

const out = path.join(__dirname, '..', 'config.js');
const content = `/**
 * Generated at deploy time from OPENAI_API_KEY. Do not edit on the server; change the env var in Vercel.
 * The key is still sent to the browser — use only if you accept that risk.
 */
window.STORYFORGE_OPENAI_KEY = ${JSON.stringify(key)};
`;

fs.writeFileSync(out, content, 'utf8');
console.log('StoryForge: wrote config.js from OPENAI_API_KEY.');

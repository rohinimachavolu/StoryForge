# ⚔️ Storyforge — AI Interactive Storytelling

> Enter a premise. Make choices. Watch your story come alive.

Storyforge is a **frontend-only AI storytelling platform** where you describe a scenario and the AI generates a branching narrative around your decisions — complete with cinematic scene backgrounds, character portraits, and emotion-driven animated visuals.

![Storyforge Banner](https://image.pollinations.ai/prompt/cinematic%20dark%20fantasy%20storytelling%20interface%2C%20glowing%20book%2C%20atmospheric%2C%20painterly?width=1280&height=400&nologo=true)

---

## ✨ Features

- **AI-generated story scenes** — Groq (Llama 3.3 70B) generates structured scenes in real time based on your choices
- **Branching choices** — 3 meaningful options per scene that shape the narrative
- **Dynamic backgrounds** — Pollinations.ai generates a unique scene image per location (bedroom, alley, throne room, jungle...)
- **Character portraits** — AI-painted portraits for every character in your story
- **Emotion-driven visuals** — p5.js animated particle backgrounds that change with the story mood
  - 🌹 Romance → floating hearts
  - ✨ Happy → flower particles
  - ⚡ Tension → dark purple noise
  - 🔴 Danger → screen shake + glitch + sparks
  - 🌊 Calm → smooth Perlin noise waves
  - 🗺 Adventure → firefly particles
- **Story title** — AI names your story on the first scene
- **History panel** — slide-in panel to review past scenes and choices without cluttering the UI
- **No backend required** — runs entirely in the browser

---

## 🚀 Getting Started

### Prerequisites
- A free [Groq API key](https://console.groq.com)
- Python 3 (just for local server) or any static file server

### Setup

```bash
# Clone the repo
git clone https://github.com/rohinimachavolu/StoryForge.git
cd StoryForge

# Add your API key — create a config file (gitignored)
echo "const API_KEY = 'your_groq_api_key_here';" > config.js
```

Make sure `index.html` loads `config.js` before `story.js`:
```html
<script src="config.js"></script>
<script src="story.js"></script>
```

### Run locally

```bash
python3 -m http.server 8000
```
Then open **http://localhost:8000** in your browser.

---

## 🗂️ Project Structure

```
storyforge/
├── index.html      # App structure and layout
├── style.css       # All styling — dark cinematic theme
├── story.js        # Groq API calls, JSON parsing, image URL helpers
├── visuals.js      # p5.js animated backgrounds per emotion
├── app.js          # State management and UI rendering
├── config.js       # Your API key (gitignored, create locally)
└── .gitignore
```

---

## 🎮 How It Works

1. **Enter a premise** — e.g. *"I am a detective in a cyberpunk noir city"*
2. The AI generates an opening scene with:
   - A story title
   - A vivid scene description
   - An emotion tag
   - A location for background image generation
   - 3–5 named characters with visual descriptions
   - 3 branching choices
3. **Pick a choice** — the next scene is generated, consistent with all prior events
4. Backgrounds, portraits, and particle effects update automatically
5. Click **📜 History** anytime to review past scenes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language model | Groq API — Llama 3.3 70B Versatile |
| Image generation | Pollinations.ai (free, no key needed) |
| Animated visuals | p5.js with Perlin noise |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Local server | Python `http.server` |

---

## 🔐 API Key Safety

Never commit your API key. This project uses a local `config.js` file that is gitignored:

```bash
echo "const API_KEY = 'your_key';" > config.js
echo "config.js" >> .gitignore
```

If you accidentally push a key, **immediately regenerate it** at [console.groq.com](https://console.groq.com).

---

## 📸 Example Story Prompts

- `"Dark romance mafia story where I am the boss's rival"`
- `"I am a new superhero in the Marvel universe"`
- `"I am an elephant trying to survive in a mysterious jungle"`
- `"I am a detective in a cyberpunk noir mystery"`
- `"I am a ship captain sailing through a fantasy ocean"`

---

## 🗺️ Roadmap

- [ ] Save and resume stories (localStorage)
- [ ] Export story as PDF
- [ ] Background music per emotion
- [ ] Multiple story slots
- [ ] Mobile-optimized layout

---

# ⚔️ Storyforge — AI Interactive Storytelling

> Enter a premise. Make choices. Watch your story come alive.

Storyforge is an AI storytelling app where you describe a scenario and the system generates a branching narrative around your decisions, complete with inline cartoony character art, character portraits, and emotion-driven animated visuals.

![Storyforge Banner](https://image.pollinations.ai/prompt/cinematic%20dark%20fantasy%20storytelling%20interface%2C%20glowing%20book%2C%20atmospheric%2C%20painterly?width=1280&height=400&nologo=true)

---

## ✨ Features

- **AI-generated story scenes** — Groq (Llama 3.3 70B) generates structured scenes in real time based on your choices
- **Branching choices** — 3 meaningful options per scene that shape the narrative
- **Inline comic-style character art** — each scene can generate a same-screen portrait-style image based on the current story context
- **Character portraits** — AI-painted portraits for every character in your story
- **Saved image/debug artifacts** — generated prompts, request payloads, images, and upstream error payloads are written to `generated_images/`
- **Emotion-driven visuals** — p5.js animated particle backgrounds that change with the story mood
  - 🌹 Romance → floating hearts
  - ✨ Happy → flower particles
  - ⚡ Tension → dark purple noise
  - 🔴 Danger → screen shake + glitch + sparks
  - 🌊 Calm → smooth Perlin noise waves
  - 🗺 Adventure → firefly particles
- **Story title** — AI names your story on the first scene
- **History panel** — slide-in panel to review past scenes and choices without cluttering the UI
- **Local proxy server** — a lightweight Python server handles image generation requests securely on your machine

---

## 🚀 Getting Started

### Prerequisites
- A free [Groq API key](https://console.groq.com)
- An [OpenAI API key](https://platform.openai.com/api-keys) for image generation
- Python 3

### Setup

```bash
# Clone the repo
git clone https://github.com/rohinimachavolu/StoryForge.git
cd StoryForge
```

Add your keys locally before running:

- Groq API key in `story.js`
- OpenAI API key in `server.py`

Recommended next step:
- move both keys into a local env/config setup before sharing or deploying

### Run locally

```bash
python3 server.py
```
Then open **http://localhost:8000** in your browser.

---

## 🗂️ Project Structure

```
storyforge/
├── index.html      # App structure and layout
├── style.css       # All styling — dark cinematic theme
├── story.js        # Groq scene generation + client-side image request helpers
├── visuals.js      # p5.js animated backgrounds per emotion
├── app.js          # State management and UI rendering
├── server.py       # Local image proxy for OpenAI image generation
├── generated_images/ # Saved prompts, payloads, generated images, and errors
└── .gitignore
```

---

## 🎮 How It Works

1. **Enter a premise** — e.g. *"I am a detective in a cyberpunk noir city"*
2. The AI generates an opening scene with:
   - A story title
   - A vivid scene description
   - An emotion tag
   - A cartoony portrait prompt for image generation
   - 3–5 named characters with visual descriptions
   - 3 branching choices
3. **Pick a choice** — the next scene is generated, consistent with all prior events
4. The app requests a same-screen character image for the current moment and saves debug artifacts locally
5. Backgrounds, portraits, and particle effects update automatically
6. Click **📜 History** anytime to review past scenes

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language model | Groq API — Llama 3.3 70B Versatile |
| Image generation | OpenAI `gpt-image-1` via local Python proxy |
| Animated visuals | p5.js with Perlin noise |
| Frontend | HTML, CSS, Vanilla JavaScript |
| Local server | Custom Python `server.py` |

---

## 🔐 API Key Safety

Never commit your API keys. The current local setup uses:

- a Groq key in `story.js`
- an OpenAI key in `server.py`

If you accidentally push either key, regenerate it immediately:

- [Groq console](https://console.groq.com)
- [OpenAI API keys](https://platform.openai.com/api-keys)

Recommended improvement:
- move both keys into environment variables or a local untracked config file

## 🧪 Debugging Images

Every image request writes debug files into `generated_images/`:

- `*.prompt.txt` — final prompt sent for image generation
- `*.request.json` — request payload
- `*.jpg` — generated image when successful
- `*-error.json` / `*-error.txt` — upstream API failures

This is useful when the image panel does not render and you want to verify whether generation succeeded upstream.

---

## 📸 Example Story Prompts

- `"Dark romance mafia story where I am the boss's rival"`
- `"I am a new superhero in an original comic universe"`
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

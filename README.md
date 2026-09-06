# 🐤 Flappy Bird (Web & Python)

A complete, classic **Flappy Bird** arcade game with **100% procedurally generated graphics** and synthesized retro sound effects. Playable directly in your web browser (mobile & desktop) or natively via Python + `pygame`.

Every graphic in the game — the bird, the pipes, the clouds, the ground — is generated entirely in code at runtime, requiring **zero external image or sound assets**.

![Made with Web + Python](https://img.shields.io/badge/made%20with-HTML5%20Canvas%20%2B%20Python-3776AB)
![No assets required](https://img.shields.io/badge/assets-100%25%20procedural-brightgreen)
![Deploy Ready](https://img.shields.io/badge/deploy-Vercel%20%7C%20Netlify%20%7C%20Pages-black)
![License-MIT](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- 🎮 **Classic Flappy Bird gameplay** — authentic physics, jump impulse, gravity, and pipe collisions.
- 🎨 **100% procedural graphics** — drawn at runtime via vector primitives (HTML5 Canvas & Pygame), zero external image files.
- 🔊 **Procedural Web Audio synthesizer** — synthesized retro sound effects (flap swoosh, score chime, hit, and fall) with zero audio files.
- 📱 **Mobile & Touch friendly** — responsive viewport auto-scaling for phones, tablets, and desktop displays.
- 🌤️ **Parallax atmospheric visuals** — sky gradient, floating clouds, and scrolling grass/dirt terrain.
- 🐤 **Dynamic bird tilt** — noses up during flap (`-25°`) and pitches downward as velocity increases (`80°`).
- 💾 **Persistent best score** — saved to `localStorage` (web) and `best.txt` (Python).
- ⚡ **Smooth 60 FPS game loop** with death flash visual effect and pause controls.

---

## 🌐 Play Online & Deploy

### Quick Local Preview
Simply open `index.html` in any modern browser, or launch a quick local server:

```bash
# Using Python
python -m http.server 3000

# Or using npx
npx serve .
```
Visit `http://localhost:3000` in your browser.

### 🚀 Deploying to the Web

This project includes zero-configuration deployment presets for all major static hosts:

#### Option 1: Deploy with Vercel
1. Install Vercel CLI (optional) or push this repo to GitHub:
   ```bash
   npx vercel
   ```
2. The included `vercel.json` will automatically configure routing and caching.

#### Option 2: Deploy with Netlify
1. Drag and drop this folder into [Netlify Drop](https://app.netlify.com/drop), or connect your GitHub repository.
2. The included `netlify.toml` will configure headers and static publishing.

#### Option 3: Deploy with GitHub Pages
1. Go to repository **Settings** → **Pages**.
2. Under **Build and deployment**, select `Deploy from a branch` → `main` → `/ (root)`.
3. Save, and your game will be live instantly!

---

## 🕹️ Controls

| Action | Desktop | Mobile / Touch |
|---|---|---|
| **Flap / Jump** | `Space` · `↑` · Left Click | Tap anywhere on screen |
| **Start / Restart** | `Space` · `Enter` · Left Click | Tap screen |
| **Pause** | `Esc` | — |
| **Toggle Sound** | Speaker icon in top bar | Speaker icon in top bar |
| **Fullscreen** | Fullscreen icon in top bar | Fullscreen icon in top bar |

---

## 🐍 Running the Python Version Locally

### 1. Requirements
- Python 3.8+
- pygame 2.0+

### 2. Installation
```bash
pip install pygame
```

### 3. Run
```bash
python flappy_bird.py
```

---

## 📁 Project Structure

```
flappy-bird/
├── index.html        # Web app entry point & arcade UI layout
├── style.css         # Modern arcade cabinet styling & responsive scaling
├── game.js           # Procedural canvas engine, Web Audio synth & physics loop
├── vercel.json       # Vercel deployment configuration
├── netlify.toml      # Netlify deployment configuration
├── flappy_bird.py    # Original Python + Pygame desktop game
├── best.txt          # High score storage for Python version
└── README.md         # Documentation & deployment guide
```

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify, and share it.

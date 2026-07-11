# 🐤 Flappy Bird (Python)

A complete, classic **Flappy Bird** clone built from scratch in Python using
[`pygame`](https://www.pygame.org/). Every graphic in the game — the bird, the
pipes, the clouds, the ground — is **generated procedurally in code**, so there
are **no image or sound assets to download**. Just install `pygame` and play.

![Made with Python + pygame](https://img.shields.io/badge/made%20with-Python%20%2B%20pygame-3776AB)
![No assets required](https://img.shields.io/badge/assets-100%25%20procedural-brightgreen)
![License-MIT](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- 🎮 Classic Flappy Bird gameplay — flap through gaps, don't touch the pipes
- 🎨 **100% procedural graphics** — drawn at runtime, zero external files
- 🌤️ Parallax sky gradient, drifting clouds, and animated scrolling ground
- 🐤 Bird sprite that tilts up when flapping and noses down as it falls
- 💾 Persistent **best score** saved to disk (`best.txt`)
- 🏆 Three game states: **Menu → Playing → Game Over**
- ⚡ Smooth 60 FPS game loop with a death flash effect
- 🪶 Lightweight — a single self-contained Python file

---

## 📋 Requirements

| Requirement | Version |
|-------------|---------|
| Python      | 3.8+    |
| pygame      | 2.0+    |

---

## 🚀 Installation & Running

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/flappy-bird-python.git
cd flappy-bird-python
```

### 2. Install dependencies

Using `pip`:

```bash
pip install pygame
```

Or with a virtual environment (recommended):

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install pygame
```

### 3. Run the game

```bash
python flappy_bird.py
```

> On Windows you can also double-click `flappy_bird.py` if Python is
> associated with `.py` files, but running from a terminal gives you the best
> error visibility.

---

## 🕹️ Controls

| Action            | Key / Input                |
|-------------------|----------------------------|
| Flap / Jump       | `Space` · `↑` · Mouse click |
| Start game        | `Space` · `Enter`          |
| Restart (dead)    | `Space` · `Enter`          |
| Quit              | `Esc`                      |

---

## 📁 Project Structure

```
flappy-bird-python/
├── flappy_bird.py    # The entire game (single self-contained file)
├── best.txt          # Auto-created: stores your best score
└── README.md         # This documentation
```

> `best.txt` is created automatically the first time you finish a game and is
> updated whenever you beat your high score.

---

## 🛠️ How It Works

The game is organized into a few clear sections inside `flappy_bird.py`:

- **Constants** — window size, physics (gravity, jump impulse, pipe speed), colors.
- **Procedural drawing helpers**
  - `draw_sky` — vertical gradient background.
  - `make_cloud` / `make_ground_tile` — reusable surface generators for the
    parallax clouds and the repeating ground texture.
  - `draw_bird` — builds the bird sprite (body, belly, wing, eye, beak) and
    rotates it based on vertical velocity.
  - `draw_pipe` — draws a pipe with a cap and simple shading.
- **`Pipe` class** — handles spawning, scrolling, collision, and scoring.
- **`main()`** — the game loop and the three states (`MENU`, `PLAYING`, `DEAD`)
  with input handling, rendering, and the high-score persistence.

You can tweak the feel of the game easily by editing the constants at the top:

```python
GRAVITY      = 0.45   # how fast the bird falls
JUMP_VELOCITY = -8     # flap strength
PIPE_SPEED    = 3      # scroll speed
PIPE_GAP      = 150    # size of the gap (easier = bigger)
PIPE_SPACING  = 220    # horizontal distance between pipes
```

---

## 🤝 Contributing

Contributions, ideas, and bug reports are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-idea`
3. Commit your changes: `git commit -m "Add my idea"`
4. Push to the branch: `git push origin feature/my-idea`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — feel free to use, modify,
and share it. (Flappy Bird is a trademark of its respective owner; this is an
unofficial fan implementation for educational purposes.)

---

Made with 🐍 and ❤️ using Python + pygame.

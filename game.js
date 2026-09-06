/**
 * Flappy Bird — Web Port
 * 100% Procedural Graphics & Synthesized Web Audio
 * Matches python/pygame physics constants and game loop.
 */

// --------------------------------------------------------------------------- //
// Configuration & Constants (exact match to Python flappy_bird.py)
// --------------------------------------------------------------------------- //
const SCREEN_WIDTH = 480;
const SCREEN_HEIGHT = 720;
const FPS = 60;
const FRAME_DURATION = 1000 / FPS;

const GRAVITY = 0.38;
const FLAP_STRENGTH = -7.4;
const MAX_FALL_SPEED = 8.0; // Terminal velocity: prevents bird from plunging too fast
const PIPE_SPEED = 2.5;     // Smooth, readable scrolling speed
const PIPE_GAP = 190;       // Forgiving, fun gap between pipes
const PIPE_WIDTH = 78;
const PIPE_SPACING = 280;
const PIPE_INTERVAL = 115;  // Comfortable spacing between pipe spawns

const GROUND_HEIGHT = 110;
const BIRD_X = 130;
const BIRD_RADIUS = 17;
const BIRD_FLAP_ANGLE = -25 * (Math.PI / 180); // radians (-25 deg)
const BIRD_DIVE_ANGLE = 80 * (Math.PI / 180);  // radians (80 deg)

const COLORS = {
  sky_top: 'rgb(84, 192, 235)',
  sky_bottom: 'rgb(167, 224, 245)',
  cloud: 'rgb(255, 255, 255)',
  grass_top: 'rgb(222, 216, 95)',
  grass_dark: 'rgb(199, 194, 70)',
  dirt: 'rgb(222, 187, 197)',
  dirt_shade: 'rgb(205, 168, 178)',
  dirt_light: 'rgb(235, 200, 210)',
  pipe_main: 'rgb(92, 188, 64)',
  pipe_light: 'rgb(120, 212, 88)',
  pipe_dark: 'rgb(70, 158, 48)',
  pipe_shadow: 'rgb(48, 120, 32)',
  bird_body: 'rgb(255, 219, 88)',
  bird_belly: 'rgb(255, 244, 192)',
  bird_wing: 'rgb(240, 196, 60)',
  bird_beak: 'rgb(255, 142, 36)',
  bird_outline: 'rgb(60, 40, 20)',
  eye_white: 'rgb(255, 255, 255)',
  eye_pupil: 'rgb(40, 30, 30)',
  text: '#ffffff',
  text_shadow: 'rgb(60, 50, 30)'
};

// --------------------------------------------------------------------------- //
// Procedural Web Audio Synthesizer (Zero External Assets)
// --------------------------------------------------------------------------- //
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('flappy_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('flappy_muted', this.muted);
    return this.muted;
  }

  playFlap() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }

  playScore() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playHit() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  playDie() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }
}

const sound = new SoundEngine();

// --------------------------------------------------------------------------- //
// Seeded PRNG for Dirt Speckles Consistency
// --------------------------------------------------------------------------- //
function pseudoRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function() {
    return (s = s * 16807 % 2147483647) / 2147483647;
  };
}

const randomSpeckles = [];
const prng = pseudoRandom(7);
for (let i = 0; i < 120; i++) {
  randomSpeckles.push({
    x: prng() * (SCREEN_WIDTH + PIPE_WIDTH),
    y: 26 + prng() * (GROUND_HEIGHT - 26),
    r: 2 + prng() * 2,
    light: prng() >= 0.5
  });
}

// --------------------------------------------------------------------------- //
// Procedural Game Elements
// --------------------------------------------------------------------------- //
const CLOUDS = [
  { x: 80, y: 120, scale: 1.0 },
  { x: 300, y: 80, scale: 0.8 },
  { x: 420, y: 200, scale: 1.2 },
  { x: 180, y: 260, scale: 0.7 }
];

function drawCloud(ctx, x, y, scale = 1.0) {
  const w = 120 * scale;
  const h = 56 * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = COLORS.cloud;

  const puffs = [
    { cx: 0.22 * w, cy: 0.55 * h, r: 0.22 * h },
    { cx: 0.45 * w, cy: 0.40 * h, r: 0.30 * h },
    { cx: 0.70 * w, cy: 0.50 * h, r: 0.26 * h },
    { cx: 0.55 * w, cy: 0.68 * h, r: 0.24 * h }
  ];

  for (const p of puffs) {
    ctx.beginPath();
    ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPipe(ctx, x, gapTop) {
  const topHeight = gapTop;
  const bottomY = gapTop + PIPE_GAP;
  const bottomHeight = SCREEN_HEIGHT - GROUND_HEIGHT - bottomY;
  const capH = 30;

  // --- Top Pipe ---
  ctx.fillStyle = COLORS.pipe_main;
  ctx.fillRect(x, 0, PIPE_WIDTH, topHeight);
  // Highlight strip
  ctx.fillStyle = COLORS.pipe_light;
  ctx.fillRect(x + 6, 0, 12, topHeight);
  // Darker shade
  ctx.fillStyle = COLORS.pipe_dark;
  ctx.fillRect(x + PIPE_WIDTH - 18, 0, 18, topHeight);
  // Edge shadow
  ctx.fillStyle = COLORS.pipe_shadow;
  ctx.fillRect(x + PIPE_WIDTH - 6, 0, 6, topHeight);

  // Top Cap (at the bottom end of top pipe)
  const topCapY = topHeight - capH;
  ctx.fillStyle = COLORS.pipe_main;
  ctx.fillRect(x - 2, topCapY, PIPE_WIDTH + 4, capH);
  ctx.fillStyle = COLORS.pipe_light;
  ctx.fillRect(x + 4, topCapY, 12, capH);
  ctx.fillStyle = COLORS.pipe_dark;
  ctx.fillRect(x + PIPE_WIDTH - 16, topCapY, 18, capH);
  ctx.fillStyle = COLORS.pipe_shadow;
  ctx.fillRect(x + PIPE_WIDTH - 4, topCapY, 6, capH);
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.bird_outline;
  ctx.strokeRect(x - 2, topCapY, PIPE_WIDTH + 4, capH);

  // --- Bottom Pipe ---
  ctx.fillStyle = COLORS.pipe_main;
  ctx.fillRect(x, bottomY, PIPE_WIDTH, bottomHeight);
  // Highlight strip
  ctx.fillStyle = COLORS.pipe_light;
  ctx.fillRect(x + 6, bottomY, 12, bottomHeight);
  // Darker shade
  ctx.fillStyle = COLORS.pipe_dark;
  ctx.fillRect(x + PIPE_WIDTH - 18, bottomY, 18, bottomHeight);
  // Edge shadow
  ctx.fillStyle = COLORS.pipe_shadow;
  ctx.fillRect(x + PIPE_WIDTH - 6, bottomY, 6, bottomHeight);

  // Bottom Cap (at the top end of bottom pipe)
  ctx.fillStyle = COLORS.pipe_main;
  ctx.fillRect(x - 2, bottomY, PIPE_WIDTH + 4, capH);
  ctx.fillStyle = COLORS.pipe_light;
  ctx.fillRect(x + 4, bottomY, 12, capH);
  ctx.fillStyle = COLORS.pipe_dark;
  ctx.fillRect(x + PIPE_WIDTH - 16, bottomY, 18, capH);
  ctx.fillStyle = COLORS.pipe_shadow;
  ctx.fillRect(x + PIPE_WIDTH - 4, bottomY, 6, capH);
  ctx.lineWidth = 3;
  ctx.strokeStyle = COLORS.bird_outline;
  ctx.strokeRect(x - 2, bottomY, PIPE_WIDTH + 4, capH);
}

// --------------------------------------------------------------------------- //
// Bird Class
// --------------------------------------------------------------------------- //
class Bird {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = BIRD_X;
    this.y = SCREEN_HEIGHT / 2;
    this.vy = 0;
    this.angle = 0;
    this.wingPhase = 0;
  }

  flap() {
    this.vy = FLAP_STRENGTH;
    sound.playFlap();
  }

  update() {
    this.vy += GRAVITY;
    if (this.vy > MAX_FALL_SPEED) {
      this.vy = MAX_FALL_SPEED;
    }
    this.y += this.vy;

    // Smooth tilt: nose up when flapping, level when floating, dive when falling fast
    let targetAngle = 0;
    if (this.vy < -0.5) {
      targetAngle = BIRD_FLAP_ANGLE;
    } else if (this.vy > 3.0) {
      targetAngle = BIRD_DIVE_ANGLE;
    } else {
      targetAngle = 0;
    }
    this.angle += (targetAngle - this.angle) * 0.16;
    this.wingPhase = (this.wingPhase + 0.28) % (Math.PI * 2);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const r = BIRD_RADIUS;

    // Outer outline
    ctx.beginPath();
    ctx.arc(0, 0, r + 2, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bird_outline;
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bird_body;
    ctx.fill();

    // Belly
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-r + 6, 2, r * 0.6, (r + 4) * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bird_belly;
    ctx.fill();
    ctx.restore();

    // Flapping Wing
    const wingY = -2 + Math.sin(this.wingPhase) * 3;
    ctx.save();
    ctx.translate(-10, wingY);
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bird_outline;
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bird_wing;
    ctx.fill();
    ctx.restore();

    // Eye
    const eyeX = r - 6;
    const eyeY = -r + 8;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.eye_white;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(eyeX + 1, eyeY, 3, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.eye_pupil;
    ctx.fill();

    // Beak
    ctx.beginPath();
    ctx.moveTo(r - 2, -2);
    ctx.lineTo(r + 13, 2);
    ctx.lineTo(r - 2, 8);
    ctx.closePath();
    ctx.fillStyle = COLORS.bird_outline;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(r + 11, 2);
    ctx.lineTo(r, 6);
    ctx.closePath();
    ctx.fillStyle = COLORS.bird_beak;
    ctx.fill();

    ctx.restore();
  }

  getBounds() {
    const inset = 6;
    return {
      left: this.x - BIRD_RADIUS + inset,
      right: this.x + BIRD_RADIUS - inset,
      top: this.y - BIRD_RADIUS + inset,
      bottom: this.y + BIRD_RADIUS - inset
    };
  }
}

// --------------------------------------------------------------------------- //
// Pipe Object
// --------------------------------------------------------------------------- //
class Pipe {
  constructor(x) {
    this.x = x;
    const margin = 70;
    const minTop = margin;
    const maxTop = SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - margin;
    this.gapTop = Math.floor(minTop + Math.random() * (maxTop - minTop));
    this.passed = false;
  }

  update() {
    this.x -= PIPE_SPEED;
  }

  isOffScreen() {
    return this.x + PIPE_WIDTH < -10;
  }

  draw(ctx) {
    drawPipe(ctx, this.x, this.gapTop);
  }

  collides(b) {
    const topRect = {
      left: this.x,
      right: this.x + PIPE_WIDTH,
      top: 0,
      bottom: this.gapTop
    };
    const bottomRect = {
      left: this.x,
      right: this.x + PIPE_WIDTH,
      top: this.gapTop + PIPE_GAP,
      bottom: SCREEN_HEIGHT - GROUND_HEIGHT
    };

    const checkOverlap = (r1, r2) => {
      return !(
        r1.right < r2.left ||
        r1.left > r2.right ||
        r1.bottom < r2.top ||
        r1.top > r2.bottom
      );
    };

    return checkOverlap(b, topRect) || checkOverlap(b, bottomRect);
  }
}

// --------------------------------------------------------------------------- //
// Main Game Engine
// --------------------------------------------------------------------------- //
class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'MENU'; // 'MENU' | 'PLAY' | 'DEAD'
    this.bird = new Bird();
    this.pipes = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.best = this.loadBest();
    this.groundX = 0;
    this.flash = 0;
    this.deadCooldown = 0;
    this.isPaused = false;
    this.lastTime = 0;
    this.accumulator = 0;

    this.initDPI();
    this.setupEvents();
  }

  initDPI() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = SCREEN_WIDTH * dpr;
    this.canvas.height = SCREEN_HEIGHT * dpr;
    this.ctx.scale(dpr, dpr);
  }

  loadBest() {
    const saved = localStorage.getItem('flappy_best_score');
    return saved ? parseInt(saved, 10) || 0 : 0;
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      localStorage.setItem('flappy_best_score', this.best);
    }
  }

  start() {
    this.bird.reset();
    this.pipes = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.state = 'PLAY';
    this.flash = 0;
    this.bird.flap();
  }

  die() {
    if (this.state !== 'PLAY') return;
    this.state = 'DEAD';
    this.flash = 8;
    this.deadCooldown = 30; // 0.5s cooldown before restart click allowed
    this.saveBest();
    sound.playHit();
    setTimeout(() => sound.playDie(), 120);
  }

  onAction() {
    sound.init();
    if (this.state === 'MENU') {
      this.start();
    } else if (this.state === 'PLAY') {
      this.bird.flap();
    } else if (this.state === 'DEAD' && this.deadCooldown <= 0) {
      this.start();
    }
  }

  setupEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
        e.preventDefault();
        this.onAction();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (this.state === 'PLAY') {
          this.isPaused = !this.isPaused;
        }
      }
    });

    // Canvas click / pointer
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.onAction();
    });

    // Handle mobile orientation/resize
    window.addEventListener('resize', () => {
      this.initDPI();
    });
  }

  update() {
    if (this.isPaused) return;

    // Ground animation
    const groundLoopWidth = SCREEN_WIDTH + PIPE_WIDTH;
    if (this.state === 'PLAY') {
      this.groundX = (this.groundX + PIPE_SPEED) % groundLoopWidth;
    } else {
      this.groundX = (this.groundX + 1) % groundLoopWidth;
    }

    if (this.state === 'DEAD' && this.deadCooldown > 0) {
      this.deadCooldown--;
    }

    if (this.state === 'PLAY') {
      this.bird.update();

      // Spawn pipes
      this.spawnTimer++;
      if (this.spawnTimer >= PIPE_INTERVAL) {
        this.pipes.push(new Pipe(SCREEN_WIDTH));
        this.spawnTimer = 0;
      }

      // Update pipes
      for (const pipe of this.pipes) {
        pipe.update();
        if (!pipe.passed && pipe.x + PIPE_WIDTH < this.bird.x) {
          pipe.passed = true;
          this.score++;
          sound.playScore();
        }
        if (pipe.collides(this.bird.getBounds())) {
          this.die();
        }
      }
      this.pipes = this.pipes.filter(p => !p.isOffScreen());

      // Ground & Ceiling collision
      if (
        this.bird.y + BIRD_RADIUS >= SCREEN_HEIGHT - GROUND_HEIGHT ||
        this.bird.y - BIRD_RADIUS <= 0
      ) {
        this.die();
      }
    }

    if (this.flash > 0) {
      this.flash--;
    }
  }

  drawText(text, fontSize, x, y, fontName = "'Press Start 2P', monospace", color = COLORS.text, shadow = true, center = true) {
    this.ctx.font = `${fontSize}px ${fontName}`;
    this.ctx.textAlign = center ? 'center' : 'left';
    this.ctx.textBaseline = 'top';

    if (shadow) {
      this.ctx.fillStyle = COLORS.text_shadow;
      this.ctx.fillText(text, x + 3, y + 3);
    }
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  draw() {
    const ctx = this.ctx;

    // 1. Sky Gradient Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, SCREEN_HEIGHT);
    skyGrad.addColorStop(0, COLORS.sky_top);
    skyGrad.addColorStop(1, COLORS.sky_bottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 2. Parallax Clouds
    for (const c of CLOUDS) {
      drawCloud(ctx, c.x, c.y, c.scale);
    }

    // 3. Pipes
    for (const pipe of this.pipes) {
      pipe.draw(ctx);
    }

    // 4. Scrolling Ground
    const groundY = SCREEN_HEIGHT - GROUND_HEIGHT;
    ctx.save();
    ctx.translate(-this.groundX, groundY);

    // Render two repeated tiles to guarantee no visual gap
    for (let t = 0; t < 3; t++) {
      const offsetX = t * (SCREEN_WIDTH + PIPE_WIDTH);

      // Dirt Body
      ctx.fillStyle = COLORS.dirt;
      ctx.fillRect(offsetX, 0, SCREEN_WIDTH + PIPE_WIDTH, GROUND_HEIGHT);

      // Grass Top Band
      ctx.fillStyle = COLORS.grass_top;
      ctx.fillRect(offsetX, 0, SCREEN_WIDTH + PIPE_WIDTH, 22);

      // Grass Teeth
      ctx.fillStyle = COLORS.grass_dark;
      for (let i = 0; i < SCREEN_WIDTH + PIPE_WIDTH; i += 14) {
        ctx.beginPath();
        ctx.moveTo(offsetX + i, 22);
        ctx.lineTo(offsetX + i + 7, 22);
        ctx.lineTo(offsetX + i + 3, 30);
        ctx.lineTo(offsetX + i - 3, 30);
        ctx.closePath();
        ctx.fill();
      }

      // Dirt Speckles
      for (const s of randomSpeckles) {
        ctx.fillStyle = s.light ? COLORS.dirt_light : COLORS.dirt_shade;
        ctx.beginPath();
        ctx.arc(offsetX + s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // 5. Bird
    if (this.state !== 'DEAD' || this.flash % 2 === 0) {
      this.bird.draw(ctx);
    }

    // 6. HUD / Overlays
    if (this.state === 'MENU') {
      this.drawText('FLAPPY BIRD', 28, SCREEN_WIDTH / 2, 170);
      this.drawText('TAP / SPACE TO FLAP', 12, SCREEN_WIDTH / 2, 260);
      this.drawText('AVOID THE PIPES!', 11, SCREEN_WIDTH / 2, 310, "'Space Grotesk', sans-serif");
      this.drawText(`BEST SCORE: ${this.best}`, 14, SCREEN_WIDTH / 2, 365, "'Press Start 2P', monospace", COLORS.bird_body);
    } else if (this.state === 'PLAY') {
      this.drawText(String(this.score), 42, SCREEN_WIDTH / 2, 70);
      if (this.isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        this.drawText('PAUSED', 28, SCREEN_WIDTH / 2, 280);
        this.drawText('Press ESC to Resume', 12, SCREEN_WIDTH / 2, 340);
      }
    } else if (this.state === 'DEAD') {
      this.drawText('GAME OVER', 28, SCREEN_WIDTH / 2, 190);
      this.drawText(`SCORE: ${this.score}`, 18, SCREEN_WIDTH / 2, 275);
      this.drawText(`BEST: ${this.best}`, 15, SCREEN_WIDTH / 2, 325, "'Press Start 2P', monospace", COLORS.bird_body);
      
      const retryText = this.deadCooldown > 0 ? 'WAIT...' : 'CLICK / SPACE TO RETRY';
      this.drawText(retryText, 11, SCREEN_WIDTH / 2, 395);
    }

    // 7. Death Flash Effect
    if (this.flash > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    }
  }

  loop(timestamp = 0) {
    if (!this.lastTime) {
      this.lastTime = timestamp;
    }
    let delta = timestamp - this.lastTime;
    this.lastTime = timestamp;

    // Prevent large time spikes when tab is hidden or lag occurs
    if (delta > 100) delta = 100;

    this.accumulator += delta;
    while (this.accumulator >= FRAME_DURATION) {
      this.update();
      this.accumulator -= FRAME_DURATION;
    }

    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// --------------------------------------------------------------------------- //
// Initialization & UI Controls
// --------------------------------------------------------------------------- //
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas);
  requestAnimationFrame((t) => game.loop(t));

  // Sound Toggle Button
  const soundBtn = document.getElementById('soundToggleBtn');
  const soundOnIcon = document.getElementById('soundOnIcon');
  const soundOffIcon = document.getElementById('soundOffIcon');

  function updateSoundUI(isMuted) {
    if (isMuted) {
      soundOnIcon.classList.add('hidden');
      soundOffIcon.classList.remove('hidden');
    } else {
      soundOnIcon.classList.remove('hidden');
      soundOffIcon.classList.add('hidden');
    }
  }

  updateSoundUI(sound.muted);

  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isMuted = sound.toggleMute();
    updateSoundUI(isMuted);
  });

  // Fullscreen Button
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  fullscreenBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  });

  // Mobile Tap Hint auto-dismiss
  const tapOverlay = document.getElementById('tapOverlay');
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    tapOverlay.classList.remove('hidden');
    window.addEventListener('touchstart', () => {
      tapOverlay.classList.add('hidden');
    }, { once: true });
  }
});

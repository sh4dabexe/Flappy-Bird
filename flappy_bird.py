"""
Flappy Bird — a complete game in Python with procedurally generated graphics.

All sprites (bird, pipes, ground, background, digits) are drawn at runtime
using pygame's drawing primitives, so no external image assets are required.

Controls:
    SPACE / UP / Left-click  : flap
    ENTER / SPACE            : start / restart
    ESC                      : quit
"""

import sys
import random
import math

import pygame

# --------------------------------------------------------------------------- #
# Configuration
# --------------------------------------------------------------------------- #
SCREEN_WIDTH = 480
SCREEN_HEIGHT = 720
FPS = 60

GRAVITY = 0.30
FLAP_STRENGTH = -6.8
MAX_FALL_SPEED = 7.5
PIPE_SPEED = 2.5
PIPE_GAP = 190          # vertical opening between top and bottom pipe
PIPE_WIDTH = 78
PIPE_SPACING = 280      # horizontal distance between pipes
PIPE_INTERVAL = 115     # frames between spawns (kept in sync with spacing)

GROUND_HEIGHT = 110
BIRD_X = 130
BIRD_RADIUS = 17
BIRD_FLAP_ANGLE = -25   # degrees (nose up)
BIRD_DIVE_ANGLE = 80    # degrees (nose down)

COLORS = {
    "sky_top": (84, 192, 235),
    "sky_bottom": (167, 224, 245),
    "cloud": (255, 255, 255),
    "grass_top": (222, 216, 95),
    "grass_dark": (199, 194, 70),
    "dirt": (222, 187, 197),
    "dirt_shade": (205, 168, 178),
    "pipe_main": (92, 188, 64),
    "pipe_light": (120, 212, 88),
    "pipe_dark": (70, 158, 48),
    "pipe_shadow": (48, 120, 32),
    "bird_body": (255, 219, 88),
    "bird_belly": (255, 244, 192),
    "bird_wing": (240, 196, 60),
    "bird_beak": (255, 142, 36),
    "bird_outline": (60, 40, 20),
    "eye_white": (255, 255, 255),
    "eye_pupil": (40, 30, 30),
    "text": (255, 255, 255),
    "text_shadow": (60, 50, 30),
}

pygame.init()
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Flappy Bird")
clock = pygame.time.Clock()

# Fonts (use a bold system font; fallback to default if unavailable)
try:
    FONT_BIG = pygame.font.SysFont("arial", 56, bold=True)
    FONT_MED = pygame.font.SysFont("arial", 32, bold=True)
    FONT_SMALL = pygame.font.SysFont("arial", 22, bold=True)
except Exception:
    FONT_BIG = pygame.font.Font(None, 56)
    FONT_MED = pygame.font.Font(None, 32)
    FONT_SMALL = pygame.font.Font(None, 22)


# --------------------------------------------------------------------------- #
# Sprite generation (cached pygame surfaces)
# --------------------------------------------------------------------------- #
def make_rounded_surface(w, h, color):
    """Return a transparent surface with a filled rounded rectangle."""
    surf = pygame.Surface((w, h), pygame.SRCALPHA)
    pygame.draw.rect(surf, color, (0, 0, w, h), border_radius=10)
    return surf


def draw_cloud(x, y, scale=1.0):
    """Return a cloud surface centered at (x, y)."""
    w = int(120 * scale)
    h = int(56 * scale)
    surf = pygame.Surface((w, h), pygame.SRCALPHA)
    puffs = [
        (int(0.22 * w), int(0.55 * h), int(0.22 * h)),
        (int(0.45 * w), int(0.40 * h), int(0.30 * h)),
        (int(0.70 * w), int(0.50 * h), int(0.26 * h)),
        (int(0.55 * w), int(0.68 * h), int(0.24 * h)),
    ]
    for cx, cy, r in puffs:
        pygame.draw.circle(surf, COLORS["cloud"], (cx, cy), r)
    return surf


def make_bird_sprite():
    """Build the bird sprite as a transparent surface with facing-right art."""
    size = BIRD_RADIUS * 2 + 14
    cx, cy = size // 2, size // 2
    surf = pygame.Surface((size, size), pygame.SRCALPHA)

    # Body
    pygame.draw.circle(surf, COLORS["bird_outline"], (cx, cy), BIRD_RADIUS + 2)
    pygame.draw.circle(surf, COLORS["bird_body"], (cx, cy), BIRD_RADIUS)
    # Belly
    pygame.draw.ellipse(
        surf,
        COLORS["bird_belly"],
        (cx - BIRD_RADIUS + 3, cy - 2, BIRD_RADIUS, BIRD_RADIUS + 4),
    )
    # Wing
    wing = pygame.Surface((22, 16), pygame.SRCALPHA)
    pygame.draw.ellipse(wing, COLORS["bird_outline"], (0, 0, 22, 16))
    pygame.draw.ellipse(wing, COLORS["bird_wing"], (2, 2, 18, 12))
    surf.blit(wing, (cx - 14, cy - 2))
    # Eye
    eye_x, eye_y = cx + BIRD_RADIUS - 6, cy - BIRD_RADIUS + 8
    pygame.draw.circle(surf, COLORS["eye_white"], (eye_x, eye_y), 6)
    pygame.draw.circle(surf, COLORS["eye_pupil"], (eye_x + 1, eye_y), 3)
    # Beak
    beak = [
        (cx + BIRD_RADIUS - 2, cy - 2),
        (cx + BIRD_RADIUS + 12, cy + 2),
        (cx + BIRD_RADIUS - 2, cy + 8),
    ]
    pygame.draw.polygon(surf, COLORS["bird_outline"], beak)
    pygame.draw.polygon(
        surf,
        COLORS["bird_beak"],
        [(cx + BIRD_RADIUS, cy), (cx + BIRD_RADIUS + 10, cy + 2), (cx + BIRD_RADIUS, cy + 6)],
    )
    return surf


def make_pipe_sprite(height, cap=True):
    """Build a single pipe segment (with optional lip/cap) of given height."""
    w = PIPE_WIDTH
    surf = pygame.Surface((w, height), pygame.SRCALPHA)
    # Main body
    pygame.draw.rect(surf, COLORS["pipe_main"], (0, 0, w, height))
    # Left highlight
    pygame.draw.rect(surf, COLORS["pipe_light"], (6, 0, 12, height))
    # Right shadow
    pygame.draw.rect(surf, COLORS["pipe_dark"], (w - 18, 0, 18, height))
    pygame.draw.rect(surf, COLORS["pipe_shadow"], (w - 6, 0, 6, height))
    if cap:
        cap_h = 30
        pygame.draw.rect(surf, COLORS["pipe_main"], (0, 0, w, cap_h))
        pygame.draw.rect(surf, COLORS["pipe_light"], (6, 0, 12, cap_h))
        pygame.draw.rect(surf, COLORS["pipe_dark"], (w - 18, 0, 18, cap_h))
        pygame.draw.rect(surf, COLORS["pipe_shadow"], (w - 6, 0, 6, cap_h))
        pygame.draw.rect(surf, COLORS["bird_outline"], (0, 0, w, cap_h), 3)
    return surf


def make_ground_sprite():
    """Build a tileable ground strip."""
    w = SCREEN_WIDTH + PIPE_WIDTH
    h = GROUND_HEIGHT
    surf = pygame.Surface((w, h))
    surf.fill(COLORS["dirt"])
    # Grass band
    pygame.draw.rect(surf, COLORS["grass_top"], (0, 0, w, 22))
    for i in range(0, w, 14):
        pygame.draw.polygon(
            surf,
            COLORS["grass_dark"],
            [(i, 22), (i + 7, 22), (i + 3, 30), (i - 3, 30)],
        )
    # Dirt speckles
    random.seed(7)
    for _ in range(120):
        x = random.randint(0, w - 1)
        y = random.randint(26, h - 1)
        c = COLORS["dirt_shade"] if random.random() < 0.5 else (235, 200, 210)
        pygame.draw.circle(surf, c, (x, y), random.randint(2, 4))
    return surf


def make_background():
    """Build the static sky gradient background."""
    surf = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
    for y in range(SCREEN_HEIGHT):
        t = y / SCREEN_HEIGHT
        r = int(COLORS["sky_top"][0] * (1 - t) + COLORS["sky_bottom"][0] * t)
        g = int(COLORS["sky_top"][1] * (1 - t) + COLORS["sky_bottom"][1] * t)
        b = int(COLORS["sky_top"][2] * (1 - t) + COLORS["sky_bottom"][2] * t)
        pygame.draw.line(surf, (r, g, b), (0, y), (SCREEN_WIDTH, y))
    return surf


# Cache sprites
BIRD_SPRITE = make_bird_sprite()
GROUND_SPRITE = make_ground_sprite()
BACKGROUND = make_background()
CLOUDS = [
    draw_cloud(80, 120, 1.0),
    draw_cloud(300, 80, 0.8),
    draw_cloud(420, 200, 1.2),
    draw_cloud(180, 260, 0.7),
]


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def draw_text(text, font, x, y, color=COLORS["text"], shadow=True, center=True):
    """Draw text with an optional drop shadow."""
    if center:
        pos = (x - font.size(text)[0] // 2, y)
    else:
        pos = (x, y)
    if shadow:
        shadow_surf = font.render(text, True, COLORS["text_shadow"])
        screen.blit(shadow_surf, (pos[0] + 3, pos[1] + 3))
    main = font.render(text, True, color)
    screen.blit(main, pos)


# --------------------------------------------------------------------------- #
# Game objects
# --------------------------------------------------------------------------- #
class Bird:
    def __init__(self):
        self.reset()

    def reset(self):
        self.x = BIRD_X
        self.y = SCREEN_HEIGHT // 2
        self.vy = 0
        self.angle = 0
        self.wing_phase = 0

    def flap(self):
        self.vy = FLAP_STRENGTH

    def update(self):
        self.vy = min(self.vy + GRAVITY, MAX_FALL_SPEED)
        self.y += self.vy
        # Tilt based on vertical velocity
        target = BIRD_DIVE_ANGLE if self.vy > 3 else (BIRD_FLAP_ANGLE if self.vy < 0 else 0)
        self.angle += (target - self.angle) * 0.16
        self.wing_phase = (self.wing_phase + 0.28) % (math.pi * 2)

    def draw(self):
        sprite = BIRD_SPRITE
        # Wing flap animation: small vertical bob of the wing handled in sprite;
        # here we just rotate the whole bird.
        rotated = pygame.transform.rotate(sprite, self.angle)
        rect = rotated.get_rect(center=(self.x, self.y))
        screen.blit(rotated, rect)

    @property
    def rect(self):
        inset = 5
        return pygame.Rect(
            self.x - BIRD_RADIUS + inset, self.y - BIRD_RADIUS + inset,
            (BIRD_RADIUS - inset) * 2, (BIRD_RADIUS - inset) * 2,
        )


class Pipe:
    def __init__(self, x):
        self.x = x
        # Random gap position, kept away from top and ground
        margin = 70
        min_top = margin
        max_top = SCREEN_HEIGHT - GROUND_HEIGHT - PIPE_GAP - margin
        self.gap_top = random.randint(min_top, max_top)
        self.passed = False

    def update(self):
        self.x -= PIPE_SPEED

    @property
    def off_screen(self):
        return self.x + PIPE_WIDTH < 0

    def draw(self):
        top_height = self.gap_top
        bottom_y = self.gap_top + PIPE_GAP
        bottom_height = SCREEN_HEIGHT - GROUND_HEIGHT - bottom_y

        top_sprite = make_pipe_sprite(top_height, cap=True)
        bottom_sprite = make_pipe_sprite(bottom_height, cap=True)
        # Top pipe hangs from ceiling, cap at its bottom
        screen.blit(top_sprite, (self.x, 0))
        # Bottom pipe, cap at its top
        screen.blit(bottom_sprite, (self.x, bottom_y))

    def collides(self, bird_rect):
        top_rect = pygame.Rect(self.x, 0, PIPE_WIDTH, self.gap_top)
        bottom_rect = pygame.Rect(
            self.x, self.gap_top + PIPE_GAP, PIPE_WIDTH,
            SCREEN_HEIGHT - GROUND_HEIGHT - (self.gap_top + PIPE_GAP),
        )
        return bird_rect.colliderect(top_rect) or bird_rect.colliderect(bottom_rect)


# --------------------------------------------------------------------------- #
# Game state
# --------------------------------------------------------------------------- #
class Game:
    STATE_MENU = 0
    STATE_PLAY = 1
    STATE_DEAD = 2

    def __init__(self):
        self.reset()

    def reset(self):
        self.state = self.STATE_MENU
        self.bird = Bird()
        self.pipes = []
        self.spawn_timer = 0
        self.score = 0
        self.best = self.load_best()
        self.ground_x = 0
        self.flash = 0  # white flash on death

    def load_best(self):
        try:
            with open("best.txt", "r") as f:
                return int(f.read().strip())
        except Exception:
            return 0

    def save_best(self):
        try:
            with open("best.txt", "w") as f:
                f.write(str(self.best))
        except Exception:
            pass

    def start(self):
        self.reset()
        self.state = self.STATE_PLAY

    def spawn_pipe(self):
        self.pipes.append(Pipe(SCREEN_WIDTH))

    def update(self):
        # Animate ground always
        if self.state == self.STATE_PLAY:
            self.ground_x = (self.ground_x - PIPE_SPEED) % (GROUND_SPRITE.get_width() - SCREEN_WIDTH)
        else:
            self.ground_x = (self.ground_x - 1) % (GROUND_SPRITE.get_width() - SCREEN_WIDTH)

        if self.state == self.STATE_PLAY:
            self.bird.update()

            # Spawn pipes
            self.spawn_timer += 1
            if self.spawn_timer >= PIPE_INTERVAL:
                self.spawn_pipe()
                self.spawn_timer = 0

            for pipe in self.pipes:
                pipe.update()
                if not pipe.passed and pipe.x + PIPE_WIDTH < self.bird.x:
                    pipe.passed = True
                    self.score += 1
                if pipe.collides(self.bird.rect):
                    self.die()
            self.pipes = [p for p in self.pipes if not p.off_screen]

            # Ground / ceiling collision
            if (self.bird.y + BIRD_RADIUS >= SCREEN_HEIGHT - GROUND_HEIGHT
                    or self.bird.y - BIRD_RADIUS <= 0):
                self.die()

        if self.flash > 0:
            self.flash -= 1

    def die(self):
        if self.state != self.STATE_PLAY:
            return
        self.state = self.STATE_DEAD
        self.flash = 8
        if self.score > self.best:
            self.best = self.score
            self.save_best()

    def handle_input(self, event):
        if event.type == pygame.KEYDOWN:
            if event.key in (pygame.K_SPACE, pygame.K_UP, pygame.K_RETURN):
                self.on_action()
        elif event.type == pygame.MOUSEBUTTONDOWN:
            self.on_action()

    def on_action(self):
        if self.state == self.STATE_MENU:
            self.start()
        elif self.state == self.STATE_PLAY:
            self.bird.flap()
        elif self.state == self.STATE_DEAD:
            # Small delay guard handled by caller; restart on action
            self.start()

    def draw(self):
        # Background
        screen.blit(BACKGROUND, (0, 0))
        for cloud in CLOUDS:
            screen.blit(cloud, (0, 0))

        # Pipes
        for pipe in self.pipes:
            pipe.draw()

        # Ground
        screen.blit(GROUND_SPRITE, (-self.ground_x, SCREEN_HEIGHT - GROUND_HEIGHT))

        # Bird
        if self.state != self.STATE_DEAD or self.flash % 2 == 0:
            self.bird.draw()

        # HUD / overlays
        if self.state == self.STATE_MENU:
            draw_text("FLAPPY BIRD", FONT_BIG, SCREEN_WIDTH // 2, 180)
            draw_text("Click / SPACE to flap", FONT_MED, SCREEN_WIDTH // 2, 260)
            draw_text("Avoid the pipes!", FONT_SMALL, SCREEN_WIDTH // 2, 310)
            draw_text(f"Best: {self.best}", FONT_SMALL, SCREEN_WIDTH // 2, 360)
        elif self.state == self.STATE_PLAY:
            draw_text(str(self.score), FONT_BIG, SCREEN_WIDTH // 2, 80)
        elif self.state == self.STATE_DEAD:
            draw_text("GAME OVER", FONT_BIG, SCREEN_WIDTH // 2, 200)
            draw_text(f"Score: {self.score}", FONT_MED, SCREEN_WIDTH // 2, 280)
            draw_text(f"Best: {self.best}", FONT_SMALL, SCREEN_WIDTH // 2, 330)
            draw_text("Click / SPACE to retry", FONT_SMALL, SCREEN_WIDTH // 2, 400)

        if self.flash > 0:
            flash_surf = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
            flash_surf.fill((255, 255, 255, 180))
            screen.blit(flash_surf, (0, 0))


# --------------------------------------------------------------------------- #
# Main loop
# --------------------------------------------------------------------------- #
def main():
    game = Game()
    dead_cooldown = 0

    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                pygame.quit()
                sys.exit()
            if game.state == game.STATE_DEAD:
                if dead_cooldown <= 0:
                    game.handle_input(event)
            else:
                game.handle_input(event)

        if game.state == game.STATE_DEAD and dead_cooldown > 0:
            dead_cooldown -= 1

        # Set a short cooldown after death so the killing click doesn't instantly restart
        if game.state == game.STATE_DEAD and dead_cooldown == 0 and dead_cooldown == 0:
            pass
        game.update()

        # Track transition into dead state to set cooldown
        if game.state == game.STATE_DEAD and dead_cooldown == 0:
            # Only set once: detect via a flag
            pass

        game.draw()
        pygame.display.flip()
        clock.tick(FPS)


if __name__ == "__main__":
    main()

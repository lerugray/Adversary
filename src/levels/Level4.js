/**
 * Level4.js — "The Pale Spire" level data definition.
 *
 * Theme: Grand cathedral, cold white stone, the final ascent.
 * DK-style full-width platforms with zigzag ladders up to the boss arena.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.  Y increases downward.
 *   World size: 256 × 380.
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   ┌──────────────────────────────────────────┐
 *         │                                           │
 *   y=40  │       ██████  center ledge  ██████        │  (20px jump from sides)
 *         │                                           │
 *   y=60  │  ████                            ████     │  upper arena ledges (20px jump)
 *         │                                           │
 *   y=80  │  ████████████████████████████████████████ │  ARENA FLOOR / boss threshold
 *         │            ↑ ladder (left x=14)           │
 *   y=140 │  ████████████████████████████████████████ │  approach tier 3
 *         │                       ↑ ladder (right)    │
 *   y=200 │  ████████████████████████████████████████ │  approach tier 2
 *         │            ↑ ladder (left x=14)           │
 *   y=260 │  ████████████████████████████████████████ │  approach tier 1
 *         │                       ↑ ladder (right)    │
 *   y=320 │  ████████████████████████████████████████ │  GROUND
 *   y=380 └──────────────────────────────────────────┘
 *
 *   Ladder zigzag: right → left → right → left (up to arena)
 */

const Level4Data = {
  name: 'The Pale Spire',

  // ── World dimensions ───────────────────────────────────────────────────
  worldWidth:  256,
  worldHeight: 380,

  // ── Player spawn ───────────────────────────────────────────────────────
  playerSpawn: { x: 28, y: 314 },

  // ── No bonfire checkpoint — boss threshold triggers the boss ───────────
  checkpoint: null,

  bossThreshold: { x: 0, y: 80, w: 256 },

  // ── Weak points for boss fight ─────────────────────────────────────────
  weakPoints: [
    { x: 20,  y: 74,  radius: 6 },
    { x: 236, y: 74,  radius: 6 },
    { x: 20,  y: 54,  radius: 6 },
    { x: 236, y: 54,  radius: 6 },
  ],

  // ── Platform tiers ─────────────────────────────────────────────────────
  platforms: [

    // Ground (full width cathedral floor)
    { x: 0,   y: 320, w: 256, h: 60,  tier: 0 },

    // Approach tier 1 — full width (DK style)
    { x: 0,   y: 260, w: 256, h: 10,  tier: 1 },

    // Approach tier 2 — full width
    { x: 0,   y: 200, w: 256, h: 10,  tier: 2 },

    // Approach tier 3 — full width, leads to arena
    { x: 0,   y: 140, w: 256, h: 10,  tier: 3 },

    // ── Boss Arena ──────────────────────────────────────────────────
    // Arena floor — full width, the main fighting platform
    { x: 0,   y: 80,  w: 256, h: 10,  tier: 4 },

    // Arena upper ledges — 20px above floor (jumpable)
    { x: 0,   y: 60,  w: 60,  h: 8,   tier: 5 },
    { x: 196, y: 60,  w: 60,  h: 8,   tier: 5 },

    // Arena center ledge — 20px above side ledges (jumpable)
    { x: 95,  y: 40,  w: 66,  h: 8,   tier: 6 },

  ],

  // ── Ladder zones (DK-style zigzag approach) ────────────────────────────
  ladders: [
    // Ground → Tier 1 (right side)
    { x: 215, topY: 260, bottomY: 320, w: 14 },

    // Tier 1 → Tier 2 (left side)
    { x: 40,  topY: 200, bottomY: 260, w: 14 },

    // Tier 2 → Tier 3 (right side)
    { x: 215, topY: 140, bottomY: 200, w: 14 },

    // Tier 3 → Arena floor (left side)
    { x: 40,  topY: 80,  bottomY: 140, w: 14 },
  ],

  // ── Enemy spawn markers (approach only — boss owns the arena) ─────────
  enemySpawns: [
    // Ground — knight patrol
    { x: 130, y: 312, type: 'hollow_knight' },

    // Tier 1 — archer midway
    { x: 120, y: 252, type: 'hollow_archer' },

    // Tier 2 — knight guards the climb
    { x: 130, y: 192, type: 'hollow_knight' },

    // Tier 3 — archer near the arena entrance
    { x: 100, y: 132, type: 'hollow_archer' },
  ],

  // ── Decorative elements ────────────────────────────────────────────────
  decorations: [
    // Cathedral pillars — left
    { x: 0,   y: 0,   w: 14, h: 80, color: 0x4a4858, alpha: 0.7 },
    // Cathedral pillars — right
    { x: 242, y: 0,   w: 14, h: 80, color: 0x4a4858, alpha: 0.7 },

    // Stained glass window suggestion — upper center
    { x: 110, y: 8,   w: 36, h: 14, color: 0x585668, alpha: 0.5 },

    // Cold stone wall panels — approach area
    { x: 0,   y: 160, w: 8,  h: 60, color: 0x3a3845, alpha: 0.8 },
    { x: 248, y: 160, w: 8,  h: 60, color: 0x3a3845, alpha: 0.8 },

    // Rubble at arena edge
    { x: 70,  y: 74,  w: 30, h: 5,  color: 0x4a4858, alpha: 0.6 },
    { x: 156, y: 74,  w: 30, h: 5,  color: 0x4a4858, alpha: 0.6 },

    // Distant spire silhouettes
    { x: 60,  y: 0,   w: 10, h: 30, color: 0x3a3845, alpha: 0.35 },
    { x: 186, y: 0,   w: 10, h: 30, color: 0x3a3845, alpha: 0.35 },

    // Floor tile accent — ground level
    { x: 80,  y: 316, w: 90, h: 4,  color: 0x585668, alpha: 0.5 },
  ],

};

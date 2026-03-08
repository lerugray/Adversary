/**
 * Level4.js — "The Pale Spire" level data definition.
 *
 * Theme: Grand cathedral, cold white stone, the final ascent.
 * Short DK-style ladder climb to a wide boss arena.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.  Y increases downward.
 *   World size: 256 × 310.
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   ┌──────────────────────────────────────────┐
 *         │                                           │
 *   y=30  │  ████   center ledge (22px jump)    ████  │
 *         │                                           │
 *   y=50  │ ████                            ████      │  upper arena ledges
 *         │                                           │
 *   y=70  │ ████████████████████████████████████████  │  ARENA FLOOR
 *         │                bossThreshold              │
 *   y=92  │ ████████████████████                      │  approach tier 3
 *         │                                           │
 *   y=114 │          ████████████████████████         │  approach tier 2
 *         │                                           │
 *   y=136 │ ████████████████████                      │  approach tier 1
 *         │                                           │
 *   y=160 │ ████████████████████████████████████████  │  GROUND
 *   y=310 └──────────────────────────────────────────┘
 *
 *   Ladder zigzag: right → left → right → left (up to arena)
 */

const Level4Data = {
  name: 'The Pale Spire',

  // ── World dimensions ───────────────────────────────────────────────────
  worldWidth:  256,
  worldHeight: 310,

  // ── Player spawn ───────────────────────────────────────────────────────
  playerSpawn: { x: 28, y: 154 },

  // ── No bonfire checkpoint — boss threshold triggers the boss ───────────
  checkpoint: null,

  bossThreshold: { x: 0, y: 70, w: 256 },

  // ── Weak points for boss fight ─────────────────────────────────────────
  weakPoints: [
    { x: 20,  y: 64,  radius: 6 },
    { x: 236, y: 64,  radius: 6 },
    { x: 20,  y: 44,  radius: 6 },
    { x: 236, y: 44,  radius: 6 },
  ],

  // ── Platform tiers ─────────────────────────────────────────────────────
  platforms: [

    // Ground (full width cathedral floor)
    { x: 0,   y: 160, w: 256, h: 150, tier: 0 },

    // Approach tier 1 — left side
    { x: 0,   y: 136, w: 140, h: 10,  tier: 1 },

    // Approach tier 2 — right side
    { x: 110, y: 114, w: 146, h: 10,  tier: 2 },

    // Approach tier 3 — left side, leads to arena
    { x: 0,   y: 92,  w: 150, h: 10,  tier: 3 },

    // ── Boss Arena ──────────────────────────────────────────────────
    // Arena floor — full width, the main fighting platform
    { x: 0,   y: 70,  w: 256, h: 10,  tier: 4 },

    // Arena upper ledges — 20px above floor (jumpable)
    { x: 0,   y: 50,  w: 60,  h: 8,   tier: 5 },
    { x: 196, y: 50,  w: 60,  h: 8,   tier: 5 },

    // Arena center ledge — 20px above side ledges (jumpable)
    { x: 95,  y: 30,  w: 66,  h: 8,   tier: 6 },

  ],

  // ── Ladder zones (DK-style zigzag approach) ────────────────────────────
  ladders: [
    // Ground → Tier 1 (right side)
    { x: 215, topY: 136, bottomY: 160, w: 14 },

    // Tier 1 → Tier 2 (left side)
    { x: 14,  topY: 114, bottomY: 136, w: 14 },

    // Tier 2 → Tier 3 (right side)
    { x: 228, topY: 92,  bottomY: 114, w: 14 },

    // Tier 3 → Arena floor (left side)
    { x: 14,  topY: 70,  bottomY: 92,  w: 14 },
  ],

  // ── Enemy spawn markers (approach only — boss owns the arena) ─────────
  enemySpawns: [
    // Ground — knight patrol
    { x: 160, y: 152, type: 'hollow_knight' },

    // Tier 1 — archer on approach ledge
    { x: 80,  y: 128, type: 'hollow_archer' },

    // Tier 2 — knight guards the upper approach
    { x: 180, y: 106, type: 'hollow_knight' },
  ],

  // ── Decorative elements ────────────────────────────────────────────────
  decorations: [
    // Cathedral pillars — left
    { x: 0,   y: 0,   w: 14, h: 70, color: 0x4a4858, alpha: 0.7 },
    // Cathedral pillars — right
    { x: 242, y: 0,   w: 14, h: 70, color: 0x4a4858, alpha: 0.7 },

    // Stained glass window suggestion — upper center
    { x: 110, y: 5,   w: 36, h: 12, color: 0x585668, alpha: 0.5 },

    // Cold stone wall panels — approach area
    { x: 0,   y: 100, w: 8,  h: 50, color: 0x3a3845, alpha: 0.8 },
    { x: 248, y: 100, w: 8,  h: 50, color: 0x3a3845, alpha: 0.8 },

    // Rubble at arena edge
    { x: 70,  y: 64,  w: 30, h: 5,  color: 0x4a4858, alpha: 0.6 },
    { x: 156, y: 64,  w: 30, h: 5,  color: 0x4a4858, alpha: 0.6 },

    // Distant spire silhouettes
    { x: 60,  y: 0,   w: 10, h: 25, color: 0x3a3845, alpha: 0.35 },
    { x: 186, y: 0,   w: 10, h: 25, color: 0x3a3845, alpha: 0.35 },

    // Floor tile accent — ground level
    { x: 80,  y: 156, w: 90, h: 4,  color: 0x585668, alpha: 0.5 },
  ],

};

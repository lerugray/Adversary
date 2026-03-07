/**
 * Level4.js — "The Ivory Spire" level data definition.
 *
 * Theme: Grand cathedral, cold white stone, the final ascent.
 * Shorter level — mostly boss arena. Wide open arena at top.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.  Y increases downward.
 *   World size: 256 × 280.
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   ┌──────────────────────────────────────────┐
 *         │                                           │
 *         │  ████████████████████████████████████████  │
 *   y=20  │  █          BOSS ARENA              █    │
 *         │  █    (wide open space)              █    │
 *   y=60  │  █                                   █    │
 *         │  █                                   █    │
 *   y=100 │  ████████████████████████████████████████  │ ← bossThreshold
 *         │                                           │
 *   y=140 │  ██████████████████                       │
 *         │                    ████████████  Tier 2   │
 *   y=185 │  ████████████████                         │
 *         │                                           │
 *   y=230 │  ██████████████████████████  GROUND       │
 *   y=280 └──────────────────────────────────────────┘
 *
 */

const Level4Data = {

  // ── World dimensions ───────────────────────────────────────────────────
  worldWidth:  256,
  worldHeight: 280,

  // ── Player spawn ───────────────────────────────────────────────────────
  playerSpawn: { x: 28, y: 224 },

  // ── No bonfire checkpoint — boss threshold triggers the boss ───────────
  checkpoint: null,

  bossThreshold: { x: 0, y: 100, w: 256 },

  // ── Weak points for boss fight (Phase 5B builds these) ─────────────────
  weakPoints: [
    { x: 40,  y: 110, radius: 6 },
    { x: 216, y: 110, radius: 6 },
    { x: 30,  y: 140, radius: 6 },
    { x: 226, y: 140, radius: 6 },
  ],

  // ── Platform tiers ─────────────────────────────────────────────────────
  platforms: [

    // Tier 0 — Ground
    { x: 0,   y: 230, w: 256, h: 50,  tier: 0 },

    // Tier 1 — Approach ledge left
    { x: 0,   y: 190, w: 100, h: 10,  tier: 1 },

    // Tier 2 — Approach ledge right (staggered for climbing)
    { x: 130, y: 155, w: 90,  h: 10,  tier: 2 },

    // Tier 3 — Approach ledge, leads to arena
    { x: 0,   y: 120, w: 110, h: 10,  tier: 3 },

    // ── Boss Arena platforms ──────────────────────────────────────────
    // Wide arena floor — the most open horizontal space in the game
    { x: 0,   y: 92,  w: 256, h: 10,  tier: 4 },

    // Arena upper ledges — low platforms for vertical play during boss
    { x: 0,   y: 55,  w: 70,  h: 8,   tier: 5 },
    { x: 186, y: 55,  w: 70,  h: 8,   tier: 5 },

    // Arena ceiling ledge — center
    { x: 90,  y: 22,  w: 76,  h: 8,   tier: 6 },

  ],

  // ── Ladder zones ───────────────────────────────────────────────────────
  ladders: [
    // Ladder A: Ground → Tier 1 (simple approach)
    { x: 14,  topY: 190, bottomY: 230, w: 14 },

    // Ladder B: Tier 2 → Tier 3
    { x: 90,  topY: 120, bottomY: 165, w: 14 },
  ],

  // ── Enemy spawn markers (below boss threshold only) ────────────────────
  enemySpawns: [
    // Tier 0 — ground knight
    { x: 160, y: 222, type: 'hollow_knight' },

    // Tier 1 — archer on approach ledge
    { x: 60,  y: 182, type: 'hollow_archer' },

    // Tier 2 — knight guards the final approach
    { x: 170, y: 147, type: 'hollow_knight' },
  ],

  // ── Decorative elements ────────────────────────────────────────────────
  decorations: [
    // Cathedral pillars — left
    { x: 0,   y: 0,   w: 14, h: 92, color: 0x4a4858, alpha: 0.7 },
    // Cathedral pillars — right
    { x: 242, y: 0,   w: 14, h: 92, color: 0x4a4858, alpha: 0.7 },

    // Stained glass window suggestion — upper center
    { x: 110, y: 5,   w: 36, h: 12, color: 0x585668, alpha: 0.5 },

    // Cold stone wall panels — approach area
    { x: 0,   y: 140, w: 8,  h: 50, color: 0x3a3845, alpha: 0.8 },
    { x: 248, y: 140, w: 8,  h: 50, color: 0x3a3845, alpha: 0.8 },

    // Rubble at arena edge
    { x: 110, y: 86,  w: 36, h: 5,  color: 0x4a4858, alpha: 0.6 },

    // Distant spire silhouettes
    { x: 60,  y: 0,   w: 10, h: 30, color: 0x3a3845, alpha: 0.35 },
    { x: 186, y: 0,   w: 10, h: 30, color: 0x3a3845, alpha: 0.35 },

    // Floor tile accent — ground level
    { x: 80,  y: 226, w: 90, h: 4,  color: 0x585668, alpha: 0.5 },
  ],

};

/**
 * Level3.js — "The Iron Gauntlet" level data definition.
 *
 * Theme: Iron architecture, riveted metal platforms, brutal tight climb.
 * The hardest non-boss level. Tallest level in the game.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.  Y increases downward.
 *   World size: 256 × 360.
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   ┌──────────────────────────────────────────┐
 *         │              BACKGROUND                   │
 *   y=30  │  [IRON GATE CHECKPOINT]                   │
 *         │  ██████████████  Tier 7 (summit)          │
 *   y=65  │         ████████████                      │
 *         │                      ████  Tier 6         │
 *   y=100 │  ██████████                               │
 *         │            ████████████████  Tier 5       │
 *   y=140 │  ████████████████                         │
 *         │                    ████████  Tier 4       │
 *   y=180 │  ██████████                               │
 *         │            ████████████████  Tier 3       │
 *   y=225 │  ████████████                             │
 *         │                  ██████████  Tier 2       │
 *   y=270 │  ████████████████                         │
 *         │                ████████████  Tier 1       │
 *   y=318 │  ██████████████████████████  GROUND       │
 *   y=360 └──────────────────────────────────────────┘
 *
 */

const Level3Data = {

  // ── World dimensions ───────────────────────────────────────────────────
  worldWidth:  256,
  worldHeight: 360,

  // ── Player spawn ───────────────────────────────────────────────────────
  playerSpawn: { x: 28, y: 312 },

  // ── Checkpoint (heavy iron gate at summit) ─────────────────────────────
  checkpoint: {
    x: 36,
    y: 28,
    radius: 8,
    type: 'iron_gate',
  },

  // ── Platform tiers ─────────────────────────────────────────────────────
  platforms: [

    // Tier 0 — Ground (iron floor)
    { x: 0,   y: 318, w: 256, h: 42,  tier: 0 },

    // Tier 1 — Entry ledges
    { x: 0,   y: 278, w: 90,  h: 10,  tier: 1 },
    { x: 140, y: 275, w: 80,  h: 10,  tier: 1 },
    { x: 230, y: 280, w: 26,  h: 10,  tier: 1 },

    // Tier 2 — Narrow iron grating
    { x: 0,   y: 235, w: 70,  h: 10,  tier: 2 },
    { x: 130, y: 230, w: 70,  h: 10,  tier: 2 },
    { x: 218, y: 238, w: 38,  h: 10,  tier: 2 },

    // Tier 3 — GAUNTLET SECTION: wide connected platforms forcing combat
    { x: 0,   y: 192, w: 256, h: 10,  tier: 3 },

    // Tier 4 — Tight climb continues
    { x: 0,   y: 155, w: 55,  h: 10,  tier: 4 },
    { x: 110, y: 148, w: 90,  h: 10,  tier: 4 },
    { x: 220, y: 155, w: 36,  h: 10,  tier: 4 },

    // Tier 5 — More gauntlet: wide platform with enemies
    { x: 0,   y: 110, w: 180, h: 10,  tier: 5 },
    { x: 200, y: 115, w: 56,  h: 10,  tier: 5 },

    // Tier 6 — Narrow perches near summit
    { x: 80,  y: 72,  w: 60,  h: 10,  tier: 6 },
    { x: 200, y: 68,  w: 56,  h: 10,  tier: 6 },

    // Tier 7 — Summit platform (iron gate)
    { x: 0,   y: 38,  w: 100, h: 10,  tier: 7 },

  ],

  // ── Ladder zones ───────────────────────────────────────────────────────
  ladders: [
    // Ladder A: Ground → Tier 1 left
    { x: 14,  topY: 278, bottomY: 318, w: 14 },

    // Ladder B: Tier 1 right → Tier 2 right
    { x: 235, topY: 235, bottomY: 280, w: 14 },

    // Ladder C: Tier 2 left → Tier 3 (gauntlet)
    { x: 30,  topY: 192, bottomY: 245, w: 14 },

    // Ladder D: Tier 3 → Tier 4 mid
    { x: 150, topY: 148, bottomY: 202, w: 14 },

    // Ladder E: Tier 4 left → Tier 5
    { x: 30,  topY: 110, bottomY: 165, w: 14 },

    // Ladder F: Tier 5 → Tier 6
    { x: 105, topY: 72,  bottomY: 120, w: 14 },

    // Ladder G: Tier 6 → Tier 7 summit
    { x: 85,  topY: 38,  bottomY: 82,  w: 14 },
  ],

  // ── Enemy spawn markers ────────────────────────────────────────────────
  enemySpawns: [
    // Ground — soldier patrol
    { x: 150, y: 310, type: 'hollow_soldier' },

    // Tier 1 — archer on right ledge
    { x: 170, y: 267, type: 'hollow_archer' },

    // Tier 2 — skeleton lurks
    { x: 50,  y: 227, type: 'skeleton' },

    // Tier 3 — GAUNTLET: soldier + knight on wide platform forcing combat
    { x: 60,  y: 184, type: 'hollow_soldier' },
    { x: 180, y: 184, type: 'hollow_knight' },

    // Tier 4 — archer on elevated perch
    { x: 230, y: 147, type: 'hollow_archer' },

    // Tier 5 — knight + gargoyle in open space
    { x: 100, y: 102, type: 'hollow_knight' },
    { x: 140, y: 90,  type: 'gargoyle', patrolLeft: 60, patrolRight: 200, patrolY: 90 },

    // Tier 6 — gargoyle in open vertical space near summit
    { x: 180, y: 52,  type: 'gargoyle', patrolLeft: 70, patrolRight: 240, patrolY: 52 },
  ],

  // ── Decorative elements ────────────────────────────────────────────────
  decorations: [
    // Iron girder silhouettes — background
    { x: 0,   y: 0,   w: 20, h: 80, color: 0x2a2018, alpha: 0.5 },
    { x: 240, y: 0,   w: 16, h: 90, color: 0x2a2018, alpha: 0.5 },

    // Riveted wall panel — left side
    { x: 0,   y: 160, w: 8,  h: 30, color: 0x3a3028, alpha: 0.85 },

    // Rust streaks — between tiers
    { x: 95,  y: 250, w: 20, h: 6,  color: 0x4a3c30, alpha: 0.7 },
    { x: 200, y: 200, w: 15, h: 5,  color: 0x4a3c30, alpha: 0.65 },

    // Broken iron beam fragments
    { x: 70,  y: 135, w: 25, h: 5,  color: 0x3a3028, alpha: 0.8 },
    { x: 180, y: 100, w: 14, h: 8,  color: 0x3a3028, alpha: 0.7 },

    // Distant iron tower silhouette
    { x: 150, y: 0,   w: 12, h: 50, color: 0x2a2018, alpha: 0.35 },
    { x: 120, y: 0,   w: 8,  h: 35, color: 0x2a2018, alpha: 0.3  },

    // Heavy gate frame at summit
    { x: 100, y: 30,  w: 6,  h: 18, color: 0x3a3028, alpha: 0.9 },
    { x: 0,   y: 30,  w: 6,  h: 18, color: 0x3a3028, alpha: 0.9 },
  ],

};

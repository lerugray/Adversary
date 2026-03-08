/**
 * Level4.js — "The Pale Spire" level data definition.
 *
 * Theme: Grand cathedral, cold white stone, boss arena.
 * No approach section — the fight starts immediately.
 * Two raised side platforms with short ladders for tactical positioning.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.  Y increases downward.
 *   World size: 256 × 270.
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   ┌──────────────────────────────────────────┐
 *         │                                           │
 *         │                                           │
 *         │  [WP]                            [WP]     │  weak points
 *   y=165 │  ████                            ████     │  side platforms
 *         │   ║                                ║      │  (short ladders)
 *         │  [WP]                            [WP]     │  weak points
 *   y=210 │  ████████████████████████████████████████ │  ARENA FLOOR
 *         │                                           │
 *   y=270 └──────────────────────────────────────────┘
 *
 */

const Level4Data = {
  name: 'The Pale Spire',

  // ── World dimensions ───────────────────────────────────────────────────
  worldWidth:  256,
  worldHeight: 270,

  // ── Player spawn (on the arena floor) ──────────────────────────────────
  playerSpawn: { x: 40, y: 204 },

  // ── No checkpoint — boss fight ─────────────────────────────────────────
  checkpoint: null,

  // Boss triggers immediately (threshold at floor level, player spawns above it)
  bossThreshold: { x: 0, y: 210, w: 256 },

  // ── Weak points for boss fight (at arena edges) ────────────────────────
  weakPoints: [
    { x: 18,  y: 204, radius: 6 },   // floor left
    { x: 238, y: 204, radius: 6 },   // floor right
    { x: 18,  y: 159, radius: 6 },   // platform left
    { x: 238, y: 159, radius: 6 },   // platform right
  ],

  // ── Platform tiers ─────────────────────────────────────────────────────
  platforms: [

    // Arena floor — full width
    { x: 0,   y: 210, w: 256, h: 60,  tier: 0 },

    // Left raised platform (45px above floor — needs ladder)
    { x: 0,   y: 165, w: 60,  h: 8,   tier: 1 },

    // Right raised platform
    { x: 196, y: 165, w: 60,  h: 8,   tier: 1 },

  ],

  // ── Short ladders to side platforms ────────────────────────────────────
  ladders: [
    { x: 40,  topY: 165, bottomY: 210, w: 14 },
    { x: 220, topY: 165, bottomY: 210, w: 14 },
  ],

  // ── No regular enemies — boss owns this level ─────────────────────────
  enemySpawns: [],

  // ── Decorative elements ────────────────────────────────────────────────
  decorations: [
    // Cathedral pillars — left
    { x: 0,   y: 0,   w: 14, h: 210, color: 0x4a4858, alpha: 0.7 },
    // Cathedral pillars — right
    { x: 242, y: 0,   w: 14, h: 210, color: 0x4a4858, alpha: 0.7 },

    // Inner pillars framing the arena
    { x: 60,  y: 120, w: 8,  h: 90,  color: 0x3a3845, alpha: 0.5 },
    { x: 188, y: 120, w: 8,  h: 90,  color: 0x3a3845, alpha: 0.5 },

    // Stained glass window — upper center
    { x: 100, y: 20,  w: 56, h: 24,  color: 0x585668, alpha: 0.5 },

    // Stained glass side windows
    { x: 20,  y: 40,  w: 24, h: 16,  color: 0x484060, alpha: 0.4 },
    { x: 212, y: 40,  w: 24, h: 16,  color: 0x484060, alpha: 0.4 },

    // Distant spire silhouettes
    { x: 70,  y: 0,   w: 10, h: 40,  color: 0x3a3845, alpha: 0.3 },
    { x: 176, y: 0,   w: 10, h: 40,  color: 0x3a3845, alpha: 0.3 },

    // Floor tile accent
    { x: 80,  y: 206, w: 96, h: 4,   color: 0x585668, alpha: 0.5 },
  ],

};

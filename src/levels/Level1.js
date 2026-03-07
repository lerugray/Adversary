/**
 * Level1.js — "The Ashen Hearth" level data definition.
 *
 * Donkey Kong-style layout: wide platforms with alternating gaps,
 * rolling skull hazards cascade from a stone head at the top.
 * Player zigzags up via ladders on alternating sides.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.  Y increases downward.
 *   World size: 256 x 320.
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   +--------------------------------------------+
 *         |                                            |
 *   y=58  | [SKULL]============================  T5    |  gap RIGHT
 *         |                       [CHECKPOINT]         |
 *   y=105 |    =============================[L] T4     |  gap LEFT
 *         |                                            |
 *   y=152 | [L]=============================   T3      |  gap RIGHT
 *         |                                            |
 *   y=199 |    =============================[L] T2     |  gap LEFT
 *         |                                            |
 *   y=244 | [L]=============================   T1      |  gap RIGHT
 *         |                                            |
 *   y=280 | ========================================== |  GROUND (full)
 *   y=320 +--------------------------------------------+
 *
 *   [L] = ladder   [SKULL] = stone head spawner
 *   Hazards roll RIGHT on odd tiers, LEFT on even tiers, cascading down.
 *   Player climbs ladders on alternating sides (right, left, right...).
 */

const Level1Data = {

  name: 'The Ashen Hearth',
  worldWidth:  256,
  worldHeight: 350,

  // ── Player spawn ───────────────────────────────────────────────────────
  playerSpawn: { x: 28, y: 304 },

  // ── Checkpoint (bonfire near summit, right side past the stone head) ──
  checkpoint: {
    x: 200,
    y: 50,
    radius: 8,
  },

  // ── Hazard spawner (stone head) ──────────────────────────────────────
  hazardSpawner: {
    x: 16,               // stone head X (left side of tier 5)
    y: 58,               // stone head Y (sits on platform surface)
    speed: 52,            // horizontal roll speed (px/s)
    interval: 3500,       // ms between skull spawns
    initialDelay: 3000,   // ms before first skull
    initialDirection: 1,  // 1 = starts rolling RIGHT
    damage: 1,
  },

  // ── Platform tiers ───────────────────────────────────────────────────
  // Wide platforms with ~32px gaps on alternating sides.
  // Hazards roll across and fall through the gaps.
  // Extra vertical space between lower tiers for dodging arrows/skulls.
  platforms: [

    // Ground — full width
    { x: 0,   y: 310, w: 256, h: 40,  tier: 0 },

    // Tier 1 — gap on RIGHT (55px above ground)
    { x: 0,   y: 255, w: 224, h: 10,  tier: 1 },

    // Tier 2 — gap on LEFT (55px above tier 1)
    { x: 32,  y: 200, w: 224, h: 10,  tier: 2 },

    // Tier 3 — gap on RIGHT (50px above tier 2)
    { x: 0,   y: 150, w: 224, h: 10,  tier: 3 },

    // Tier 4 — gap on LEFT (50px above tier 3)
    { x: 32,  y: 100, w: 224, h: 10,  tier: 4 },

    // Tier 5 — summit, gap on RIGHT (42px above tier 4)
    { x: 0,   y: 58,  w: 224, h: 10,  tier: 5 },

  ],

  // ── Ladder zones ─────────────────────────────────────────────────────
  // Zigzag pattern: right, left, right, left, right
  ladders: [
    // Ground → Tier 1 (right side)
    { x: 210, topY: 255, bottomY: 310, w: 14 },

    // Tier 1 → Tier 2 (left side)
    { x: 42,  topY: 200, bottomY: 255, w: 14 },

    // Tier 2 → Tier 3 (right side)
    { x: 210, topY: 150, bottomY: 200, w: 14 },

    // Tier 3 → Tier 4 (left side)
    { x: 42,  topY: 100, bottomY: 150, w: 14 },

    // Tier 4 → Tier 5 (right side)
    { x: 210, topY: 58,  bottomY: 100, w: 14 },
  ],

  // ── Enemy spawn markers ──────────────────────────────────────────────
  enemySpawns: [
    { x: 130, y: 302, type: 'hollow_soldier' },   // Ground — mid patrol
    { x: 120, y: 247, type: 'hollow_soldier' },   // Tier 1 — mid patrol
    { x: 180, y: 192, type: 'hollow_archer'  },   // Tier 2 — guards right ladder
    { x: 100, y: 142, type: 'hollow_soldier' },   // Tier 3 — mid patrol
    { x: 160, y: 92,  type: 'hollow_knight'  },   // Tier 4 — tough guard
    { x: 130, y: 50,  type: 'hollow_knight'  },   // Tier 5 — guards checkpoint
  ],

  // ── Decorative elements ──────────────────────────────────────────────
  decorations: [
    // Ruined pillar stumps along the edges
    { x: 232, y: 270, w: 12, h: 25, color: 0x2a2028, alpha: 0.9 },
    { x: 4,   y: 215, w: 10, h: 20, color: 0x2a2028, alpha: 0.8 },
    { x: 232, y: 160, w: 12, h: 20, color: 0x2a2028, alpha: 0.9 },
    { x: 4,   y: 112, w: 10, h: 18, color: 0x2a2028, alpha: 0.8 },

    // Crumbled rubble at base of stone head
    { x: 6,   y: 50,  w: 20, h: 5,  color: 0x3a3530, alpha: 0.7 },

    // Distant ruin silhouettes (background)
    { x: 140, y: 0,   w: 16, h: 50, color: 0x1a1518, alpha: 0.5 },
    { x: 200, y: 0,   w: 12, h: 40, color: 0x1a1518, alpha: 0.4 },
    { x: 240, y: 0,   w: 8,  h: 55, color: 0x1a1518, alpha: 0.35 },
  ],

};

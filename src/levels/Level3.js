/**
 * Level3.js — "The Iron Passage" level data definition.
 *
 * Theme: Sen's Fortress — iron architecture, pendulum blades, dart traps,
 * narrow walkways. The trap gauntlet level. Fewer regular enemies,
 * more environmental hazards that demand precise timing.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.  Y increases downward.
 *   World size: 256 × 570.
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   ┌──────────────────────────────────────────┐
 *         │           (visual breathing room)         │
 *   y=70  │  [IRON GATE CHECKPOINT]                   │
 *         │  ██████████████  Tier 7 (summit)          │
 *   y=130 │     ████████████████                      │
 *         │      Tier 6 — pendulum + dart trap        │
 *   y=190 │  ██████████████████████                   │
 *         │      Tier 5 — "The Gauntlet" wide combat  │
 *   y=250 │     █████  ███  █████                     │
 *         │      Tier 4 — triple island + pendulum    │
 *   y=310 │  ██████████████████████████████           │
 *         │      Tier 3 — dart crossfire corridor     │
 *   y=370 │  ████████  ████████  ██████████           │
 *         │      Tier 2 — pendulum bridge             │
 *   y=430 │  ██████████████████████████████           │
 *         │      Tier 1 — intro (darts only)          │
 *   y=490 │  ████████████████████████████████████████ │
 *         │                  GROUND                   │
 *   y=570 └──────────────────────────────────────────┘
 *
 *   Ladder zigzag: right → left → right → left → right → left → right
 */

const Level3Data = {
  name: 'The Iron Passage',

  // ── World dimensions ───────────────────────────────────────────────────
  worldWidth:  256,
  worldHeight: 570,

  // ── Player spawn ───────────────────────────────────────────────────────
  playerSpawn: { x: 28, y: 484 },

  // ── Checkpoint (heavy iron gate at summit) ─────────────────────────────
  checkpoint: {
    x: 36,
    y: 62,
    radius: 8,
    type: 'iron_gate',
  },

  // ── Platform tiers (60px gaps for jump headroom) ──────────────────────
  platforms: [

    // Tier 0 — Ground (full width iron floor)
    { x: 0,   y: 490, w: 256, h: 80,  tier: 0 },

    // Tier 1 — "First Test": long platform, dart trap fires across it
    { x: 0,   y: 430, w: 230, h: 10,  tier: 1 },

    // Tier 2 — "Pendulum Bridge": three sections separated by pendulums
    { x: 0,   y: 370, w: 70,  h: 10,  tier: 2 },   // left safe zone
    { x: 82,  y: 370, w: 70,  h: 10,  tier: 2 },   // middle (under pendulum)
    { x: 164, y: 370, w: 92,  h: 10,  tier: 2 },   // right (ladder up)

    // Tier 3 — "Dart Corridor": long platform, darts from both walls
    { x: 0,   y: 310, w: 240, h: 10,  tier: 3 },

    // Tier 4 — "Blade Walk": three islands, pendulum guards the middle
    { x: 0,   y: 250, w: 60,  h: 10,  tier: 4 },   // left island (wider for approach jump)
    { x: 72,  y: 250, w: 50,  h: 10,  tier: 4 },   // center island (under pendulum)
    { x: 140, y: 250, w: 60,  h: 10,  tier: 4 },   // right island

    // Tier 5 — "The Gauntlet": wide platform, enemy + dart traps
    { x: 0,   y: 190, w: 200, h: 10,  tier: 5 },
    { x: 216, y: 190, w: 40,  h: 10,  tier: 5 },   // small side platform

    // Tier 6 — "Death's Crossing": narrow bridge, pendulum + darts
    { x: 40,  y: 130, w: 180, h: 10,  tier: 6 },

    // Tier 7 — Summit platform (iron gate checkpoint, full width so ladder exit is reachable)
    { x: 0,   y: 70,  w: 256, h: 10,  tier: 7 },

  ],

  // ── Ladder zones ───────────────────────────────────────────────────────
  ladders: [
    // Ground → Tier 1 (right side)
    { x: 215, topY: 430, bottomY: 490, w: 14 },

    // Tier 1 → Tier 2 (left side)
    { x: 14,  topY: 370, bottomY: 430, w: 14 },

    // Tier 2 → Tier 3 (right side)
    { x: 228, topY: 310, bottomY: 370, w: 14 },

    // Tier 3 → Tier 4 (left side)
    { x: 14,  topY: 250, bottomY: 310, w: 14 },

    // Tier 4 → Tier 5 (right side)
    { x: 180, topY: 190, bottomY: 250, w: 14 },

    // Tier 5 → Tier 6 (left side)
    { x: 55,  topY: 130, bottomY: 190, w: 14 },

    // Tier 6 → Tier 7 summit (right side)
    { x: 200, topY: 70,  bottomY: 130, w: 14 },
  ],

  // ── Traps (Sen's Fortress!) ───────────────────────────────────────────
  traps: {
    pendulums: [
      // Tier 2 — pendulum between left and middle platforms
      { anchorX: 76,  anchorY: 330, length: 34, speed: 1.1, damage: 1, startAngle: 0 },

      // Tier 2 — pendulum between middle and right platforms
      { anchorX: 158, anchorY: 330, length: 34, speed: 1.0, damage: 1, startAngle: 1.5 },

      // Tier 4 — pendulum over center island (readable window to run through)
      { anchorX: 97,  anchorY: 212, length: 32, speed: 1.2, damage: 2, startAngle: 0.8 },

      // Tier 6 — pendulum on the narrow bridge
      { anchorX: 130, anchorY: 92,  length: 32, speed: 1.4, damage: 2, startAngle: 0 },
    ],

    dartTraps: [
      // Tier 1 — intro dart from right wall
      { x: 250, y: 423, direction: -1, interval: 3200, speed: 100, damage: 1 },

      // Tier 3 — crossfire! Darts from both sides (staggered so there's a gap)
      { x: 6,   y: 303, direction: 1,  interval: 3200, speed: 110, damage: 1 },
      { x: 250, y: 303, direction: -1, interval: 3200, speed: 110, damage: 1 },

      // Tier 5 — dart from left wall into the gauntlet
      { x: 6,   y: 183, direction: 1,  interval: 2800, speed: 120, damage: 1 },

      // Tier 6 — dart from right wall across the bridge (timed with pendulum)
      { x: 250, y: 123, direction: -1, interval: 2900, speed: 130, damage: 1 },

      // Tier 7 — summit crossfire, last gauntlet before checkpoint (staggered)
      { x: 250, y: 63,  direction: -1, interval: 2800, speed: 110, damage: 1 },
      { x: 6,   y: 63,  direction: 1,  interval: 2800, speed: 110, damage: 1 },
    ],
  },

  // ── Enemy spawn markers (fewer than other levels — traps are the threat) ─
  enemySpawns: [
    // Ground — soldier patrol (warmup)
    { x: 130, y: 482, type: 'hollow_soldier' },

    // Tier 1 — skeleton at end of dart corridor
    { x: 60,  y: 422, type: 'skeleton' },

    // Tier 3 — soldier patrols the dart crossfire corridor
    { x: 120, y: 302, type: 'hollow_soldier' },

    // Tier 5 — knight guards the gauntlet
    { x: 100, y: 182, type: 'hollow_knight' },

    // Tier 6 — archer on the bridge (shoot while dodging pendulum!)
    { x: 180, y: 122, type: 'hollow_archer' },

    // Near summit — gargoyle in open air
    { x: 80,  y: 90,  type: 'gargoyle', patrolLeft: 30, patrolRight: 200, patrolY: 90 },

    // Tier 7 — skeleton guards the summit walk to the checkpoint
    { x: 130, y: 62,  type: 'skeleton' },
  ],

  // ── Destructible containers (off the beaten path) ─────────────────────
  breakables: [
    // Tier 2 far right — reward for jumping past the second pendulum
    { x: 245, y: 370, type: 'crate' },

    // Tier 5 side platform — have to jump across to get it
    { x: 232, y: 190, type: 'barrel' },
  ],

  // ── Decorative elements ────────────────────────────────────────────────
  decorations: [
    // Iron girder silhouettes — background
    { x: 0,   y: 0,   w: 14, h: 150, color: 0x2a2018, alpha: 0.5 },
    { x: 244, y: 0,   w: 12, h: 160, color: 0x2a2018, alpha: 0.5 },

    // Riveted wall panels
    { x: 0,   y: 280, w: 6,  h: 40,  color: 0x3a3028, alpha: 0.85 },
    { x: 250, y: 210, w: 6,  h: 40,  color: 0x3a3028, alpha: 0.85 },

    // Rust streaks
    { x: 95,  y: 380, w: 18, h: 5,   color: 0x4a3c30, alpha: 0.7 },
    { x: 200, y: 320, w: 15, h: 5,   color: 0x4a3c30, alpha: 0.65 },
    { x: 30,  y: 200, w: 20, h: 5,   color: 0x4a3c30, alpha: 0.6 },

    // Broken iron beam fragments
    { x: 70,  y: 160, w: 22, h: 4,   color: 0x3a3028, alpha: 0.8 },

    // Distant iron tower silhouettes
    { x: 160, y: 0,   w: 12, h: 60,  color: 0x2a2018, alpha: 0.35 },
    { x: 120, y: 0,   w: 8,  h: 45,  color: 0x2a2018, alpha: 0.3  },

    // Heavy gate frame at summit
    { x: 120, y: 62,  w: 6,  h: 18,  color: 0x3a3028, alpha: 0.9 },
    { x: 0,   y: 62,  w: 6,  h: 18,  color: 0x3a3028, alpha: 0.9 },
  ],

};

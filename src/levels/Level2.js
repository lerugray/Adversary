/**
 * Level2.js — "Cresthollow" level data definition.
 *
 * Theme: Winding ruined city, crumbling towers, narrow ledges.
 * Each tier presents a distinct challenge as the player climbs.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.  Y increases downward.
 *   World size: 256 x 460.
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   +--------------------------------------------+
 *   y=50  |  [GATE CHECKPOINT]                          |
 *         |  ================  Tier 6 (summit)          |
 *   y=110 |  ====================                       |
 *         |         Tier 5 — "Knight's Watch"           |
 *   y=170 |  ==============  ============               |
 *         |    Tier 4 — "The Gauntlet" (archer+soldier) |
 *   y=230 |  =============  ===============  ====       |
 *         |    Tier 3 — "Archer's Alley" (crossfire)    |
 *   y=290 |  ===========  =========  ==========        |
 *         |    Tier 2 — "Broken Bridge" (island hops)   |
 *   y=350 |  ============================               |
 *         |    Tier 1 — "Soldier's Walk" (long ledge)   |
 *   y=410 |  ==========================================  |
 *         |                  GROUND                     |
 *   y=460 +--------------------------------------------+
 *
 *   Ladder zigzag: right → left → right → left → right → left
 *   Every tier forces full traversal (arrive one side, exit the other)
 */

const Level2Data = {
  name: 'Cresthollow',

  // ── World dimensions ───────────────────────────────────────────────────
  worldWidth:  256,
  worldHeight: 460,

  // ── Player spawn ───────────────────────────────────────────────────────
  playerSpawn: { x: 28, y: 404 },

  // ── Checkpoint (ruined tower gate at summit) ──────────────────────────
  checkpoint: {
    x: 36,
    y: 38,
    radius: 8,
    type: 'gate',
  },

  // ── Platform tiers (60px gaps) ────────────────────────────────────────
  platforms: [

    // Tier 0 — Ground (full width)
    { x: 0,   y: 410, w: 256, h: 50,  tier: 0 },

    // Tier 1 — "Soldier's Walk": one long platform, pure combat
    { x: 0,   y: 350, w: 240, h: 10,  tier: 1 },

    // Tier 2 — "Broken Bridge": three islands with real gaps (jump challenge)
    { x: 165, y: 290, w: 65,  h: 10,  tier: 2 },   // right island (arrive here)
    { x: 85,  y: 290, w: 55,  h: 10,  tier: 2 },   // middle island (skeleton)
    { x: 0,   y: 290, w: 65,  h: 10,  tier: 2 },   // left island (ladder departs)

    // Tier 3 — "Archer's Alley": cross a gap under arrow crossfire
    { x: 0,   y: 230, w: 90,  h: 10,  tier: 3 },   // left safe zone
    { x: 112, y: 230, w: 100, h: 10,  tier: 3 },   // right zone (archer territory)
    { x: 218, y: 222, w: 38,  h: 10,  tier: 3 },   // elevated sniper perch

    // Tier 4 — "The Gauntlet": archer + soldier combo on two platforms
    { x: 125, y: 170, w: 80,  h: 10,  tier: 4 },   // right (arrive here)
    { x: 0,   y: 170, w: 100, h: 10,  tier: 4 },   // left (fight to ladder)

    // Tier 5 — "Knight's Watch": single platform, tough guard
    { x: 0,   y: 110, w: 200, h: 10,  tier: 5 },

    // Tier 6 — Summit platform (gate checkpoint here)
    { x: 0,   y: 50,  w: 110, h: 10,  tier: 6 },

  ],

  // ── Ladder zones ───────────────────────────────────────────────────────
  // Rule: arrive on one side, exit on the opposite — forces full traversal.
  ladders: [
    // Ladder A: Ground → Tier 1 RIGHT (forces walking right through ground enemies)
    { x: 230, topY: 350, bottomY: 410, w: 14 },

    // Ladder B: Tier 1 LEFT → Tier 2 left island (walk left past soldier)
    { x: 14,  topY: 290, bottomY: 350, w: 14 },

    // Ladder C: Tier 2 right island → Tier 3 right (jump right across islands)
    { x: 195, topY: 230, bottomY: 290, w: 14 },

    // Ladder D: Tier 3 left → Tier 4 left (cross left through archer fire)
    { x: 25,  topY: 170, bottomY: 230, w: 14 },

    // Ladder E: Tier 4 right → Tier 5 right (fight right through gauntlet)
    { x: 180, topY: 110, bottomY: 170, w: 14 },

    // Ladder F: Tier 5 LEFT → Summit (fight left past knight)
    { x: 25,  topY: 50,  bottomY: 110, w: 14 },
  ],

  // ── Enemy spawn markers ────────────────────────────────────────────────
  enemySpawns: [
    // Ground — two patrols (warmup)
    { x: 170, y: 402, type: 'hollow_soldier' },
    { x: 130, y: 402, type: 'skeleton' },

    // Tier 1 — soldier patrols the long ledge
    { x: 130, y: 342, type: 'hollow_soldier' },

    // Tier 2 — skeleton on the middle island
    { x: 110, y: 282, type: 'skeleton' },

    // Tier 3 — archer on right platform + sniper on elevated perch (crossfire)
    { x: 150, y: 222, type: 'hollow_archer' },
    { x: 232, y: 214, type: 'hollow_archer' },

    // Tier 4 — archer on left platform, soldier on right (must fight through both)
    { x: 40,  y: 162, type: 'hollow_archer' },
    { x: 165, y: 162, type: 'hollow_soldier' },

    // Tier 5 — knight guards the final approach
    { x: 100, y: 102, type: 'hollow_knight' },
  ],

  // ── Flying hazards (DK-style bats on a timer) ─────────────────────────
  flyingHazard: {
    interval: 6000,         // ms between bat spawns
    speed: 65,              // px/s horizontal
    damage: 1,
    yOffset: [-30, 10],     // spawn near player height, biased slightly above
  },

  // ── Destructible containers (off the beaten path) ─────────────────────
  breakables: [
    // Ground far left — player heads right to the ladder, this rewards exploring left
    { x: 16,  y: 410, type: 'barrel' },

    // Tier 1 far right — past the end of the platform, player has to go right
    { x: 225, y: 350, type: 'crate' },

    // Tier 3 elevated sniper perch — reward for clearing the archers
    { x: 240, y: 222, type: 'crate',
      drops: [
        { type: 'heart',   chance: 0.50 },
        { type: 'weapon',  chance: 0.15 },
        { type: 'special', chance: 0.12 },
      ]
    },
  ],

  // ── Decorative elements ────────────────────────────────────────────────
  decorations: [
    // Crumbling tower silhouette — left background
    { x: 0,   y: 0,   w: 18, h: 90,  color: 0x1a2030, alpha: 0.5 },
    { x: 20,  y: 0,   w: 10, h: 65,  color: 0x1a2030, alpha: 0.4 },

    // Ruined wall fragment — right side
    { x: 240, y: 0,   w: 16, h: 100, color: 0x242838, alpha: 0.5 },

    // Broken pillar — between tiers 1 & 2
    { x: 210, y: 310, w: 12, h: 28, color: 0x2a3040, alpha: 0.85 },
    { x: 210, y: 305, w: 8,  h: 6,  color: 0x2a3040, alpha: 0.7  },

    // Collapsed archway fragments — tier 3 area
    { x: 95,  y: 218, w: 15, h: 6,  color: 0x242838, alpha: 0.75 },

    // Tower window — upper area
    { x: 170, y: 125, w: 14, h: 8,  color: 0x1a2030, alpha: 0.6 },

    // Rubble at summit gate base
    { x: 110, y: 44,  w: 25, h: 5,  color: 0x2a3040, alpha: 0.8 },

    // Distant city silhouette
    { x: 180, y: 0,   w: 14, h: 70, color: 0x1a2030, alpha: 0.35 },
    { x: 150, y: 0,   w: 10, h: 60, color: 0x1a2030, alpha: 0.3  },
  ],

};

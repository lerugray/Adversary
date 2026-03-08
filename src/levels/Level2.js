/**
 * Level2.js — "Crestfall" level data definition.
 *
 * Theme: Winding ruined city, crumbling towers, narrow ledges.
 * More vertical than Level 1. Archers placed on elevated ledges
 * overlooking the climb path.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.  Y increases downward.
 *   World size: 256 x 460.
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   +--------------------------------------------+
 *         |              BACKGROUND                     |
 *   y=40  |  [GATE CHECKPOINT]                          |
 *         |  ================  Tier 6 (summit)          |
 *   y=100 |          ============                       |
 *         |                        Tier 5               |
 *   y=150 |  =========                                  |
 *         |            ============  Tier 4             |
 *   y=200 |  ========                                   |
 *         |                  ==========  Tier 3         |
 *   y=250 |  ================                           |
 *         |                      ======  Tier 2         |
 *   y=300 |  ============                               |
 *         |                ============  Tier 1         |
 *   y=350 |  ==========================  GROUND         |
 *   y=400 +--------------------------------------------+
 *
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

    // Tier 0 — Ground
    { x: 0,   y: 410, w: 256, h: 50,  tier: 0 },

    // Tier 1 — Narrow city ledges (with stepping stones for short jump)
    { x: 0,   y: 350, w: 70,  h: 10,  tier: 1 },
    { x: 82,  y: 348, w: 20,  h: 8,   tier: 1 },  // stepping stone
    { x: 110, y: 345, w: 20,  h: 8,   tier: 1 },  // stepping stone
    { x: 138, y: 343, w: 80,  h: 10,  tier: 1 },
    { x: 220, y: 355, w: 36,  h: 10,  tier: 1 },

    // Tier 2 — Crumbling tower floors (with stepping stone)
    { x: 0,   y: 290, w: 100, h: 10,  tier: 2 },
    { x: 118, y: 288, w: 20,  h: 8,   tier: 2 },  // stepping stone
    { x: 148, y: 286, w: 20,  h: 8,   tier: 2 },  // stepping stone
    { x: 176, y: 285, w: 50,  h: 10,  tier: 2 },

    // Tier 3 — Archer perch section (with stepping stones)
    { x: 0,   y: 230, w: 55,  h: 10,  tier: 3 },
    { x: 67,  y: 229, w: 20,  h: 8,   tier: 3 },  // stepping stone
    { x: 95,  y: 228, w: 20,  h: 8,   tier: 3 },  // stepping stone
    { x: 118, y: 227, w: 70,  h: 10,  tier: 3 },
    { x: 210, y: 232, w: 46,  h: 10,  tier: 3 },

    // Tier 4 — Collapsed stairway (with stepping stone)
    { x: 0,   y: 170, w: 60,  h: 10,  tier: 4 },
    { x: 72,  y: 169, w: 20,  h: 8,   tier: 4 },  // stepping stone
    { x: 100, y: 167, w: 80,  h: 10,  tier: 4 },

    // Tier 5 — Upper tower remnants
    { x: 80,  y: 110, w: 90,  h: 10,  tier: 5 },
    { x: 200, y: 114, w: 56,  h: 10,  tier: 5 },

    // Tier 6 — Summit platform (gate checkpoint here)
    { x: 0,   y: 50,  w: 110, h: 10,  tier: 6 },

  ],

  // ── Ladder zones ───────────────────────────────────────────────────────
  ladders: [
    // Ladder A: Ground → Tier 1 left
    { x: 14,  topY: 350, bottomY: 410, w: 14 },

    // Ladder B: Tier 1 right → Tier 2 right
    { x: 195, topY: 285, bottomY: 355, w: 14 },

    // Ladder C: Tier 2 left → Tier 3 left
    { x: 30,  topY: 230, bottomY: 300, w: 14 },

    // Ladder D: Tier 3 mid → Tier 4 mid (forces passing archers)
    { x: 145, topY: 167, bottomY: 237, w: 14 },

    // Ladder E: Tier 4 left → Tier 5
    { x: 90,  topY: 110, bottomY: 180, w: 14 },

    // Ladder F: Tier 5 → Tier 6 summit
    { x: 95,  topY: 50,  bottomY: 120, w: 14 },
  ],

  // ── Enemy spawn markers ────────────────────────────────────────────────
  enemySpawns: [
    // Ground patrol — spaced from player spawn (x:28)
    { x: 170, y: 402, type: 'hollow_soldier' },
    { x: 130, y: 402, type: 'skeleton' },

    // Tier 1 — soldier guards narrow ledge
    { x: 155, y: 335, type: 'hollow_soldier' },

    // Tier 2 — skeleton on left platform
    { x: 60,  y: 282, type: 'skeleton' },

    // Tier 3 — Two archers on elevated ledges with sightlines down the climb
    { x: 130, y: 219, type: 'hollow_archer' },
    { x: 225, y: 224, type: 'hollow_archer' },

    // Tier 4 — archer + soldier gauntlet (must pass 2 archers before next ladder)
    { x: 30,  y: 162, type: 'hollow_archer' },
    { x: 140, y: 159, type: 'hollow_soldier' },

    // Tier 5 — knight guards the final approach
    { x: 130, y: 102, type: 'hollow_knight' },
  ],

  // ── Decorative elements ────────────────────────────────────────────────
  decorations: [
    // Crumbling tower silhouette — left background
    { x: 0,   y: 0,   w: 18, h: 90,  color: 0x1a2030, alpha: 0.5 },
    { x: 20,  y: 0,   w: 10, h: 65,  color: 0x1a2030, alpha: 0.4 },

    // Ruined wall fragment — right side
    { x: 240, y: 0,   w: 16, h: 100, color: 0x242838, alpha: 0.5 },

    // Broken pillar — between tiers 1 & 2
    { x: 100, y: 300, w: 12, h: 28, color: 0x2a3040, alpha: 0.85 },
    { x: 100, y: 295, w: 8,  h: 6,  color: 0x2a3040, alpha: 0.7  },

    // Collapsed archway fragments — tier 3 area
    { x: 70,  y: 217, w: 25, h: 6,  color: 0x242838, alpha: 0.75 },
    { x: 90,  y: 212, w: 10, h: 10, color: 0x242838, alpha: 0.6  },

    // Tower window — upper area
    { x: 50,  y: 125, w: 14, h: 8,  color: 0x1a2030, alpha: 0.6 },

    // Rubble at summit gate base
    { x: 110, y: 44,  w: 25, h: 5,  color: 0x2a3040, alpha: 0.8 },

    // Distant city silhouette
    { x: 180, y: 0,   w: 14, h: 70, color: 0x1a2030, alpha: 0.35 },
    { x: 150, y: 0,   w: 10, h: 60, color: 0x1a2030, alpha: 0.3  },
  ],

};

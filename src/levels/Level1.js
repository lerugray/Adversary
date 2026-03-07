/**
 * Level1.js — "Firelink Shrine" level data definition.
 *
 * This file contains ONLY data — no Phaser calls.
 * GameScene reads from this object to build the level programmatically.
 *
 * Phase 8 note: To swap in a real Tiled JSON export, replace this data
 * object with a Tiled-compatible loader in GameScene._loadLevelData() and
 * point it at the JSON file. The Level 1 shape (platforms, ladders,
 * spawn points, checkpoint) should be authored identically in Tiled.
 *
 * Coordinate system:
 *   Origin (0,0) is top-left.
 *   Y increases downward.
 *   World size: 256 × 320 (slightly taller than the 240px screen viewport).
 *
 * ── World layout sketch ────────────────────────────────────────────────────
 *
 *   y=0   ┌──────────────────────────────────────────┐
 *         │              BACKGROUND                   │
 *   y=30  │  [BONFIRE CHECKPOINT]                     │
 *         │  ████████████  Tier 5 (summit)            │
 *   y=80  │         ████████████                      │
 *         │                    ████████  Tier 4       │
 *   y=130 │  ████████████                             │
 *         │              ████████       Tier 3        │
 *   y=185 │  ██████████████████████                   │
 *         │                          ████  Tier 2     │
 *   y=235 │  ████████████████                         │
 *         │                                           │
 *   y=280 │  ██████████████████████████  GROUND       │
 *   y=320 └──────────────────────────────────────────┘
 *
 */

const Level1Data = {

  // ── World dimensions ───────────────────────────────────────────────────
  name: 'The Ashen Hearth',
  worldWidth:  256,
  worldHeight: 320,

  // ── Player spawn ───────────────────────────────────────────────────────
  // Bottom-left area, positioned just above the ground surface.
  playerSpawn: { x: 28, y: 274 },   // y = groundY - playerHeight (≈ 6px clearance)

  // ── Checkpoint (bonfire at the summit) ─────────────────────────────────
  checkpoint: {
    x: 36,    // world X centre of the bonfire
    y: 28,    // world Y centre (sits on Tier 5 platform)
    radius: 8,
  },

  // ── Platform tiers ─────────────────────────────────────────────────────
  // Each entry: { x, y, w, h, tier }
  //   x, y = top-left corner in world space
  //   tier = 0 (ground) through 5 (summit) — used for comments / debugging
  //
  // Color is assigned by GameScene based on tier, not stored here.
  platforms: [

    // Tier 0 — Ground (full width, thick slab)
    { x: 0,   y: 280, w: 256, h: 40,  tier: 0 },

    // Tier 1 — Two stone ledges with stepping stones between
    { x: 0,   y: 240, w: 90,  h: 10,  tier: 1 },
    { x: 105, y: 242, w: 24,  h: 8,   tier: 1 },  // stepping stone 1
    { x: 140, y: 241, w: 24,  h: 8,   tier: 1 },  // stepping stone 2
    { x: 170, y: 240, w: 86,  h: 10,  tier: 1 },

    // Tier 2 — Crumbled mid-section; player must use ladders
    { x: 30,  y: 195, w: 110, h: 10,  tier: 2 },
    { x: 190, y: 200, w: 66,  h: 10,  tier: 2 },

    // Tier 3 — Broken arch remnants with stepping stones
    { x: 0,   y: 155, w: 80,  h: 10,  tier: 3 },
    { x: 86,  y: 153, w: 20,  h: 8,   tier: 3 },  // stepping stone 1
    { x: 112, y: 150, w: 20,  h: 8,   tier: 3 },  // stepping stone 2
    { x: 138, y: 148, w: 82,  h: 10,  tier: 3 },

    // Tier 4 — Elevated ruins
    { x: 60,  y: 105, w: 130, h: 10,  tier: 4 },

    // Tier 5 — Summit platform; checkpoint lives here
    { x: 0,   y: 58,  w: 100, h: 10,  tier: 5 },

  ],

  // ── Ladder zones ───────────────────────────────────────────────────────
  // Each entry defines a climbable column.
  //   x      = horizontal centre of the ladder visual column
  //   topY   = top of climbable zone (world Y)
  //   bottomY= bottom of climbable zone (world Y, typically = platform below + h)
  //   w      = overlap detection width (player must be within this to grab)
  //
  // Phase 4: enemies will query scene.ladderZones to pathfind vertically.
  ladders: [
    // Ladder A: Ground → Tier 1 left (left edge of level)
    { x: 12,  topY: 240, bottomY: 280, w: 14 },

    // Ladder B: Tier 1 left → Tier 2 left
    { x: 50,  topY: 195, bottomY: 250, w: 14 },

    // Ladder C: Tier 2 left → Tier 3 left
    { x: 18,  topY: 155, bottomY: 205, w: 14 },

    // Ladder D: Tier 3 right → Tier 4
    { x: 188, topY: 105, bottomY: 158, w: 14 },

    // Ladder E: Tier 4 → Tier 5 (summit)
    { x: 80,  topY: 58,  bottomY: 115, w: 14 },
  ],

  // ── Enemy spawn markers ────────────────────────────────────────────────
  // Phase 4 will read this array to instantiate enemies.
  // DO NOT remove — even though nothing is spawned yet.
  //   x, y  = world-space spawn position (feet of enemy)
  //   type  = enemy class hint for Phase 4 (string)
  enemySpawns: [
    { x: 180, y: 272, type: 'hollow_soldier' },   // Ground right area
    { x: 60,  y: 232, type: 'hollow_soldier' },   // Tier 1 left ledge
    { x: 200, y: 232, type: 'hollow_archer'  },   // Tier 1 right ledge
    { x: 90,  y: 187, type: 'hollow_soldier' },   // Tier 2 mid
    { x: 160, y: 140, type: 'hollow_knight'  },   // Tier 3 right mid (ladder D is at x:188)
    { x: 120, y: 97,  type: 'hollow_knight'  },   // Tier 4 center (ladders at x:80 and x:188)
  ],

  // ── Decorative elements ────────────────────────────────────────────────
  // Pure visuals — no collision. Suggest ruined architecture.
  // { x, y, w, h, color, alpha }
  decorations: [
    // Broken pillar stump — left edge, between tiers 1 & 2
    { x: 2,   y: 215, w: 14, h: 25, color: 0x2a2028, alpha: 0.9 },
    // Broken pillar top — floating ruin fragment
    { x: 2,   y: 200, w: 10, h: 8,  color: 0x332830, alpha: 0.8 },

    // Right-side pillar pair — between ground and tier 1
    { x: 230, y: 252, w: 12, h: 28, color: 0x2a2028, alpha: 0.9 },
    { x: 218, y: 252, w: 8,  h: 20, color: 0x2a2028, alpha: 0.7 },

    // Crumbled arch fragments — tier 3 area
    { x: 88,  y: 138, w: 20, h: 6,  color: 0x302530, alpha: 0.75 },
    { x: 106, y: 132, w: 10, h: 12, color: 0x302530, alpha: 0.6  },

    // Rubble pile at the base of summit platform
    { x: 100, y: 50,  w: 30, h: 6,  color: 0x2e2a2c, alpha: 0.85 },

    // Distant ruin silhouette — back-left
    { x: 140, y: 0,   w: 16, h: 50, color: 0x1a1518, alpha: 0.5  },
    { x: 200, y: 0,   w: 12, h: 40, color: 0x1a1518, alpha: 0.4  },
  ],

};

/**
 * Level3.js - "The Iron Passage".
 *
 * One idea: read fixed trap timing. No regular enemies; the level itself is the threat.
 * Palette: rust over gunmetal, with the iron fog gate as the visual goal.
 */
const Level3Data = {
  name: 'The Iron Passage',
  worldWidth: 256,
  worldHeight: 240,
  backgroundColor: '#000000',

  platformPalette: [
    0x503000,
    0x884000,
    0xcc6800,
    0xbcbcbc,
  ],

  playerSpawn: { x: 24, y: 224 },

  checkpoint: {
    x: 128,
    y: 40,
    radius: 8,
    type: 'iron_gate',
    assetKey: 'oryx_gate_iron',
  },

  platforms: [
    // Platform at (0, 224): traversal - start line and ladder access.
    { x: 0,   y: 224, w: 256, h: 16, tier: 0, color: 0x503000, highlightColor: 0xcc6800 },
    // Platform at (0, 200): traversal - lower-left timing entry.
    { x: 0,   y: 200, w: 72,  h: 8,  tier: 1, color: 0x884000, highlightColor: 0xcc6800 },
    // Platform at (96, 200): hazard-dodge - middle island after first blade.
    { x: 96,  y: 200, w: 56,  h: 8,  tier: 1, color: 0x884000, highlightColor: 0xcc6800 },
    // Platform at (184, 176): traversal - elevator landing.
    { x: 184, y: 176, w: 56,  h: 8,  tier: 1, color: 0x884000, highlightColor: 0xcc6800 },
    // Platform at (0, 144): rest - left mid ledge before crossing back.
    { x: 0,   y: 144, w: 72,  h: 8,  tier: 2, color: 0x884000, highlightColor: 0xcc6800 },
    // Platform at (128, 104): hazard-dodge - second pendulum timing ledge.
    { x: 128, y: 104, w: 96,  h: 8,  tier: 2, color: 0x884000, highlightColor: 0xcc6800 },
    // Platform at (48, 48): rest - iron gate platform.
    { x: 48,  y: 48,  w: 160, h: 8,  tier: 3, color: 0xcc6800, highlightColor: 0xfcfcfc },
  ],

  ladders: [
    { x: 32,  topY: 200, bottomY: 224, w: 14 },
    { x: 48,  topY: 144, bottomY: 200, w: 14 },
    { x: 200, topY: 48,  bottomY: 104, w: 14 },
  ],

  elevators: [
    {
      x: 200,
      w: 28,
      h: 6,
      minY: 104,
      maxY: 208,
      speed: -28,
      count: 2,
      color: 0x884000,
      hlColor: 0xfcfcfc,
    },
  ],

  // TODO: Convert TrapSystem timers from milliseconds to frame-count timing.
  traps: {
    pendulums: [
      { anchorX: 128, anchorY: 56,  length: 40, speed: 1.1, damage: 1, startAngle: 0 },
      { anchorX: 176, anchorY: 152, length: 40, speed: 0.8, damage: 1, startAngle: 1.5 },
    ],
    dartTraps: [],
  },

  // TODO: Add a crushing gear hazard system; current engine only supports pendulums, darts, skulls, bats, and elevators.
  enemySpawns: [],

  breakables: [],

  decorations: [
    { x: 128, y: 24, w: 32, h: 16, color: 0xfcfcfc },
    { x: 80,  y: 128, w: 16, h: 16, color: 0xcc6800 },
    { x: 84,  y: 132, w: 8,  h: 8,  color: 0x503000 },
    { x: 4,   y: 0,   w: 12, h: 144, color: 0x747474 },
    { x: 240, y: 0,   w: 12, h: 176, color: 0x747474 },
    { x: 32,  y: 86,  w: 28, h: 4,   color: 0x503000 },
    { x: 192, y: 132, w: 28, h: 4,   color: 0x503000 },
  ],
};

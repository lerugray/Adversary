/**
 * Level3.js - "The Iron Passage".
 *
 * One idea: climb a quiet iron gauntlet and time two readable blades.
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
    // Platform at (0, 224): traversal - start line and first ladder.
    { x: 0,   y: 224, w: 256, h: 16, tier: 0, color: 0x503000, highlightColor: 0xcc6800 },
    // Platform at (16, 192): traversal - opening timing lane.
    { x: 16,  y: 192, w: 128, h: 8,  tier: 1, color: 0x884000, highlightColor: 0xcc6800 },
    // Platform at (104, 152): hazard-dodge - first pendulum crossing.
    { x: 104, y: 152, w: 120, h: 8,  tier: 1, color: 0x884000, highlightColor: 0xcc6800 },
    // Platform at (32, 112): rest - reset ledge between timed threats.
    { x: 32,  y: 112, w: 152, h: 8,  tier: 2, color: 0x884000, highlightColor: 0xcc6800 },
    // Platform at (112, 72): hazard-dodge - second pendulum approach.
    { x: 112, y: 72,  w: 112, h: 8,  tier: 2, color: 0xcc6800, highlightColor: 0xfcfcfc },
    // Platform at (64, 48): rest - iron gate platform.
    { x: 64,  y: 48,  w: 144, h: 8,  tier: 3, color: 0xcc6800, highlightColor: 0xfcfcfc },
  ],

  ladders: [
    { x: 64,  topY: 192, bottomY: 224, w: 14 },
    { x: 136, topY: 152, bottomY: 192, w: 14 },
    { x: 136, topY: 112, bottomY: 152, w: 14 },
    { x: 184, topY: 72,  bottomY: 112, w: 14 },
    { x: 128, topY: 48,  bottomY: 72,  w: 14 },
  ],

  // TODO: Convert TrapSystem timers from milliseconds to frame-count timing.
  traps: {
    pendulums: [
      { anchorX: 176, anchorY: 116, length: 28, speed: 0.85, damage: 1, startAngle: 0 },
      { anchorX: 152, anchorY: 36,  length: 28, speed: 1.05, damage: 1, startAngle: 1.5 },
    ],
    dartTraps: [],
  },

  // The middle ladder is the gear lesson: wait for the teeth to sleep, then climb.
  gearHazards: [
    {
      x: 136,
      y: 132,
      radius: 8,
      rotationRate: 4,
      damage: 1,
      crushingRhythm: { cycleFrames: 120, dangerFrames: 60, phaseFrames: 30 },
    },
  ],

  enemySpawns: [],

  breakables: [],

  decorations: [
    { x: 128, y: 24, w: 32, h: 16, color: 0xfcfcfc },
    { x: 4,   y: 0,   w: 12, h: 144, color: 0x747474 },
    { x: 240, y: 0,   w: 12, h: 176, color: 0x747474 },
    { x: 32,  y: 88,  w: 28, h: 4,   color: 0x503000 },
    { x: 192, y: 132, w: 28, h: 4,   color: 0x503000 },
  ],
};

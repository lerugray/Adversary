/**
 * Level1.js - "The Ashen Hearth".
 *
 * One idea: teach jump, climb, and dodge against a single rhythmic hazard.
 * Palette: warm amber over black, with the bonfire as the brightest point.
 */
const Level1Data = {
  name: 'The Ashen Hearth',
  worldWidth: 256,
  worldHeight: 240,
  backgroundColor: '#000000',

  platformPalette: [
    0x503000, // ground: brown-black
    0xb84000, // ledges: ember
    0xfca044, // upper stone: amber
    0xfccc9c, // shrine highlight
  ],

  playerSpawn: { x: 24, y: 224 },

  checkpoint: {
    x: 128,
    y: 40,
    radius: 8,
    assetKey: 'oryx_bonfire_1',
  },

  hazardSpawner: {
    x: 48,
    y: 48,
    speed: 48,
    interval: 2000,
    initialDelay: 1200,
    initialDirection: 1,
    damage: 1,
  },

  platforms: [
    // Platform at (0, 224): traversal - start line and safe runway.
    { x: 0,   y: 224, w: 256, h: 16, tier: 0, color: 0x503000, highlightColor: 0xfca044 },
    // Platform at (16, 208): traversal - first short hop out of spawn.
    { x: 16,  y: 208, w: 64,  h: 8,  tier: 1, color: 0x884000, highlightColor: 0xfca044 },
    // Platform at (48, 176): hazard-dodge - gap teaches a committed jump.
    { x: 48,  y: 176, w: 88,  h: 8,  tier: 1, color: 0x884000, highlightColor: 0xfca044 },
    // Platform at (160, 176): traversal - landing after the y=176 gap.
    { x: 160, y: 176, w: 72,  h: 8,  tier: 1, color: 0x884000, highlightColor: 0xfca044 },
    // Platform at (32, 128): rest - first higher ledge before the final climb.
    { x: 32,  y: 128, w: 80,  h: 8,  tier: 2, color: 0xb84000, highlightColor: 0xfccc9c },
    // Platform at (128, 96): traversal - right-side approach to shrine ladder.
    { x: 128, y: 96,  w: 96,  h: 8,  tier: 2, color: 0xb84000, highlightColor: 0xfccc9c },
    // Platform at (80, 48): rest - shrine platform and checkpoint goal.
    { x: 80,  y: 48,  w: 96,  h: 8,  tier: 3, color: 0xfca044, highlightColor: 0xfcfcfc },
  ],

  ladders: [
    { x: 48,  topY: 128, bottomY: 208, w: 14 },
    { x: 200, topY: 96,  bottomY: 176, w: 14 },
    { x: 128, topY: 48,  bottomY: 96,  w: 14 },
  ],

  enemySpawns: [
    { x: 96, y: 168, type: 'hollow_soldier' },
  ],

  breakables: [
    { x: 140, y: 176, type: 'barrel' },
  ],

  decorations: [
    { x: 128, y: 32, assetKey: 'oryx_bonfire_2', depth: 1 },
    { x: 24,  y: 204, assetKey: 'oryx_barrel', depth: 1 },
    { x: 36,  y: 116, w: 8,  h: 12, color: 0x503000 },
    { x: 188, y: 84,  w: 10, h: 12, color: 0x503000 },
    { x: 20,  y: 64,  w: 28, h: 5,  color: 0x884000 },
    { x: 216, y: 32,  w: 20, h: 32, color: 0x503000 },
    { x: 10,  y: 220, w: 18, h: 4,  color: 0x007800 },
  ],
};

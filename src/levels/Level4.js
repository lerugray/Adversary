/**
 * Level4.js - "The Pale Spire".
 *
 * One idea: stillness, then boss pattern recognition.
 * Palette: cold grey on indigo, with pale stained-glass accents.
 */
const Level4Data = {
  name: 'The Pale Spire',
  worldWidth: 256,
  worldHeight: 240,
  backgroundColor: '#241488',

  platformPalette: [
    0x747474,
    0xbcbcbc,
    0x3cbcfc,
    0xa4e4fc,
  ],

  playerSpawn: { x: 24, y: 202 },

  // TODO: Add a post-boss altar checkpoint/victory interaction; current boss flow advances directly after the Hollow King dies.
  checkpoint: null,

  bossThreshold: { x: 0, y: 230, w: 256 },
  bossSpawn: { x: 120, y: 198 },

  weakPoints: [
    { x: 24,  y: 200, radius: 6 },
    { x: 232, y: 200, radius: 6 },
    { x: 72,  y: 176, radius: 6 },
    { x: 184, y: 176, radius: 6 },
  ],

  platforms: [
    // Platform at (0, 208): traversal - flat cathedral arena floor.
    { x: 0, y: 208, w: 256, h: 32, tier: 0, color: 0xbcbcbc, highlightColor: 0xfcfcfc },
  ],

  ladders: [],
  enemySpawns: [],
  breakables: [],

  decorations: [
    { x: 32,  y: 0,   w: 10, h: 208, color: 0x000000 },
    { x: 214, y: 0,   w: 10, h: 208, color: 0x000000 },
    { x: 64,  y: 32,  w: 12, h: 176, color: 0x747474 },
    { x: 180, y: 32,  w: 12, h: 176, color: 0x747474 },
    { x: 104, y: 16,  w: 16, h: 56,  color: 0x3cbcfc },
    { x: 120, y: 16,  w: 16, h: 56,  color: 0xa4e4fc },
    { x: 136, y: 16,  w: 16, h: 56,  color: 0x3cbcfc },
    { x: 96,  y: 72,  w: 64, h: 4,   color: 0xfcfcfc },
    { x: 128, y: 184, w: 32, h: 8,   color: 0x3cbcfc },
    { x: 128, y: 196, w: 80, h: 4,   color: 0xa4e4fc },
  ],
};

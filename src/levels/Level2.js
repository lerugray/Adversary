/**
 * Level2.js - "Cresthollow".
 *
 * One idea: commit through a fog band while two unreachable archers control lanes.
 * Palette: cold grey and indigo, with the portcullis checkpoint at top-right.
 */
const Level2Data = {
  name: 'Cresthollow',
  worldWidth: 256,
  worldHeight: 240,
  backgroundColor: '#241488',

  platformPalette: [
    0x747474,
    0xbcbcbc,
    0x0058f8,
    0xfcfcfc,
  ],

  playerSpawn: { x: 24, y: 224 },

  checkpoint: {
    x: 200,
    y: 32,
    radius: 8,
    type: 'gate',
    assetKey: 'oryx_gate_iron',
  },

  platforms: [
    // Platform at (0, 224): traversal - start line and first ladder access.
    { x: 0,   y: 224, w: 256, h: 16, tier: 0, color: 0x747474, highlightColor: 0xbcbcbc },
    // Platform at (16, 184): rest - left lower tenement ledge.
    { x: 16,  y: 184, w: 72,  h: 8,  tier: 1, color: 0x747474, highlightColor: 0xfcfcfc },
    // Platform at (144, 184): traversal - right lower ledge under archer pressure.
    { x: 144, y: 184, w: 72,  h: 8,  tier: 1, color: 0x747474, highlightColor: 0xfcfcfc },
    // Platform at (96, 152): bait - short fog-side commitment point.
    { x: 96,  y: 152, w: 72,  h: 8,  tier: 2, color: 0xbcbcbc, highlightColor: 0xfcfcfc },
    // Platform at (16, 72): hazard-dodge - left archer perch, intentionally unreachable.
    { x: 16,  y: 72,  w: 48,  h: 8,  tier: 2, color: 0xbcbcbc, highlightColor: 0xfcfcfc },
    // Platform at (96, 72): traversal - roof path toward checkpoint.
    { x: 96,  y: 72,  w: 128, h: 8,  tier: 2, color: 0xbcbcbc, highlightColor: 0xfcfcfc },
    // Platform at (152, 40): rest - checkpoint roof.
    { x: 152, y: 40,  w: 88,  h: 8,  tier: 3, color: 0xbcbcbc, highlightColor: 0xfcfcfc },
  ],

  ladders: [
    { x: 48,  topY: 184, bottomY: 224, w: 14 },
    { x: 200, topY: 72,  bottomY: 184, w: 14 },
    { x: 200, topY: 40,  bottomY: 72,  w: 14 },
  ],

  enemySpawns: [
    { x: 48,  y: 64,  type: 'hollow_archer', invulnerable: true },
    { x: 216, y: 176, type: 'hollow_archer', invulnerable: true, canShootDown: true },
  ],

  flyingHazard: null,

  breakables: [
    { x: 84, y: 224, type: 'crate' },
  ],

  decorations: [
    { x: 0,   y: 112, w: 256, h: 16, color: 0x0058f8 },
    { x: 20,  y: 116, w: 4,   h: 2,  color: 0x000000 },
    { x: 52,  y: 122, w: 4,   h: 2,  color: 0x000000 },
    { x: 104, y: 116, w: 4,   h: 2,  color: 0x000000 },
    { x: 188, y: 123, w: 4,   h: 2,  color: 0x000000 },
    { x: 232, y: 118, w: 4,   h: 2,  color: 0x000000 },
    { x: 4,   y: 0,   w: 14,  h: 72, color: 0x000000 },
    { x: 236, y: 0,   w: 16,  h: 80, color: 0x000000 },
    { x: 112, y: 16,  w: 14,  h: 32, color: 0x747474 },
    { x: 70,  y: 48,  w: 16,  h: 10, color: 0x000000 },
  ],
};

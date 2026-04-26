/**
 * Level2.js - "Cresthollow".
 *
 * One idea: climb through a foggy ruined city while two archers pressure the route.
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
    x: 208,
    y: 40,
    radius: 8,
    type: 'gate',
    assetKey: 'oryx_gate_iron',
  },

  platforms: [
    // Platform at (0, 224): traversal - full start runway.
    { x: 0,   y: 224, w: 256, h: 16, tier: 0, color: 0x747474, highlightColor: 0xbcbcbc },
    // Platform at (24, 184): traversal - first safe ledge after the opening ladder.
    { x: 24,  y: 184, w: 120, h: 8,  tier: 1, color: 0x747474, highlightColor: 0xfcfcfc },
    // Platform at (128, 152): hazard-dodge - fog crossing under the lower archer.
    { x: 128, y: 152, w: 104, h: 8,  tier: 1, color: 0x747474, highlightColor: 0xfcfcfc },
    // Platform at (32, 112): rest - post-fog recovery ledge with enough overlap for ladders.
    { x: 32,  y: 112, w: 144, h: 8,  tier: 2, color: 0xbcbcbc, highlightColor: 0xfcfcfc },
    // Platform at (120, 72): hazard-dodge - upper archer approach.
    { x: 120, y: 72,  w: 120, h: 8,  tier: 2, color: 0xbcbcbc, highlightColor: 0xfcfcfc },
    // Platform at (160, 48): rest - checkpoint roof.
    { x: 160, y: 48,  w: 80,  h: 8,  tier: 3, color: 0xbcbcbc, highlightColor: 0xfcfcfc },
  ],

  ladders: [
    { x: 64,  topY: 184, bottomY: 224, w: 14 },
    { x: 136, topY: 152, bottomY: 184, w: 14 },
    { x: 136, topY: 112, bottomY: 152, w: 14 },
    { x: 168, topY: 72,  bottomY: 112, w: 14 },
    { x: 208, topY: 48,  bottomY: 72,  w: 14 },
  ],

  enemySpawns: [
    { x: 208, y: 144, type: 'hollow_archer', canShootDown: true },
    { x: 136, y: 64,  type: 'hollow_archer' },
  ],

  flyingHazard: null,

  breakables: [
    { x: 112, y: 184, type: 'crate' },
  ],

  decorations: [
    { x: 0,   y: 116, w: 256, h: 16, color: 0x0058f8 },
    { x: 20,  y: 120, w: 4,   h: 2,  color: 0x000000 },
    { x: 60,  y: 126, w: 4,   h: 2,  color: 0x000000 },
    { x: 112, y: 120, w: 4,   h: 2,  color: 0x000000 },
    { x: 188, y: 127, w: 4,   h: 2,  color: 0x000000 },
    { x: 232, y: 122, w: 4,   h: 2,  color: 0x000000 },
    { x: 4,   y: 0,   w: 14,  h: 96, color: 0x000000 },
    { x: 236, y: 0,   w: 16,  h: 80, color: 0x000000 },
    { x: 92,  y: 20,  w: 12,  h: 36, color: 0x747474 },
    { x: 152, y: 96,  w: 18,  h: 10, color: 0x000000 },
  ],
};

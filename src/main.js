/**
 * main.js — Phaser 3 configuration and game bootstrap.
 *
 * Native NES resolution: 256×240.
 * Scaled up to fill the browser window while maintaining aspect ratio
 * (pillarboxing / letterboxing handled by Phaser's FIT scale mode).
 *
 * Phase notes:
 *  - Physics: Arcade (lightweight, sufficient for a 2-D platformer).
 *  - Additional physics plugins (Matter, etc.) can be added later if needed.
 *  - Gamepad plugin is registered here so it's available globally.
 */

const GAME_WIDTH  = 256;
const GAME_HEIGHT = 240;

const config = {
  type: Phaser.AUTO,          // WebGL when available, Canvas fallback

  parent: 'game-container',   // render inside the wrapper div

  width:  GAME_WIDTH,
  height: GAME_HEIGHT,

  // ── Scaling ──────────────────────────────────────────────────────────────
  scale: {
    mode:            Phaser.Scale.FIT,          // maintain aspect ratio
    autoCenter:      Phaser.Scale.CENTER_BOTH,  // pillarbox / letterbox
    parent:          'game-container',
    width:           GAME_WIDTH,
    height:          GAME_HEIGHT,
    expandParent:    false,                     // don't resize parent div
  },

  // ── Rendering ────────────────────────────────────────────────────────────
  pixelArt: true,   // disables texture smoothing for crisp pixel art
  antialias: false,

  // ── Physics ──────────────────────────────────────────────────────────────
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },  // per-body gravity set in GameScene
      debug:   false,      // flip to true during development
    },
  },

  // ── Input plugins ────────────────────────────────────────────────────────
  input: {
    gamepad: true,  // initialise gamepad plugin for future controller support
  },

  // ── Background ───────────────────────────────────────────────────────────
  backgroundColor: '#000000',

  // ── Scene registration order matters: Boot → Preload → … ────────────────
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    GameScene,
    PauseScene,
    InterludeScene,
    LoopCompleteScene,
    GameOverScene,
    HighScoreScene,
  ],
};

// ── Bootstrap ─────────────────────────────────────────────────────────────
const game = new Phaser.Game(config);

// Expose globally so any scene/system can reference shared singletons.
// GameState is a plain JS object (not a Phaser plugin) — see GameState.js.
window.ADVERSARY = {
  game,
  GameState,
  SaveManager,
  // InputManager is instantiated per-scene (needs a scene reference), but
  // the class is globally accessible here.
  InputManager,
};

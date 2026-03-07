/**
 * PreloadScene.js — Asset loading scene.
 *
 * Phase 1: Loads a single placeholder 16×16 white-square spritesheet that
 *          confirms the asset pipeline is working end-to-end.
 *
 * Phase 8: Replace / extend the load calls in _loadSpritesheets(),
 *          _loadTilemaps(), and _loadAudio() with the real game assets.
 *          The progress bar and transition logic below will still apply.
 */

class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    this.cameras.main.setBackgroundColor('#16213e');
    _addSceneLabel(this, 'PRELOAD');

    // ── Progress bar ──────────────────────────────────────────────────────
    this._createProgressBar();

    this.load.on('progress', (value) => {
      this._progressBar.clear();
      this._progressBar.fillStyle(0xffffff, 1);
      this._progressBar.fillRect(28, 108, 200 * value, 8);
    });

    this.load.on('complete', () => {
      this._progressBar.destroy();
    });

    // ── Asset loads ───────────────────────────────────────────────────────
    this._loadPlaceholderAssets();

    // ── Phase 8: Real asset loads ─────────────────────────────────────────
    // this._loadSpritesheets();
    // this._loadTilemaps();
    // this._loadAudio();
    // this._loadUI();
  }

  create() {
    // Brief pause so the "PRELOAD" screen is visible, then go to Title.
    this.time.delayedCall(400, () => {
      this.scene.start('TitleScene');
    });
  }

  // ── Private ───────────────────────────────────────────────────────────────

  _createProgressBar() {
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    // Bar outline
    const outline = this.add.graphics();
    outline.lineStyle(2, 0xffffff, 1);
    outline.strokeRect(cx - 100, cy - 4, 200, 16);

    // Bar fill (updated in the 'progress' event above)
    this._progressBar = this.add.graphics();

    this.add.text(cx, cy + 20, 'LOADING...', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#aaaaaa',
    }).setOrigin(0.5, 0);
  }

  /**
   * Phase 1 placeholder: generates a tiny base64-encoded 16×16 white PNG
   * and loads it as a spritesheet.  This validates the full asset pipeline
   * (load → cache → texture) without needing any files on disk.
   */
  _loadPlaceholderAssets() {
    // Generate a 16x16 white placeholder texture directly (no file load needed).
    // This avoids data URI issues when running from file:// protocol.
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff);
    gfx.fillRect(0, 0, 16, 16);
    gfx.generateTexture('placeholder', 16, 16);
    gfx.destroy();

    // ── Phase 8: Replace the block above with real spritesheets ───────────
    // Example (paths relative to index.html):
    //
    // this.load.spritesheet('player',   'assets/sprites/player.png',   { frameWidth: 16, frameHeight: 24 });
    // this.load.spritesheet('enemies',  'assets/sprites/enemies.png',  { frameWidth: 16, frameHeight: 16 });
    // this.load.spritesheet('tileset',  'assets/tiles/tileset.png',    { frameWidth: 16, frameHeight: 16 });
    // this.load.spritesheet('hud',      'assets/ui/hud.png',           { frameWidth: 8,  frameHeight: 8  });
    // this.load.audio('bgm_level1',     'assets/audio/level1.ogg');
    // this.load.audio('sfx_jump',       'assets/audio/jump.ogg');
    // this.load.tilemapTiledJSON('level1', 'assets/maps/level1.json');
  }

  // ── Phase 8 stubs ─────────────────────────────────────────────────────────

  /** Load all character / enemy / object spritesheets. */
  _loadSpritesheets() { /* TODO Phase 8 */ }

  /** Load Tiled JSON tilemaps for all four levels. */
  _loadTilemaps()     { /* TODO Phase 8 */ }

  /** Load all music and sound effects. */
  _loadAudio()        { /* TODO Phase 8 */ }

  /** Load HUD, menu, and UI graphics. */
  _loadUI()           { /* TODO Phase 8 */ }
}

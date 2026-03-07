/**
 * BootScene.js — First scene to run on startup.
 *
 * Responsibilities (Phase 1):
 *  - Set any global Phaser / browser settings needed before asset loading.
 *  - Immediately transition to PreloadScene.
 *
 * Future phases may use BootScene to:
 *  - Detect platform (browser vs Electron) and configure SaveManager backend.
 *  - Show a publisher splash image (before any heavy loading).
 *  - Check for existing save data and branch accordingly.
 */

class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create() {
    // ── Placeholder UI ────────────────────────────────────────────────────
    this.cameras.main.setBackgroundColor('#1a1a2e');
    _addSceneLabel(this, 'BOOT');

    // ── Platform detection stub ───────────────────────────────────────────
    // Phase 11: detect window.require (Electron) and call:
    //   SaveManager.useBackend(SteamBackend);
    // before starting PreloadScene.

    // Transition immediately — BootScene has nothing to display.
    this.scene.start('PreloadScene');
  }
}

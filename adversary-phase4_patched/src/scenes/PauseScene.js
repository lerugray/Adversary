/**
 * PauseScene.js — Pause overlay, runs on top of GameScene.
 *
 * Phase 1: Stub only.
 *
 * Future phases:
 *  - Phase 9: Semi-transparent overlay, resume / quit options, settings.
 *  - Phase 10: Full pause menu with controller navigation.
 *
 * Note: PauseScene is launched with scene.launch() (not scene.start()) so
 * GameScene continues to exist underneath it.  When unpausing, call
 * scene.stop('PauseScene') from GameScene.
 */

class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    _addSceneLabel(this, 'PAUSE');

    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    // Semi-transparent backdrop
    this.add.rectangle(cx, cy, 256, 240, 0x000000, 0.6);

    this.add.text(cx, cy, 'PAUSED', {
      fontFamily: 'monospace',
      fontSize:   '16px',
      color:      '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 20, 'Press ENTER to resume', {
      fontFamily: 'monospace',
      fontSize:   '7px',
      color:      '#aaaaaa',
    }).setOrigin(0.5);

    this.inputManager = new InputManager(this);
  }

  update() {
    if (this.inputManager.isStartJustPressed()) {
      // Emit event so GameScene can perform any cleanup before resuming.
      this.events.emit('resume-game');
      this.scene.stop();
      this.scene.resume('GameScene');
    }
  }
}

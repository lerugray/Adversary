/**
 * LoopCompleteScene.js — Shown when the player defeats the Level 4 boss.
 *
 * GameState.advanceLevel() has ALREADY been called by GameScene._onBossDefeated()
 * before transitioning here — currentLevel is 1, currentLoop is incremented.
 * This scene just displays the victory and restarts GameScene at level 1.
 */

class LoopCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoopCompleteScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#003049');
    _addSceneLabel(this, 'LOOP COMPLETE');

    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    this.add.text(cx, cy - 20, 'LOOP COMPLETE!', {
      fontFamily: 'monospace',
      fontSize:   '14px',
      color:      '#fcbf49',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // currentLoop was already incremented by advanceLevel, so show it
    this.add.text(cx, cy + 4, `Starting Loop ${GameState.currentLoop}`, {
      fontFamily: 'monospace',
      fontSize:   '8px',
      color:      '#eeeeee',
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, cy + 22, 'PRESS ANY KEY TO CONTINUE', {
      fontFamily: 'monospace',
      fontSize:   '7px',
      color:      '#aaaaaa',
    }).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0, duration: 500, ease: 'Linear', yoyo: true, repeat: -1 });

    this.inputManager = new InputManager(this);
  }

  update() {
    if (this.inputManager.isAnyJustPressed()) {
      // advanceLevel() was already called — just restart GameScene at level 1
      this.scene.start('GameScene');
    }
  }
}

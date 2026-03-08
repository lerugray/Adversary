/**
 * TitleScene.js — Main title / attract screen.
 *
 * Phase 1: Placeholder screen. Advances to GameScene on any key press.
 *
 * Future phases:
 *  - Phase 3: Animated title logo, character art, blinking "PRESS START".
 *  - Phase 9: Attract-mode demo playback if idle.
 *  - Phase 10: Menu options (New Game, High Scores, Settings, Credits).
 */

class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f3460');
    _addSceneLabel(this, 'TITLE');

    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;

    // Game title
    this.add.text(cx, cy - 30, 'ADVERSARY', {
      fontFamily: GAME_FONT,
      fontSize: '20px',
      color: '#e94560',
      stroke: '#000000',
      strokeThickness: 4,
      padding: { top: 4, bottom: 4 },
    }).setOrigin(0.5);

    // Call to action
    const prompt = this.add.text(cx, cy + 20, 'PRESS ANY KEY TO START', {
      fontFamily: GAME_FONT,
      fontSize: '8px',
      color: '#ffffff',
      padding: FONT_PAD,
    }).setOrigin(0.5);

    // Blink the prompt
    this.tweens.add({
      targets: prompt,
      alpha: 0,
      duration: 500,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
    });

    // ── Input ─────────────────────────────────────────────────────────────
    this.inputManager = new InputManager(this);

    // Reset GameState for a fresh run each time title is shown.
    GameState.reset();
  }

  update() {
    if (this.inputManager.isAnyJustPressed()) {
      this.scene.start('GameScene');
    }
  }
}

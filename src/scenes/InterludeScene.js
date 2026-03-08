/**
 * InterludeScene.js — Between-level interlude / story beat screen.
 *
 * Phase 1: Stub only.
 *
 * Future phases:
 *  - Phase 3: Animated cutscene panels between levels.
 *  - Phase 7: Narrative text, portrait art, voice-over timing.
 *
 * Called after a level is cleared but before the next level loads.
 * Receives data via scene.start('InterludeScene', { nextLevel: 2 }).
 */

class InterludeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InterludeScene' });
  }

  init(data) {
    // data.nextLevel passed from GameScene when a level is completed.
    this._nextLevel = data.nextLevel || 1;
  }

  create() {
    this.cameras.main.setBackgroundColor('#2d1b69');
    _addSceneLabel(this, 'INTERLUDE');

    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    this.add.text(cx, cy - 10, 'INTERLUDE', {
      fontFamily: GAME_FONT,
      fontSize:   '12px',
      color:      '#c77dff',
      padding:    FONT_PAD,
    }).setOrigin(0.5);

    this.add.text(cx, cy + 10, `→ Level ${this._nextLevel}`, {
      fontFamily: GAME_FONT,
      fontSize:   '8px',
      color:      '#aaaaaa',
      padding:    FONT_PAD,
    }).setOrigin(0.5);

    this.inputManager = new InputManager(this);

    // Phase 3: trigger cutscene animation here instead of immediate advance.
    // For now, advance on any key or after a delay.
    this.time.delayedCall(2000, () => {
      this.scene.start('GameScene');
    });
  }

  update() {
    if (this.inputManager.isAnyJustPressed()) {
      this.scene.start('GameScene');
    }
  }
}

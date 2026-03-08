/**
 * HighScoreScene.js — Displays the top high scores from SaveManager.
 *
 * Phase 1: Loads and displays whatever is stored in SaveManager.
 *          Returns to TitleScene on any key press.
 *
 * Future phases:
 *  - Phase 9: Animated entry / highlight for newly placed score.
 *  - Phase 11: Sync with Steam Leaderboards if running in Electron.
 */

class HighScoreScene extends Phaser.Scene {
  constructor() {
    super({ key: 'HighScoreScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d0221');
    _addSceneLabel(this, 'HIGH SCORES');

    const cx = this.cameras.main.width  / 2;

    this.add.text(cx, 18, 'HIGH SCORES', {
      fontFamily: GAME_FONT,
      fontSize:   '12px',
      color:      '#f7b731',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // ── Load and display scores ───────────────────────────────────────────
    const scores = SaveManager.loadHighScores();
    this._renderScores(scores);

    // ── Return prompt ─────────────────────────────────────────────────────
    const prompt = this.add.text(cx, 224, 'PRESS ANY KEY TO RETURN', {
      fontFamily: GAME_FONT,
      fontSize:   '7px',
      color:      '#888888',
    }).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0, duration: 500, ease: 'Linear', yoyo: true, repeat: -1 });

    this.inputManager = new InputManager(this);
  }

  update() {
    if (this.inputManager.isAnyJustPressed()) {
      this.scene.start('TitleScene');
    }
  }

  // ── Private ─────────────────────────────────────────────────────────────

  _renderScores(scores) {
    const cx      = this.cameras.main.width / 2;
    const startY  = 40;
    const rowH    = 16;

    if (scores.length === 0) {
      this.add.text(cx, startY + 20, 'NO SCORES YET\nPlay a game to set one!', {
        fontFamily: GAME_FONT,
        fontSize:   '8px',
        color:      '#555555',
        align:      'center',
      }).setOrigin(0.5, 0);
      return;
    }

    // Column headers
    this.add.text(28,   startY, '#',     { fontFamily: GAME_FONT, fontSize: '7px', color: '#666666' });
    this.add.text(44,   startY, 'SCORE', { fontFamily: GAME_FONT, fontSize: '7px', color: '#666666' });
    this.add.text(130,  startY, 'LOOP',  { fontFamily: GAME_FONT, fontSize: '7px', color: '#666666' });
    this.add.text(170,  startY, 'LVL',   { fontFamily: GAME_FONT, fontSize: '7px', color: '#666666' });

    scores.slice(0, 10).forEach((entry, i) => {
      const y     = startY + rowH + i * rowH;
      const color = i === 0 ? '#f7b731' : '#cccccc';

      this.add.text(28,  y, `${i + 1}.`,              { fontFamily: GAME_FONT, fontSize: '7px', color });
      this.add.text(44,  y, `${entry.score}`,         { fontFamily: GAME_FONT, fontSize: '7px', color });
      this.add.text(130, y, `${entry.loop || 1}`,     { fontFamily: GAME_FONT, fontSize: '7px', color });
      this.add.text(170, y, `${entry.level || 1}`,    { fontFamily: GAME_FONT, fontSize: '7px', color });
    });
  }
}

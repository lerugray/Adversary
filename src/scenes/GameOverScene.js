/**
 * GameOverScene.js — Shown on player death / continue expiry.
 *
 * Phase 1: Stub only. Saves final score via SaveManager before
 *          transitioning to HighScoreScene.
 *
 * Future phases:
 *  - Phase 9: Animated game-over sequence, continue countdown.
 *  - Phase 10: Show run stats (loops cleared, enemies killed, score).
 */

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a0000');
    _addSceneLabel(this, 'GAME OVER');

    const cx = this.cameras.main.width  / 2;
    const cy = this.cameras.main.height / 2;

    this.add.text(cx, cy - 20, 'GAME OVER', {
      fontFamily: GAME_FONT,
      fontSize:   '18px',
      color:      '#e63946',
      stroke:     '#000000',
      strokeThickness: 4,
      padding:    FONT_PAD,
    }).setOrigin(0.5);

    this.add.text(cx, cy + 6, `Score: ${GameState.score}`, {
      fontFamily: GAME_FONT,
      fontSize:   '9px',
      color:      '#ffffff',
      padding:    FONT_PAD,
    }).setOrigin(0.5);

    // ── Persist score ─────────────────────────────────────────────────────
    // Load existing scores, push new entry, save top 10, go to HighScore.
    this._saveScore();

    // Auto-advance after a short pause to let the screen "breathe".
    this.time.delayedCall(1500, () => {
      this.scene.start('HighScoreScene');
    });
  }

  // ── Private ─────────────────────────────────────────────────────────────

  _saveScore() {
    const scores = SaveManager.loadHighScores();

    scores.push({
      score: GameState.score,
      loop:  GameState.currentLoop,
      level: GameState.currentLevel,
      date:  new Date().toISOString(),
    });

    // Keep top 10 by score descending.
    scores.sort((a, b) => b.score - a.score);
    SaveManager.saveHighScores(scores.slice(0, 10));
  }
}

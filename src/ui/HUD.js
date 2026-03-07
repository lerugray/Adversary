/**
 * HUD.js — Heads-up display overlay for ADVERSARY.
 *
 * Renders on a fixed camera overlay so it never moves with the world camera.
 * All values are read directly from GameState each frame.
 *
 * Phase 2 displays:
 *   - HP hearts (placeholder squares: ■ = full, □ = empty)
 *   - MP (mana) numeric
 *   - XP numeric
 *   - Level numeric
 *   - Current special attack label
 *   - Score (top right)
 *   - Loop indicator (top centre)
 *   - Soul indicator: directional arrow if soul orb is off-screen
 *
 * Usage:
 *   // In GameScene.create():
 *   this.hud = new HUD(this);
 *
 *   // In GameScene.update():
 *   this.hud.update(this.player);  // pass PlayerEntity for soul arrow
 */

class HUD {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    // Use a dedicated camera that never scrolls.
    // All HUD objects are added to this camera's ignore-list inverse:
    // we add them with setScrollFactor(0) which is simpler in Phaser 3.
    this._build();
  }

  // ── Build all HUD elements once ───────────────────────────────────────────

  _build() {
    const W = this.scene.cameras.main.width;   // 256
    const s = this.scene;                       // shorthand

    const TEXT_STYLE = {
      fontFamily: 'monospace',
      fontSize:   '7px',
      color:      '#ffffff',
    };
    const SMALL_STYLE = {
      fontFamily: 'monospace',
      fontSize:   '6px',
      color:      '#aaaaaa',
    };

    // ── Background strip at top (subtle dark bar) ──────────────────────
    this.bgBar = s.add.rectangle(0, 0, W, 18, 0x000000, 0.65)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(10);

    // ── HP Hearts container ────────────────────────────────────────────
    // Placeholder: draw coloured squares. Will be swapped for sprites in Phase 3.
    this.heartContainer = s.add.container(4, 2).setScrollFactor(0).setDepth(11);

    // ── MP label ──────────────────────────────────────────────────────
    this.mpText = s.add.text(4, 10, 'MP:6/6', TEXT_STYLE)
      .setScrollFactor(0).setDepth(11);

    // ── XP label ──────────────────────────────────────────────────────
    this.xpText = s.add.text(52, 10, 'XP:0', TEXT_STYLE)
      .setScrollFactor(0).setDepth(11);

    // ── LV label ──────────────────────────────────────────────────────
    this.lvText = s.add.text(90, 10, 'LV:1', TEXT_STYLE)
      .setScrollFactor(0).setDepth(11);

    // ── Special attack label ──────────────────────────────────────────
    this.specialText = s.add.text(120, 10, 'SP:knife', TEXT_STYLE)
      .setScrollFactor(0).setDepth(11);

    // ── Score (top right) ─────────────────────────────────────────────
    this.scoreText = s.add.text(W - 4, 2, 'SCORE:0', TEXT_STYLE)
      .setOrigin(1, 0)
      .setScrollFactor(0).setDepth(11);

    // ── Loop indicator (top centre) ───────────────────────────────────
    this.loopText = s.add.text(W / 2, 2, '', SMALL_STYLE)
      .setOrigin(0.5, 0)
      .setScrollFactor(0).setDepth(11);

    // ── Soul directional arrow (hidden by default) ────────────────────
    this.soulArrow = s.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '8px', color: '#ffdd44' })
      .setScrollFactor(0).setDepth(11)
      .setVisible(false);

    // ── Boss health bar (hidden by default) ──────────────────────────
    this._bossBarBg = s.add.rectangle(W / 2, H - 14, 180, 8, 0x333333, 0.8)
      .setScrollFactor(0).setDepth(10).setVisible(false);
    this._bossBarFill = s.add.rectangle(W / 2, H - 14, 180, 8, 0xff2244, 1.0)
      .setScrollFactor(0).setDepth(11).setVisible(false);
    this._bossBarBorder = s.add.rectangle(W / 2, H - 14, 182, 10, 0x000000, 0)
      .setScrollFactor(0).setDepth(9).setVisible(false);
    // Stroke the border manually
    const borderGfx = s.add.graphics().setScrollFactor(0).setDepth(9).setVisible(false);
    borderGfx.lineStyle(1, 0xffffff, 0.6);
    borderGfx.strokeRect(W / 2 - 91, H - 19, 182, 10);
    this._bossBarBorderGfx = borderGfx;

    this._bossLabel = s.add.text(W / 2, H - 22, 'THE DARK KNIGHT', {
      fontFamily: 'monospace', fontSize: '6px', color: '#ff6666',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(11).setVisible(false);

    this._bossBarVisible = false;

    // Do an initial render
    this.update(null);
  }

  // ── Frame update ──────────────────────────────────────────────────────────

  /**
   * @param {PlayerEntity|null} player  - Pass PlayerEntity to enable soul arrow.
   */
  update(player) {
    const gs = GameState;
    const p  = gs.player;
    const W  = this.scene.cameras.main.width;
    const H  = this.scene.cameras.main.height;

    // ── Rebuild heart icons ────────────────────────────────────────────
    this._rebuildHearts(p.hp, p.maxHp);

    // ── MP ─────────────────────────────────────────────────────────────
    this.mpText.setText(`MP:${p.mana}/${p.maxMana}`);

    // ── XP ─────────────────────────────────────────────────────────────
    this.xpText.setText(`XP:${p.xp}`);

    // ── Level ──────────────────────────────────────────────────────────
    this.lvText.setText(`LV:${p.level}`);

    // ── Special ────────────────────────────────────────────────────────
    this.specialText.setText(`SP:${p.specialAttack || 'none'}`);

    // ── Score ──────────────────────────────────────────────────────────
    this.scoreText.setText(`SCORE:${gs.score}`);

    // ── Loop (only show if loop > 1 to avoid clutter on first run) ─────
    if (gs.currentLoop > 1) {
      this.loopText.setText(`LOOP ${gs.currentLoop}`);
    } else {
      this.loopText.setText('');
    }

    // ── Soul arrow ─────────────────────────────────────────────────────
    this._updateSoulArrow(player, W, H);
  }

  // ── Heart icons ───────────────────────────────────────────────────────────

  /**
   * Rebuild the heart container each frame.
   * Phase 2: plain coloured rectangles (■ full, □ empty).
   * Phase 3+: replace container children with real heart sprites.
   *
   * @param {number} hp
   * @param {number} maxHp
   */
  _rebuildHearts(hp, maxHp) {
    // Destroy previous icons
    this.heartContainer.removeAll(true);

    const SIZE   = 6;  // px per heart icon
    const GAP    = 2;  // px between icons
    const MAX_DISPLAY = Math.min(maxHp, 20); // clamp to avoid overflow

    for (let i = 0; i < MAX_DISPLAY; i++) {
      const full  = i < hp;
      const color = full ? 0xff4444 : 0x553333;
      const icon  = this.scene.add.rectangle(
        i * (SIZE + GAP), 0,
        SIZE, SIZE,
        color
      ).setOrigin(0, 0);
      this.heartContainer.add(icon);
    }
  }

  // ── Soul arrow ────────────────────────────────────────────────────────────

  /**
   * If the soul orb exists and is off-screen, display a directional arrow
   * pointing toward it from the nearest screen edge.
   *
   * @param {PlayerEntity|null} player
   * @param {number}            W  screen width
   * @param {number}            H  screen height
   */
  _updateSoulArrow(player, W, H) {
    if (!player || !player.hasSoul || !GameState.soul) {
      this.soulArrow.setVisible(false);
      return;
    }

    const cam = this.scene.cameras.main;

    // Convert soul world pos to screen pos
    const screenX = GameState.soul.x - cam.scrollX;
    const screenY = GameState.soul.y - cam.scrollY;

    // Is the orb currently visible on screen?
    const onScreen = screenX >= 0 && screenX <= W && screenY >= 0 && screenY <= H;
    if (onScreen) {
      this.soulArrow.setVisible(false);
      return;
    }

    // Determine arrow glyph and position on screen edge
    const cx = W / 2;
    const cy = H / 2;
    const dx = screenX - cx;
    const dy = screenY - cy;

    let glyph = '↑';
    let ax = cx, ay = 22;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal arrow
      if (dx > 0) {
        glyph = '→'; ax = W - 10; ay = cy;
      } else {
        glyph = '←'; ax = 6;      ay = cy;
      }
    } else {
      if (dy > 0) {
        glyph = '↓'; ax = cx; ay = H - 10;
      } else {
        glyph = '↑'; ax = cx; ay = 22;
      }
    }

    this.soulArrow
      .setText(glyph)
      .setPosition(ax, ay)
      .setVisible(true);
  }

  // ── Boss health bar ───────────────────────────────────────────────────────

  /**
   * Show and update the boss health bar at the bottom of the screen.
   * @param {number} current - Current boss HP
   * @param {number} max     - Max boss HP
   */
  setBossHealth(current, max) {
    if (!this._bossBarVisible) {
      this._bossBarBg.setVisible(true);
      this._bossBarFill.setVisible(true);
      this._bossBarBorder.setVisible(true);
      this._bossBarBorderGfx.setVisible(true);
      this._bossLabel.setVisible(true);
      this._bossBarVisible = true;
    }

    const ratio = Math.max(0, current / max);
    const W = this.scene.cameras.main.width;
    const fullWidth = 180;
    const fillWidth = Math.floor(fullWidth * ratio);

    // Update fill bar width and position (origin center)
    this._bossBarFill.setSize(fillWidth, 8);
    this._bossBarFill.setPosition(W / 2 - (fullWidth - fillWidth) / 2, this._bossBarFill.y);

    // Color shifts: green → yellow → red
    if (ratio > 0.5) {
      this._bossBarFill.setFillStyle(0xff2244);
    } else if (ratio > 0.25) {
      this._bossBarFill.setFillStyle(0xff8800);
    } else {
      this._bossBarFill.setFillStyle(0xff4444);
    }
  }

  /**
   * Hide the boss health bar.
   */
  hideBossHealth() {
    this._bossBarBg.setVisible(false);
    this._bossBarFill.setVisible(false);
    this._bossBarBorder.setVisible(false);
    this._bossBarBorderGfx.setVisible(false);
    this._bossLabel.setVisible(false);
    this._bossBarVisible = false;
  }
}

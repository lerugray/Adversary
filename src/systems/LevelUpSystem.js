/**
 * LevelUpSystem.js — Handles XP thresholds, level-up detection, and choice overlay.
 *
 * When the player's XP reaches the threshold for the next level, gameplay pauses
 * and a choice menu appears. The player picks one of four bonuses:
 *   1. Max HP +1
 *   2. Attack Power +1
 *   3. Max Mana +3
 *   4. Speed Boost
 *
 * Usage:
 *   // In GameScene.create():
 *   this.levelUpSystem = new LevelUpSystem(this);
 *
 *   // In GameScene.update():
 *   this.levelUpSystem.update(inputManager);
 */

// XP required to reach each level (index = target level)
// Level 2 = 80, Level 3 = 200, etc.
const LEVEL_XP_THRESHOLDS = [
  0,     // level 0 (unused)
  0,     // level 1 (starting)
  80,    // level 2
  200,   // level 3
  400,   // level 4
  700,   // level 5
  1100,  // level 6
  1600,  // level 7
  2200,  // level 8
  2900,  // level 9
  3700,  // level 10
];

/**
 * Get XP needed for a given level. Beyond the table, scales linearly.
 */
function xpForLevel(level) {
  if (level < LEVEL_XP_THRESHOLDS.length) {
    return LEVEL_XP_THRESHOLDS[level];
  }
  // Beyond table: 3700 + 900 per level past 10
  return 3700 + (level - 10) * 900;
}

// The four level-up choices
const LEVELUP_CHOICES = [
  { key: 'hp',     label: 'MAX HP +1',       desc: 'Increase maximum health by 1' },
  { key: 'attack', label: 'ATTACK POWER +1', desc: 'Deal more damage per hit' },
  { key: 'mana',   label: 'MAX MANA +3',     desc: 'Increase maximum mana by 3' },
  { key: 'speed',  label: 'SPEED BOOST',     desc: 'Move and attack slightly faster' },
];

class LevelUpSystem {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    /** True while the level-up menu is showing */
    this.isActive = false;

    /** Currently highlighted choice index (0-3) */
    this._selectedIndex = 0;

    /** Overlay UI elements (created on demand, destroyed after choice) */
    this._overlay = null;
    this._choiceTexts = [];
    this._titleText = null;
    this._descText = null;

    /** Debounce inputs so menu doesn't fly through options */
    this._inputCooldown = 0;
  }

  /**
   * Check if the player has enough XP to level up, and if so, show the menu.
   * Called each frame from GameScene.update().
   * @param {InputManager} input
   * @param {number} delta
   */
  update(input, delta) {
    if (this.isActive) {
      this._updateMenu(input, delta);
      return;
    }

    // Check for level-up
    const p = GameState.player;
    const nextLevel = p.level + 1;
    const needed = xpForLevel(nextLevel);

    if (p.xp >= needed) {
      this._triggerLevelUp();
    }
  }

  // ── Trigger level-up ──────────────────────────────────────────────────────

  _triggerLevelUp() {
    this.isActive = true;
    this._selectedIndex = 0;
    this._inputCooldown = 300; // brief delay before accepting input

    GameState.player.level += 1;

    this._buildOverlay();
  }

  // ── Build the choice overlay ──────────────────────────────────────────────

  _buildOverlay() {
    const s = this.scene;
    const W = s.cameras.main.width;   // 256
    const H = s.cameras.main.height;  // 240

    // Dark background
    this._overlay = s.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.75)
      .setScrollFactor(0).setDepth(50);

    // Title
    this._titleText = s.add.text(W / 2, 40, `LEVEL UP!  LV ${GameState.player.level}`, {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffdd44',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51);

    // Subtitle
    this._subtitleText = s.add.text(W / 2, 56, 'Choose one:', {
      fontFamily: 'monospace', fontSize: '6px', color: '#aaaaaa',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51);

    // Choice texts
    this._choiceTexts = [];
    const startY = 80;
    const gap = 28;

    for (let i = 0; i < LEVELUP_CHOICES.length; i++) {
      const choice = LEVELUP_CHOICES[i];
      const y = startY + i * gap;

      const label = s.add.text(W / 2, y, choice.label, {
        fontFamily: 'monospace', fontSize: '7px', color: '#ffffff',
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51);

      const desc = s.add.text(W / 2, y + 12, choice.desc, {
        fontFamily: 'monospace', fontSize: '5px', color: '#888888',
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51);

      this._choiceTexts.push({ label, desc });
    }

    // Cursor indicator
    this._cursor = s.add.text(0, 0, '>', {
      fontFamily: 'monospace', fontSize: '8px', color: '#ffdd44',
    }).setScrollFactor(0).setDepth(51);

    this._updateCursor();

    // Flash to announce level-up
    s.cameras.main.flash(300, 255, 220, 80, false);
  }

  _updateCursor() {
    if (!this._cursor) return;
    const W = this.scene.cameras.main.width;
    const startY = 80;
    const gap = 28;
    const y = startY + this._selectedIndex * gap;
    this._cursor.setPosition(W / 2 - 70, y - 4);

    // Highlight selected, dim others
    for (let i = 0; i < this._choiceTexts.length; i++) {
      const selected = i === this._selectedIndex;
      this._choiceTexts[i].label.setColor(selected ? '#ffdd44' : '#666666');
      this._choiceTexts[i].desc.setColor(selected ? '#aaaaaa' : '#444444');
    }
  }

  // ── Menu input handling ─────────────────────────────────────────────────

  _updateMenu(input, delta) {
    this._inputCooldown -= delta;
    if (this._inputCooldown > 0) return;

    if (input.isUpHeld()) {
      this._selectedIndex = (this._selectedIndex + 3) % 4; // wrap up
      this._updateCursor();
      this._inputCooldown = 180;
    } else if (input.isDownHeld()) {
      this._selectedIndex = (this._selectedIndex + 1) % 4; // wrap down
      this._updateCursor();
      this._inputCooldown = 180;
    }

    if (input.isAttackJustPressed() || input.isJumpJustPressed()) {
      this._applyChoice(this._selectedIndex);
    }
  }

  // ── Apply the chosen bonus ────────────────────────────────────────────────

  _applyChoice(index) {
    const choice = LEVELUP_CHOICES[index];
    const p = GameState.player;

    switch (choice.key) {
      case 'hp':
        p.maxHp += 1;
        p.hp = p.maxHp; // full heal on HP upgrade
        break;
      case 'attack':
        p.attackPowerBonus += 1;
        break;
      case 'mana':
        p.maxMana += 3;
        p.mana = p.maxMana; // full mana restore on mana upgrade
        break;
      case 'speed':
        p.speedBonus += 1;
        break;
    }

    this._destroyOverlay();
    this.isActive = false;

    // Brief celebratory flash
    this.scene.cameras.main.flash(200, 100, 255, 100, false);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  _destroyOverlay() {
    if (this._overlay) { this._overlay.destroy(); this._overlay = null; }
    if (this._titleText) { this._titleText.destroy(); this._titleText = null; }
    if (this._subtitleText) { this._subtitleText.destroy(); this._subtitleText = null; }
    if (this._cursor) { this._cursor.destroy(); this._cursor = null; }

    for (const ct of this._choiceTexts) {
      if (ct.label) ct.label.destroy();
      if (ct.desc) ct.desc.destroy();
    }
    this._choiceTexts = [];
  }
}

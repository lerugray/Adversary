/**
 * LevelUpSystem.js — Handles XP thresholds, level-up detection, and choice overlay.
 *
 * Two-phase UI (Dark Souls style):
 *   Phase 1: Big "LEVEL UP" announcement fills the screen, waits for any button press
 *   Phase 2: Choice menu appears — pick a bonus, then confirm with a second press
 *
 * Usage:
 *   // In GameScene.create():
 *   this.levelUpSystem = new LevelUpSystem(this);
 *
 *   // In GameScene.update():
 *   this.levelUpSystem.update(inputManager, delta);
 */

// XP required to reach each level (index = target level)
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
  return 3700 + (level - 10) * 900;
}

// The four level-up choices
const LEVELUP_CHOICES = [
  { key: 'hp',     label: 'MAX HP +1',       desc: 'Increase maximum health' },
  { key: 'attack', label: 'ATTACK +1',       desc: 'Deal more damage per hit' },
  { key: 'mana',   label: 'MAX MANA +3',     desc: 'Increase maximum mana' },
  { key: 'speed',  label: 'SPEED BOOST',     desc: 'Move and attack faster' },
];

// UI phases
const LVLUP_PHASE = {
  NONE:       'none',
  ANNOUNCE:   'announce',   // big "LEVEL UP" splash
  CHOOSE:     'choose',     // selection menu
  CONFIRM:    'confirm',    // "Are you sure?" prompt
};

class LevelUpSystem {
  constructor(scene) {
    this.scene = scene;
    this.isActive = false;
    this._phase = LVLUP_PHASE.NONE;
    this._selectedIndex = 0;
    this._inputCooldown = 0;
    this._startupDelay = 1000;
    this._elements = []; // all UI elements for easy cleanup
  }

  update(input, delta) {
    if (this.isActive) {
      this._inputCooldown -= delta;
      if (this._inputCooldown > 0) return;

      switch (this._phase) {
        case LVLUP_PHASE.ANNOUNCE: this._updateAnnounce(input); break;
        case LVLUP_PHASE.CHOOSE:   this._updateChoose(input, delta); break;
        case LVLUP_PHASE.CONFIRM:  this._updateConfirm(input); break;
      }
      return;
    }

    // Don't trigger during startup or if player is dead
    if (this._startupDelay > 0) { this._startupDelay -= delta; return; }
    if (this.scene.player && this.scene.player.state === STATE.DEAD) return;

    const p = GameState.player;
    const needed = xpForLevel(p.level + 1);
    if (p.xp >= needed) {
      this._triggerLevelUp();
    }
  }

  // ── Phase 1: Trigger ────────────────────────────────────────────────────

  _triggerLevelUp() {
    this.isActive = true;
    this._selectedIndex = 0;
    GameState.player.level += 1;

    // Freeze everything — pause physics so enemies stop mid-stride
    this.scene.physics.world.pause();

    // Also zero out the player so they don't drift when physics resumes
    if (this.scene.player && this.scene.player.sprite) {
      this.scene.player.sprite.body.setVelocity(0, 0);
      this.scene.player.sprite.body.setAllowGravity(false);
    }

    this._showAnnounce();
  }

  // ── Phase 1: Big announcement screen ────────────────────────────────────

  _showAnnounce() {
    this._phase = LVLUP_PHASE.ANNOUNCE;
    this._inputCooldown = 800; // hold on screen before accepting input
    this._destroyAll();

    const s = this.scene;
    const W = s.cameras.main.width;
    const H = s.cameras.main.height;

    // Full black overlay
    this._add(s.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(50));

    // Decorative line above
    this._add(s.add.rectangle(W / 2, H / 2 - 30, 160, 1, 0xffdd44, 0.6)
      .setScrollFactor(0).setDepth(51));

    // Big title
    this._add(s.add.text(W / 2, H / 2 - 12, 'LEVEL UP', {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffdd44',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51));

    // Level number
    this._add(s.add.text(W / 2, H / 2 + 8, `Level ${GameState.player.level}`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#ccaa33',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51));

    // Decorative line below
    this._add(s.add.rectangle(W / 2, H / 2 + 24, 160, 1, 0xffdd44, 0.6)
      .setScrollFactor(0).setDepth(51));

    // Prompt (fades in after cooldown via alpha tween)
    const prompt = s.add.text(W / 2, H / 2 + 48, '- Press any button -', {
      fontFamily: 'monospace', fontSize: '6px', color: '#888866',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51).setAlpha(0);
    this._add(prompt);

    // Fade in the prompt after the cooldown
    s.time.delayedCall(800, () => {
      if (prompt.active) {
        s.tweens.add({
          targets: prompt, alpha: 1, duration: 400, yoyo: true,
          repeat: -1, ease: 'Sine.easeInOut',
        });
      }
    });

    // Screen flash
    s.cameras.main.flash(500, 255, 220, 80, false);
  }

  _updateAnnounce(input) {
    if (input.isAttackJustPressed() || input.isJumpJustPressed() || input.isStartJustPressed()) {
      this._showChooseMenu();
    }
  }

  // ── Phase 2: Choice menu ────────────────────────────────────────────────

  _showChooseMenu() {
    this._phase = LVLUP_PHASE.CHOOSE;
    this._inputCooldown = 300;
    this._selectedIndex = 0;
    this._destroyAll();

    const s = this.scene;
    const W = s.cameras.main.width;
    const H = s.cameras.main.height;

    // Dark overlay
    this._add(s.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.82)
      .setScrollFactor(0).setDepth(50));

    // Header
    this._add(s.add.text(W / 2, 24, `LEVEL ${GameState.player.level}`, {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffdd44',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51));

    this._add(s.add.text(W / 2, 40, 'Choose your reward', {
      fontFamily: 'monospace', fontSize: '7px', color: '#aa9944',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51));

    // Divider
    this._add(s.add.rectangle(W / 2, 52, 180, 1, 0x665522, 0.8)
      .setScrollFactor(0).setDepth(51));

    // Choice items
    this._choiceLabels = [];
    this._choiceDescs = [];
    const startY = 72;
    const gap = 32;

    for (let i = 0; i < LEVELUP_CHOICES.length; i++) {
      const choice = LEVELUP_CHOICES[i];
      const y = startY + i * gap;

      const label = s.add.text(W / 2, y, choice.label, {
        fontFamily: 'monospace', fontSize: '9px', color: '#ffffff',
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51);

      const desc = s.add.text(W / 2, y + 14, choice.desc, {
        fontFamily: 'monospace', fontSize: '6px', color: '#888888',
      }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51);

      this._add(label);
      this._add(desc);
      this._choiceLabels.push(label);
      this._choiceDescs.push(desc);
    }

    // Cursor arrow
    this._cursor = s.add.text(0, 0, '>', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffdd44',
    }).setScrollFactor(0).setDepth(51);
    this._add(this._cursor);

    // Footer hint
    this._add(s.add.text(W / 2, H - 16, 'Up/Down to select, Attack to choose', {
      fontFamily: 'monospace', fontSize: '5px', color: '#555544',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51));

    this._updateChooseCursor();
  }

  _updateChooseCursor() {
    if (!this._cursor) return;
    const W = this.scene.cameras.main.width;
    const startY = 72;
    const gap = 32;
    const y = startY + this._selectedIndex * gap;
    this._cursor.setPosition(W / 2 - 65, y - 4);

    for (let i = 0; i < this._choiceLabels.length; i++) {
      const sel = i === this._selectedIndex;
      this._choiceLabels[i].setColor(sel ? '#ffdd44' : '#555555');
      this._choiceDescs[i].setColor(sel ? '#aaaaaa' : '#333333');
    }
  }

  _updateChoose(input, delta) {
    if (input.isUpHeld()) {
      this._selectedIndex = (this._selectedIndex + 3) % 4;
      this._updateChooseCursor();
      this._inputCooldown = 180;
    } else if (input.isDownHeld()) {
      this._selectedIndex = (this._selectedIndex + 1) % 4;
      this._updateChooseCursor();
      this._inputCooldown = 180;
    }

    if (input.isAttackJustPressed() || input.isJumpJustPressed()) {
      this._showConfirm(this._selectedIndex);
    }
  }

  // ── Phase 3: Confirmation ───────────────────────────────────────────────

  _showConfirm(index) {
    this._phase = LVLUP_PHASE.CONFIRM;
    this._inputCooldown = 400; // prevent accidental double-tap
    this._confirmIndex = index;
    this._destroyAll();

    const s = this.scene;
    const W = s.cameras.main.width;
    const H = s.cameras.main.height;
    const choice = LEVELUP_CHOICES[index];

    // Dark overlay
    this._add(s.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85)
      .setScrollFactor(0).setDepth(50));

    // Show what they picked
    this._add(s.add.text(W / 2, H / 2 - 30, choice.label, {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffdd44',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51));

    this._add(s.add.text(W / 2, H / 2 - 12, choice.desc, {
      fontFamily: 'monospace', fontSize: '7px', color: '#aa9944',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51));

    // Divider
    this._add(s.add.rectangle(W / 2, H / 2 + 4, 140, 1, 0x665522, 0.6)
      .setScrollFactor(0).setDepth(51));

    // Confirm / Cancel
    this._add(s.add.text(W / 2, H / 2 + 22, 'Attack = Confirm', {
      fontFamily: 'monospace', fontSize: '7px', color: '#88cc88',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51));

    this._add(s.add.text(W / 2, H / 2 + 38, 'Jump = Go Back', {
      fontFamily: 'monospace', fontSize: '7px', color: '#cc8888',
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(51));
  }

  _updateConfirm(input) {
    if (input.isAttackJustPressed()) {
      this._applyChoice(this._confirmIndex);
    } else if (input.isJumpJustPressed()) {
      // Go back to choice menu
      this._showChooseMenu();
    }
  }

  // ── Apply the chosen bonus ──────────────────────────────────────────────

  _applyChoice(index) {
    const choice = LEVELUP_CHOICES[index];
    const p = GameState.player;

    switch (choice.key) {
      case 'hp':
        p.maxHp += 1;
        p.hp = p.maxHp;
        break;
      case 'attack':
        p.attackPowerBonus += 1;
        break;
      case 'mana':
        p.maxMana += 3;
        p.mana = p.maxMana;
        break;
      case 'speed':
        p.speedBonus += 1;
        break;
    }

    this._destroyAll();
    this.isActive = false;
    this._phase = LVLUP_PHASE.NONE;

    // Unfreeze everything — resume physics
    this.scene.physics.world.resume();

    if (this.scene.player && this.scene.player.sprite) {
      this.scene.player.sprite.body.setAllowGravity(true);
    }

    this.scene.cameras.main.flash(200, 100, 255, 100, false);
  }

  // ── Element tracking & cleanup ──────────────────────────────────────────

  _add(element) {
    this._elements.push(element);
    return element;
  }

  _destroyAll() {
    for (const el of this._elements) {
      if (el && el.active) el.destroy();
    }
    this._elements = [];
    this._cursor = null;
    this._choiceLabels = [];
    this._choiceDescs = [];
  }
}

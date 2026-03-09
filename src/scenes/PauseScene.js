/**
 * PauseScene.js — Pause overlay, runs on top of GameScene.
 *
 * Shows equipped gear, pickup legend, and accessory switching.
 * Press Left/Right on the accessory line to cycle through collected rings.
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

    this.add.text(cx, 28, 'PAUSED', {
      fontFamily: GAME_FONT,
      fontSize:   '14px',
      color:      '#ffffff',
      padding:    FONT_PAD,
    }).setOrigin(0.5);

    // ── Item pickup legend ─────────────────────────────────────────────
    const legendItems = [
      { color: 0xff4444, label: 'Heart (HP)' },
      { color: 0x4488ff, label: 'Mana Shard' },
      { color: 0xaaaaaa, label: 'Weapon' },
      { color: 0xddaa44, label: 'Armor' },
      { color: 0x44ccaa, label: 'Accessory' },
      { color: 0xff88ff, label: 'Special Atk' },
    ];

    const legendStartY = 62;
    const legendX = cx - 56;
    const legendSpacing = 12;

    this.add.text(cx, legendStartY - 12, '— Pickups —', {
      fontFamily: GAME_FONT,
      fontSize:   '6px',
      color:      '#888888',
      padding:    FONT_PAD,
    }).setOrigin(0.5);

    for (let i = 0; i < legendItems.length; i++) {
      const item = legendItems[i];
      const iy = legendStartY + i * legendSpacing;

      // Color swatch
      this.add.rectangle(legendX, iy, 7, 7, item.color);

      // Label
      this.add.text(legendX + 10, iy, item.label, {
        fontFamily: GAME_FONT,
        fontSize:   '6px',
        color:      '#cccccc',
        padding:    FONT_PAD,
      }).setOrigin(0, 0.5);
    }

    // ── Current equipment display ─────────────────────────────────────
    const gs = GameState.player;
    const equipY = legendStartY + legendItems.length * legendSpacing + 12;

    this.add.text(cx, equipY, '— Equipped —', {
      fontFamily: GAME_FONT,
      fontSize:   '6px',
      color:      '#888888',
      padding:    FONT_PAD,
    }).setOrigin(0.5);

    const weaponName = gs.weapon ? gs.weapon.name : 'None';
    const armorName  = gs.armor  ? gs.armor.name  : 'None';

    this.add.text(legendX, equipY + 14, `Wpn: ${weaponName}`, {
      fontFamily: GAME_FONT, fontSize: '6px', color: '#aaaaaa', padding: FONT_PAD,
    }).setOrigin(0, 0.5);

    this.add.text(legendX, equipY + 26, `Arm: ${armorName}`, {
      fontFamily: GAME_FONT, fontSize: '6px', color: '#ddaa44', padding: FONT_PAD,
    }).setOrigin(0, 0.5);

    // ── Accessory line (switchable with Left/Right) ─────────────────
    const accY = equipY + 38;
    const accName = gs.accessory ? gs.accessory.name : 'None';
    const inv = gs.accessoryInventory || [];
    const hasMultiple = inv.length > 1;

    const arrows = hasMultiple ? '< ' : '  ';
    const arrowsR = hasMultiple ? ' >' : '';
    this._accText = this.add.text(legendX, accY, `Rng: ${arrows}${accName}${arrowsR}`, {
      fontFamily: GAME_FONT, fontSize: '6px', color: '#44ccaa', padding: FONT_PAD,
    }).setOrigin(0, 0.5);

    if (hasMultiple) {
      this.add.text(legendX, accY + 10, '(Left/Right to switch)', {
        fontFamily: GAME_FONT, fontSize: '5px', color: '#337766', padding: FONT_PAD,
      }).setOrigin(0, 0.5);
    }

    // Track accessory effect description
    const accDesc = gs.accessory ? gs.accessory.desc : '';
    this._accDescText = this.add.text(cx, accY + 20, accDesc, {
      fontFamily: GAME_FONT, fontSize: '5px', color: '#66aa99', padding: FONT_PAD,
    }).setOrigin(0.5, 0.5);

    this.add.text(cx, 222, 'Press ENTER to resume', {
      fontFamily: GAME_FONT,
      fontSize:   '6px',
      color:      '#aaaaaa',
      padding:    FONT_PAD,
    }).setOrigin(0.5);

    this.inputManager = new InputManager(this);
    this._switchCooldown = 0;
  }

  update(time, delta) {
    if (this._switchCooldown > 0) this._switchCooldown -= delta;

    if (this.inputManager.isStartJustPressed()) {
      // Emit event so GameScene can perform any cleanup before resuming.
      this.events.emit('resume-game');
      this.scene.stop();
      this.scene.resume('GameScene');
      return;
    }

    // ── Accessory switching with Left/Right ────────────────────────
    const gs = GameState.player;
    const inv = gs.accessoryInventory || [];
    if (inv.length > 1 && this._switchCooldown <= 0) {
      let switched = false;
      const curIdx = gs.accessory
        ? inv.findIndex(a => a.name === gs.accessory.name)
        : -1;

      if (this.inputManager.isRightHeld()) {
        const next = (curIdx + 1) % inv.length;
        gs.accessory = { ...inv[next] };
        switched = true;
      } else if (this.inputManager.isLeftHeld()) {
        const prev = (curIdx - 1 + inv.length) % inv.length;
        gs.accessory = { ...inv[prev] };
        switched = true;
      }

      if (switched) {
        this._switchCooldown = 200;
        const name = gs.accessory ? gs.accessory.name : 'None';
        this._accText.setText(`Rng: < ${name} >`);
        this._accDescText.setText(gs.accessory ? gs.accessory.desc : '');
      }
    }
  }
}

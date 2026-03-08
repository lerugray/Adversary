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

    this.add.text(cx, 28, 'PAUSED', {
      fontFamily: GAME_FONT,
      fontSize:   '14px',
      color:      '#ffffff',
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
      }).setOrigin(0, 0.5);
    }

    // ── Current equipment display ─────────────────────────────────────
    const gs = GameState.player;
    const equipY = legendStartY + legendItems.length * legendSpacing + 12;

    this.add.text(cx, equipY, '— Equipped —', {
      fontFamily: GAME_FONT,
      fontSize:   '6px',
      color:      '#888888',
    }).setOrigin(0.5);

    const weaponName = gs.weapon ? gs.weapon.name : 'None';
    const armorName  = gs.armor  ? gs.armor.name  : 'None';
    const accName    = gs.accessory ? gs.accessory.name : 'None';

    this.add.text(legendX, equipY + 14, `Wpn: ${weaponName}`, {
      fontFamily: GAME_FONT, fontSize: '6px', color: '#aaaaaa',
    }).setOrigin(0, 0.5);

    this.add.text(legendX, equipY + 26, `Arm: ${armorName}`, {
      fontFamily: GAME_FONT, fontSize: '6px', color: '#ddaa44',
    }).setOrigin(0, 0.5);

    this.add.text(legendX, equipY + 38, `Rng: ${accName}`, {
      fontFamily: GAME_FONT, fontSize: '6px', color: '#44ccaa',
    }).setOrigin(0, 0.5);

    this.add.text(cx, 222, 'Press ENTER to resume', {
      fontFamily: GAME_FONT,
      fontSize:   '6px',
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

/**
 * BreakableSystem.js — Destructible containers (crates, barrels).
 *
 * Placed at fixed positions defined in level data. Player attacks them
 * to break them open for item drops. Rewards exploration off the main path.
 *
 * Configured per-level via levelData.breakables:
 *   [
 *     { x, y, type: 'crate'|'barrel', drops: [{type, chance}] },
 *   ]
 *
 * Usage:
 *   this.breakableSystem = new BreakableSystem(this);
 *   // check hits from GameScene._checkAttackHitboxCollisions()
 *   this.breakableSystem.update(delta);
 */

// ── Visual sizes ────────────────────────────────────────────────────────────
const BRK_CRATE_W   = 12;
const BRK_CRATE_H   = 12;
const BRK_BARREL_W  = 10;
const BRK_BARREL_H  = 14;

// ── Default drop table (used if container has no custom drops) ──────────────
const BRK_DEFAULT_DROPS = [
  { type: 'heart',      chance: 0.35 },
  { type: 'mana_shard', chance: 0.50 },
  { type: 'special',    chance: 0.08 },
];

class BreakableSystem {
  constructor(scene) {
    this.scene = scene;
    this._containers = [];

    const data = scene.currentLevelData;
    if (data && data.breakables) {
      this._buildContainers(data.breakables);
    }
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  _buildContainers(defs) {
    for (const def of defs) {
      const isCrate = (def.type || 'crate') === 'crate';
      const w = isCrate ? BRK_CRATE_W : BRK_BARREL_W;
      const h = isCrate ? BRK_CRATE_H : BRK_BARREL_H;

      // Main body
      const color = isCrate ? 0x8b6914 : 0x6b4c1e;
      const assetKey = isCrate ? 'oryx_crate' : 'oryx_barrel';
      const body = this.scene.textures.exists(assetKey)
        ? this.scene.add.image(def.x, def.y - h / 2, assetKey).setDepth(5)
        : this.scene.add.rectangle(def.x, def.y - h / 2, w, h, color).setDepth(5);

      // Detail lines
      if (isCrate && body.type !== 'Image') {
        // Cross slats on crate
        this.scene.add.rectangle(def.x, def.y - h / 2, w, 1, 0x5a4010, 0.7)
          .setDepth(5);
        this.scene.add.rectangle(def.x, def.y - h / 2, 1, h, 0x5a4010, 0.7)
          .setDepth(5);
        // Highlight edge
        this.scene.add.rectangle(def.x, def.y - h + 1, w, 2, 0xaa8830, 0.5)
          .setDepth(5);
      } else if (body.type !== 'Image') {
        // Barrel bands
        this.scene.add.rectangle(def.x, def.y - h + 3, w, 2, 0x444444, 0.8)
          .setDepth(5);
        this.scene.add.rectangle(def.x, def.y - 3, w, 2, 0x444444, 0.8)
          .setDepth(5);
      }

      this._containers.push({
        x: def.x,
        y: def.y - h / 2,  // center Y
        w: w,
        h: h,
        body: body,
        drops: def.drops || BRK_DEFAULT_DROPS,
        broken: false,
        visuals: [], // tracked for cleanup if needed
      });
    }
  }

  // ── Check player attack hitting a container ───────────────────────────────

  checkHits(player) {
    const hitbox = player.attackHitbox;
    if (!hitbox || !hitbox.body || !hitbox.body.enable) return;

    const hx = hitbox.x;
    const hy = hitbox.y;
    const hw = hitbox.body.width / 2;
    const hh = hitbox.body.height / 2;

    for (const c of this._containers) {
      if (c.broken) continue;

      const dx = Math.abs(hx - c.x);
      const dy = Math.abs(hy - c.y);

      if (dx < hw + c.w / 2 && dy < hh + c.h / 2) {
        this._breakContainer(c);
      }
    }
  }

  // ── Break a container ─────────────────────────────────────────────────────

  _breakContainer(container) {
    container.broken = true;

    // Flash white then fade
    if (container.body.setFillStyle) {
      container.body.setFillStyle(0xffffff);
    } else {
      container.body.setTint(0xffffff);
    }
    this.scene.tweens.add({
      targets: container.body,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 250,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (container.body && container.body.active) container.body.destroy();
      }
    });

    // Spawn debris particles (small brown squares flying out)
    for (let i = 0; i < 4; i++) {
      const px = container.x + (Math.random() - 0.5) * container.w;
      const py = container.y + (Math.random() - 0.5) * container.h;
      const particle = this.scene.add.rectangle(px, py, 3, 3, 0x6b4c1e)
        .setDepth(6);
      this.scene.tweens.add({
        targets: particle,
        x: px + (Math.random() - 0.5) * 30,
        y: py - 10 - Math.random() * 20,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }

    // Small score bonus
    GameState.score += 25;

    // Score popup
    const popup = this.scene.add.text(container.x, container.y - 10, '+25', {
      fontFamily: GAME_FONT, fontSize: '7px', color: '#ffdd44',
      stroke: '#000000', strokeThickness: 2, padding: FONT_PAD,
    }).setOrigin(0.5, 1).setDepth(50);
    this.scene.tweens.add({
      targets: popup, y: popup.y - 16, alpha: 0,
      duration: 800, ease: 'Power2',
      onComplete: () => popup.destroy(),
    });

    // Roll item drops
    if (this.scene.itemSystem) {
      this.scene.itemSystem.rollDrop(container.x, container.y, container.drops);
    }
  }

  // ── Frame update (currently just for future use) ──────────────────────────

  update(delta) {
    // Reserved for future: animated containers, timed respawns, etc.
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroyAll() {
    for (const c of this._containers) {
      if (c.body && c.body.active) c.body.destroy();
    }
    this._containers = [];
  }
}

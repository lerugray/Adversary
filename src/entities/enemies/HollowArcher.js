/**
 * HollowArcher.js — Stationary ranged enemy.
 *
 * Behaviour:
 *   - Stands still, faces player direction
 *   - When player within ~120px horizontal and ~30px vertical: fires arrow
 *   - Arrow: horizontal projectile, 1 damage, destroyed on wall/platform contact
 *   - Fire cooldown: ~2.5s
 *   - Drops: mana shard (common)
 *   - XP: 15, Score: 75
 */

// ── Tuning constants ────────────────────────────────────────────────────────
const HA_DETECT_RANGE_X   = 120;   // horizontal detection range
const HA_DETECT_RANGE_Y   = 30;    // vertical range (same tier)
const HA_FIRE_COOLDOWN    = 2500;  // ms between shots
const HA_ARROW_SPEED      = 100;   // px/s
const HA_ARROW_LIFETIME   = 2500;  // ms before arrow self-destructs

// Drop chances
const HA_DROP_MANA_CHANCE = 0.50;

class HollowArcher extends EnemyEntity {
  constructor(scene, x, y) {
    super(scene, x, y, {
      width:       8,
      height:      18,
      color:       0x6688aa,  // blue-grey
      hp:          1,
      damage:      1,
      xpReward:    15,
      scoreReward: 75,
      gravity:     600,
    });

    this.fireCooldown = HA_FIRE_COOLDOWN * 0.5; // shorter initial delay
    this.arrows = [];  // track active arrow projectiles
  }

  getDropTable() {
    return [
      { type: 'mana_shard', chance: HA_DROP_MANA_CHANCE },
    ];
  }

  update(delta, player) {
    super.update(delta, player);
    if (this._dead) return;
    if (this.state === ENEMY_STATE.HURT) return;

    // Tick cooldown
    if (this.fireCooldown > 0) this.fireCooldown -= delta;

    // Always stand still
    this.sprite.body.setVelocityX(0);

    const playerAlive = player && player.gameObject && player.gameObject.active;
    if (!playerAlive) return;

    // Face toward player
    this.facing = player.x > this.sprite.x ? 1 : -1;
    this.sprite.setFlipX(this.facing < 0);

    // Check detection range
    if (this.hDistTo(player) < HA_DETECT_RANGE_X &&
        this.vDistTo(player) < HA_DETECT_RANGE_Y) {
      if (this.fireCooldown <= 0) {
        this._fireArrow(player);
      }
    }

    // Update arrows
    this._updateArrows(delta, player);
  }

  _fireArrow(player) {
    this.fireCooldown = HA_FIRE_COOLDOWN;
    this.state = ENEMY_STATE.ATTACK;

    // Brief attack flash
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(150, () => {
      if (!this._dead) this._restoreTint();
    });

    // Create arrow projectile
    const ax = this.sprite.x + this.facing * 8;
    const ay = this.sprite.y - 10; // mid-body height

    const arrow = this.scene.add.rectangle(ax, ay, 8, 3, 0xddddaa);
    this.scene.physics.add.existing(arrow);
    arrow.body.setAllowGravity(false);
    arrow.body.setVelocityX(this.facing * HA_ARROW_SPEED);
    arrow.body.setSize(8, 3);
    arrow.setDepth(4);

    const arrowData = {
      obj: arrow,
      lifetime: HA_ARROW_LIFETIME,
    };
    this.arrows.push(arrowData);

    // Collide with platforms
    this.scene.physics.add.collider(arrow, this.scene.platforms, () => {
      this._destroyArrow(arrowData);
    });

    // Return to idle after attack
    this.scene.time.delayedCall(200, () => {
      if (this.state === ENEMY_STATE.ATTACK) {
        this.state = ENEMY_STATE.IDLE;
      }
    });
  }

  _updateArrows(delta, player) {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arrowData = this.arrows[i];
      if (!arrowData.obj || !arrowData.obj.active) {
        this.arrows.splice(i, 1);
        continue;
      }

      // Tick lifetime
      arrowData.lifetime -= delta;
      if (arrowData.lifetime <= 0) {
        this._destroyArrow(arrowData);
        this.arrows.splice(i, 1);
        continue;
      }

      // Check overlap with player
      if (player && player.gameObject && player.gameObject.active) {
        const dx = Math.abs(arrowData.obj.x - player.x);
        const dy = Math.abs(arrowData.obj.y - (player.y - 11));
        if (dx < 8 && dy < 12) {
          player.takeDamage(this.damage, arrowData.obj.x);
          this._destroyArrow(arrowData);
          this.arrows.splice(i, 1);
          continue;
        }

        // Jump-over bonus: player is airborne, horizontally close, and above the arrow
        const jumpDy = arrowData.obj.y - player.y;
        if (!arrowData.jumpedOver && dx < 14 &&
            player.sprite && !player.sprite.body.blocked.down &&
            jumpDy > 6 && jumpDy < 28) {
          arrowData.jumpedOver = true;
          GameState.score += 50;
          const popup = this.scene.add.text(player.x, player.y - 20, '+50', {
            fontFamily: 'monospace', fontSize: '7px', color: '#ffdd44',
            stroke: '#000000', strokeThickness: 2,
          }).setOrigin(0.5, 1).setDepth(50);
          this.scene.tweens.add({
            targets: popup, y: popup.y - 16, alpha: 0,
            duration: 800, ease: 'Power2',
            onComplete: () => popup.destroy(),
          });
        }
      }
    }
  }

  _destroyArrow(arrowData) {
    if (arrowData.obj && arrowData.obj.active) {
      arrowData.obj.destroy();
    }
  }

  /** Clean up all arrows on death. */
  _die() {
    // Destroy all active arrows
    for (const ad of this.arrows) {
      this._destroyArrow(ad);
    }
    this.arrows = [];
    super._die();
  }

  _restoreTint() {
    this.sprite.setTint(0x6688aa);
  }
}

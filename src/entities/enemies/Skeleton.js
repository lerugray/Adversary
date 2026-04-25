/**
 * Skeleton.js — HollowSoldier variant that reassembles once after death.
 *
 * Behaviour:
 *   - Same as HollowSoldier but reassembles once when killed
 *   - Unless hit by special attack (placeholder: detect via isSpecialKill flag)
 *   - First death: collapses, reassembles at 1 HP after 1.5s
 *   - Second death: dies permanently
 *   - Drops: nothing on first death, mana shard on second
 *   - XP: 20, Score: 80
 *
 * Phase 4 stub — not spawned in Level 1 but fully functional.
 */

// ── Tuning constants ────────────────────────────────────────────────────────
const SK_PATROL_SPEED    = 30;
const SK_CHASE_SPEED     = 50;
const SK_DETECT_RANGE_X  = 60;
const SK_DETECT_RANGE_Y  = 25;
const SK_ATTACK_RANGE    = 14;
const SK_ATTACK_WINDUP   = 400;
const SK_ATTACK_COOLDOWN = 900;
const SK_EDGE_CHECK_DIST = 6;
const SK_REASSEMBLE_TIME = 1500; // ms

const SK_DROP_MANA_CHANCE = 0.45;

class Skeleton extends EnemyEntity {
  constructor(scene, x, y) {
    super(scene, x, y, {
      width:       10,
      height:      18,
      color:       0xbbbb88,  // bone-yellow
      assetKey:    'oryx_skeleton',
      hp:          1,
      damage:      1,
      xpReward:    20,
      scoreReward: 80,
      gravity:     600,
    });

    this.patrolDir       = 1;
    this.attackCooldown  = 0;
    this.attackWindup    = 0;
    this.isAttacking     = false;
    this._firstDeath     = true;   // tracks whether this is first or second death
    this._reassembling   = false;  // true during reassembly delay
    this._killedBySpecial = false; // flag set if killed by special attack
  }

  getDropTable() {
    if (this._firstDeath) {
      return []; // nothing on first death
    }
    return [
      { type: 'mana_shard', chance: SK_DROP_MANA_CHANCE },
      { type: 'special',    chance: 0.08 },
    ];
  }

  /**
   * Override takeDamage to detect special attack kills.
   * Phase 6+ will set a proper flag; for now we check if player is using special.
   */
  takeDamage(amount, sourceX, isSpecial) {
    if (isSpecial) this._killedBySpecial = true;
    super.takeDamage(amount, sourceX);
  }

  /**
   * Override _die to handle reassembly on first death.
   */
  _die() {
    if (this._firstDeath && !this._killedBySpecial) {
      // First death — collapse but don't truly die
      this._firstDeath   = false;
      this._reassembling = true;
      this.state = ENEMY_STATE.DEAD;
      this.sprite.body.setVelocity(0, 0);

      // Award partial score but no XP on first death
      GameState.score += Math.floor(this.scoreReward * 0.25);

      // Visual: collapse (shrink and fade)
      this.sprite.setTint(0x666644);
      this.sprite.setAlpha(0.4);
      this.sprite.body.enable = false;

      // Reassemble after delay
      this.scene.time.delayedCall(SK_REASSEMBLE_TIME, () => {
        if (!this.sprite || !this.sprite.active) return;
        this._reassemble();
      });
    } else {
      // Second death (or killed by special) — die permanently
      super._die();
    }
  }

  _reassemble() {
    this._reassembling = false;
    this.hp    = 1;
    this.state = ENEMY_STATE.IDLE;
    this._dead = false;

    // Re-enable physics
    this.sprite.body.enable = true;
    this.sprite.body.setAllowGravity(true);

    // Visual: flash back to life
    this.sprite.setAlpha(1);
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(200, () => {
      if (this.sprite && this.sprite.active) {
        this._restoreTint();
      }
    });
  }

  update(delta, player) {
    if (this._reassembling) return; // waiting to reassemble
    super.update(delta, player);
    if (this._skipUpdate) return;
    if (this.state === ENEMY_STATE.HURT) return;

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    if (this.isAttacking) {
      this.attackWindup -= delta;
      this.sprite.body.setVelocityX(0);
      if (this.attackWindup <= 0) this._executeAttack(player);
      return;
    }

    const playerAlive = player && player.gameObject && player.gameObject.active;
    const inRange = playerAlive &&
                    this.hDistTo(player) < SK_DETECT_RANGE_X &&
                    this.vDistTo(player) < SK_DETECT_RANGE_Y;

    if (inRange) {
      this._chase(delta, player);
    } else {
      this._patrol(delta);
    }
  }

  _patrol(delta) {
    this.state = ENEMY_STATE.WALK;
    this.sprite.body.setVelocityX(this.patrolDir * SK_PATROL_SPEED);
    this.facing = this.patrolDir;
    this.sprite.setFlipX(this.patrolDir < 0);

    if (this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
      this.patrolDir *= -1;
    }
    if (this.sprite.body.blocked.down && this._isAtPlatformEdge()) {
      this.patrolDir *= -1;
    }
  }

  _chase(delta, player) {
    this.state = ENEMY_STATE.WALK;
    const dir = player.x > this.sprite.x ? 1 : -1;
    this.facing = dir;
    this.sprite.setFlipX(dir < 0);

    if (this.hDistTo(player) < SK_ATTACK_RANGE && this.attackCooldown <= 0) {
      this._startAttack();
      return;
    }
    if (this.sprite.body.blocked.down && this._isAtPlatformEdge()) {
      this.sprite.body.setVelocityX(0);
      return;
    }
    this.sprite.body.setVelocityX(dir * SK_CHASE_SPEED);
  }

  _startAttack() {
    this.state       = ENEMY_STATE.ATTACK;
    this.isAttacking = true;
    this.attackWindup = SK_ATTACK_WINDUP;
    this.sprite.setTint(0xffaa00);
  }

  _executeAttack(player) {
    this.isAttacking    = false;
    this.attackCooldown = SK_ATTACK_COOLDOWN;
    this.state          = ENEMY_STATE.IDLE;
    this._restoreTint();

    if (player && this.hDistTo(player) < SK_ATTACK_RANGE + 8 &&
        this.vDistTo(player) < SK_DETECT_RANGE_Y) {
      player.takeDamage(this.damage, this.sprite.x);
    }
  }

  _isAtPlatformEdge() {
    const frontX = this.sprite.x + this.facing * SK_EDGE_CHECK_DIST;
    const feetY  = this.sprite.y;
    const platforms = this.scene.currentLevelData.platforms;
    for (const plat of platforms) {
      if (frontX >= plat.x && frontX <= plat.x + plat.w) {
        const dist = plat.y - feetY;
        if (dist >= -4 && dist < 12) return false;
      }
    }
    return true;
  }

  _restoreTint() {
    this.sprite.setTint(0xbbbb88);
  }
}

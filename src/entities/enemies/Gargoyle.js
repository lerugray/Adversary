/**
 * Gargoyle.js — Flying patrol enemy that swoops at the player.
 *
 * Behaviour:
 *   - No gravity — flies between patrolLeft and patrolRight at patrolY altitude
 *   - When player within 80px horizontal AND player below gargoyle: swoops diagonally
 *     toward player at 90px/s, then returns to patrol altitude at 50px/s
 *   - Contact damage only (1 damage on overlap)
 *   - Cannot be hit by low/duck attacks (exposes isHitboxValidAngle for GameScene)
 *   - 2 HP. Drops: mana shard (40% chance)
 *   - XP: 20, Score: 100
 *   - Placeholder visual: 14×10 dark grey-green rectangle
 */

// ── Tuning constants ────────────────────────────────────────────────────────
const GG_PATROL_SPEED      = 40;    // px/s horizontal patrol
const GG_SWOOP_SPEED       = 90;    // px/s diagonal swoop toward player
const GG_RETURN_SPEED      = 50;    // px/s returning to patrol altitude
const GG_DETECT_RANGE_X    = 80;    // horizontal detection range for swoop
const GG_CONTACT_RANGE_X   = 10;    // overlap damage range X
const GG_CONTACT_RANGE_Y   = 8;     // overlap damage range Y
const GG_CONTACT_COOLDOWN  = 800;   // ms between contact damage ticks
const GG_HITBOX_Y_THRESHOLD = 8;    // low attacks below this offset are invalid

const GG_DROP_MANA_CHANCE  = 0.40;

class Gargoyle extends EnemyEntity {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   * @param {Object} config - Must contain patrolLeft, patrolRight, patrolY
   */
  constructor(scene, x, y, config) {
    super(scene, x, y, {
      width:       14,
      height:      10,
      color:       0x4a6644,
      hp:          2,
      damage:      1,
      xpReward:    20,
      scoreReward: 100,
      gravity:     0,
    });

    // Patrol bounds from spawn config
    this.patrolLeft   = (config && config.patrolLeft)  || x - 40;
    this.patrolRight  = (config && config.patrolRight) || x + 40;
    this.patrolY      = (config && config.patrolY)     || y;

    // Flight state
    this.isSwooping         = false;
    this.returningToPatrol  = false;
    this.swoopTargetX       = 0;
    this.swoopTargetY       = 0;

    // Patrol direction
    this.patrolDir = 1;

    // Contact damage cooldown
    this.contactCooldown = 0;

    // Disable gravity (flying enemy)
    this.sprite.body.setAllowGravity(false);

    // Set origin to center since it flies
    this.sprite.setOrigin(0.5, 0.5);
  }

  getDropTable() {
    return [
      { type: 'mana_shard', chance: GG_DROP_MANA_CHANCE },
      { type: 'special',    chance: 0.07 },
    ];
  }

  /**
   * Check if a hitbox Y position is valid for hitting this gargoyle.
   * Returns false if the attack hitbox center Y is more than 8px below
   * the gargoyle center Y (i.e. low/duck attacks cannot hit it).
   * @param {number} hitboxY - Y center of the attack hitbox
   * @returns {boolean}
   */
  isHitboxValidAngle(hitboxY) {
    const gargoyleCenterY = this.sprite.y;
    return hitboxY <= gargoyleCenterY + GG_HITBOX_Y_THRESHOLD;
  }

  update(delta, player) {
    super.update(delta, player);
    if (this._dead) return;
    if (this.state === ENEMY_STATE.HURT) {
      // Still allow hurt state to tick, but stop movement
      this.sprite.body.setVelocity(0, 0);
      return;
    }

    // Tick contact cooldown
    if (this.contactCooldown > 0) this.contactCooldown -= delta;

    const playerAlive = player && player.gameObject && player.gameObject.active;

    if (this.returningToPatrol) {
      this._returnToPatrol(delta);
    } else if (this.isSwooping) {
      this._updateSwoop(delta, player);
    } else {
      // Patrol mode — check for swoop trigger
      if (playerAlive && this._shouldSwoop(player)) {
        this._startSwoop(player);
      } else {
        this._patrol(delta);
      }
    }

    // Contact damage check
    if (playerAlive && this.contactCooldown <= 0) {
      this._checkContactDamage(player);
    }
  }

  _patrol(delta) {
    this.state = ENEMY_STATE.WALK;

    // Horizontal patrol at patrolY altitude
    this.sprite.body.setVelocityX(this.patrolDir * GG_PATROL_SPEED);
    this.sprite.body.setVelocityY(0);

    // Smoothly return to patrol altitude if slightly off
    const yDiff = this.patrolY - this.sprite.y;
    if (Math.abs(yDiff) > 1) {
      this.sprite.body.setVelocityY(yDiff * 2);
    }

    this.facing = this.patrolDir;
    this.sprite.setFlipX(this.patrolDir < 0);

    // Reverse at patrol bounds
    if (this.sprite.x <= this.patrolLeft) {
      this.patrolDir = 1;
    } else if (this.sprite.x >= this.patrolRight) {
      this.patrolDir = -1;
    }
  }

  _shouldSwoop(player) {
    const hDist = Math.abs(this.sprite.x - player.x);
    const playerBelow = player.y > this.sprite.y;
    return hDist < GG_DETECT_RANGE_X && playerBelow;
  }

  _startSwoop(player) {
    this.isSwooping = true;
    this.state = ENEMY_STATE.ATTACK;
    this.swoopTargetX = player.x;
    this.swoopTargetY = player.y - 5; // aim slightly above player feet

    // Tint to telegraph
    this.sprite.setTint(0x88aa66);
  }

  _updateSwoop(delta, player) {
    // Move diagonally toward swoop target
    const dx = this.swoopTargetX - this.sprite.x;
    const dy = this.swoopTargetY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // Reached target — begin return
      this.isSwooping = false;
      this.returningToPatrol = true;
      this._restoreTint();
      return;
    }

    // Normalize and scale to swoop speed
    const nx = dx / dist;
    const ny = dy / dist;
    this.sprite.body.setVelocityX(nx * GG_SWOOP_SPEED);
    this.sprite.body.setVelocityY(ny * GG_SWOOP_SPEED);

    this.facing = dx > 0 ? 1 : -1;
    this.sprite.setFlipX(this.facing < 0);
  }

  _returnToPatrol(delta) {
    this.state = ENEMY_STATE.WALK;

    const dy = this.patrolY - this.sprite.y;

    if (Math.abs(dy) < 3) {
      // Close enough — resume patrol
      this.returningToPatrol = false;
      this.sprite.setY(this.patrolY);
      this.sprite.body.setVelocityY(0);
      return;
    }

    // Rise back to patrol altitude
    const ny = dy < 0 ? -1 : 1;
    this.sprite.body.setVelocityY(ny * GG_RETURN_SPEED);

    // Maintain slight horizontal drift toward patrol center
    const midX = (this.patrolLeft + this.patrolRight) / 2;
    const dxToCenter = midX - this.sprite.x;
    this.sprite.body.setVelocityX(Math.sign(dxToCenter) * GG_PATROL_SPEED * 0.5);
  }

  _checkContactDamage(player) {
    const dx = Math.abs(this.sprite.x - player.x);
    const dy = Math.abs(this.sprite.y - (player.y - 11)); // player mid-body
    if (dx < GG_CONTACT_RANGE_X && dy < GG_CONTACT_RANGE_Y) {
      player.takeDamage(this.damage, this.sprite.x);
      this.contactCooldown = GG_CONTACT_COOLDOWN;
    }
  }

  _restoreTint() {
    this.sprite.setTint(0x4a6644);
  }
}

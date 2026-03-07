/**
 * HollowSoldier.js — Basic melee patrol enemy.
 *
 * Behaviour:
 *   - Walks back and forth on its current platform
 *   - Turns at platform edges and walls
 *   - When player within ~60px horizontally and same vertical tier: pursues + attacks
 *   - Attack: 1 damage with short wind-up
 *   - Drops: mana shard (common), heart (uncommon)
 *   - XP: 10, Score: 50
 */

// ── Tuning constants ────────────────────────────────────────────────────────
const HS_PATROL_SPEED    = 30;   // px/s while patrolling
const HS_CHASE_SPEED     = 50;   // px/s when pursuing player
const HS_DETECT_RANGE_X  = 60;   // horizontal detection range
const HS_DETECT_RANGE_Y  = 25;   // vertical detection range (same tier)
const HS_ATTACK_RANGE    = 14;   // distance to start attack
const HS_ATTACK_WINDUP   = 400;  // ms before hit lands
const HS_ATTACK_COOLDOWN = 900;  // ms between attacks
const HS_EDGE_CHECK_DIST = 6;    // px ahead to check for platform edge

// Drop chances
const HS_DROP_MANA_CHANCE  = 0.45;
const HS_DROP_HEART_CHANCE = 0.15;

class HollowSoldier extends EnemyEntity {
  constructor(scene, x, y) {
    super(scene, x, y, {
      width:       10,
      height:      18,
      color:       0xcc5544,  // rusty red
      hp:          1,
      damage:      1,
      xpReward:    10,
      scoreReward: 50,
      gravity:     600,
    });

    this.patrolDir      = 1;    // 1=right, -1=left
    this.attackCooldown = 0;
    this.attackWindup   = 0;
    this.isAttacking    = false;
  }

  getDropTable() {
    return [
      { type: 'mana_shard', chance: HS_DROP_MANA_CHANCE },
      { type: 'heart',      chance: HS_DROP_HEART_CHANCE },
    ];
  }

  update(delta, player) {
    super.update(delta, player);
    if (this._dead) return;
    if (this.state === ENEMY_STATE.HURT) return;

    // Tick attack cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    // Attack wind-up in progress
    if (this.isAttacking) {
      this.attackWindup -= delta;
      this.sprite.body.setVelocityX(0);
      if (this.attackWindup <= 0) {
        this._executeAttack(player);
      }
      return;
    }

    const playerAlive = player && player.gameObject && player.gameObject.active;
    const inRange = playerAlive &&
                    this.hDistTo(player) < HS_DETECT_RANGE_X &&
                    this.vDistTo(player) < HS_DETECT_RANGE_Y;

    if (inRange && playerAlive) {
      this._chase(delta, player);
    } else {
      this._patrol(delta);
    }
  }

  _patrol(delta) {
    this.state = ENEMY_STATE.WALK;
    this.sprite.body.setVelocityX(this.patrolDir * HS_PATROL_SPEED);
    this.facing = this.patrolDir;
    this.sprite.setFlipX(this.patrolDir < 0);

    // Turn at walls
    if (this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
      this.patrolDir *= -1;
    }

    // Turn at platform edges (only when grounded)
    if (this.sprite.body.blocked.down) {
      if (this._isAtPlatformEdge()) {
        this.patrolDir *= -1;
      }
    }
  }

  _chase(delta, player) {
    this.state = ENEMY_STATE.WALK;
    const dir = player.x > this.sprite.x ? 1 : -1;
    this.facing = dir;
    this.sprite.setFlipX(dir < 0);

    // Close enough to attack?
    if (this.hDistTo(player) < HS_ATTACK_RANGE && this.attackCooldown <= 0) {
      this._startAttack();
      return;
    }

    // Don't walk off edges while chasing
    if (this.sprite.body.blocked.down && this._isAtPlatformEdge()) {
      this.sprite.body.setVelocityX(0);
      return;
    }

    this.sprite.body.setVelocityX(dir * HS_CHASE_SPEED);
  }

  _startAttack() {
    this.state       = ENEMY_STATE.ATTACK;
    this.isAttacking = true;
    this.attackWindup = HS_ATTACK_WINDUP;
    this.sprite.setTint(0xffaa00); // telegraph: orange flash
  }

  _executeAttack(player) {
    this.isAttacking    = false;
    this.attackCooldown = HS_ATTACK_COOLDOWN;
    this.state          = ENEMY_STATE.IDLE;
    this._restoreTint();

    // Check if player is still in range
    if (player && this.hDistTo(player) < HS_ATTACK_RANGE + 8 &&
        this.vDistTo(player) < HS_DETECT_RANGE_Y) {
      player.takeDamage(this.damage, this.sprite.x);
    }
  }

  /**
   * Check if the enemy is about to walk off the edge of its current platform.
   * Casts a ray downward from the front foot.
   */
  _isAtPlatformEdge() {
    const frontX = this.sprite.x + this.facing * HS_EDGE_CHECK_DIST;
    const feetY  = this.sprite.y;

    // Check all level platforms for ground below the front foot
    const platforms = this.scene.currentLevelData.platforms;
    for (const plat of platforms) {
      if (frontX >= plat.x && frontX <= plat.x + plat.w) {
        const dist = plat.y - feetY;
        if (dist >= -4 && dist < 12) {
          return false; // ground exists ahead
        }
      }
    }
    return true; // no ground ahead — edge!
  }

  _restoreTint() {
    this.sprite.setTint(0xcc5544);
  }
}

/**
 * HollowKnight.js — Tougher melee patrol enemy with ladder climbing.
 *
 * Behaviour:
 *   - 3 HP (takes 3 hits to kill)
 *   - Slower than HollowSoldier but deals 2 damage per hit
 *   - Patrols platform, moves toward player when in range (~80px)
 *   - Can use ladders: when patrolling reaches a ladder zone, 40% chance to climb
 *   - Drops: heart (uncommon), weapon/armor (rare ~10%)
 *   - XP: 30, Score: 150
 */

// ── Tuning constants ────────────────────────────────────────────────────────
const HK_PATROL_SPEED    = 22;   // px/s patrolling (slow, heavy)
const HK_CHASE_SPEED     = 38;   // px/s chasing
const HK_DETECT_RANGE_X  = 80;   // horizontal detection range
const HK_DETECT_RANGE_Y  = 25;   // vertical detection range (same tier only)
const HK_ATTACK_RANGE    = 16;   // distance to start attack
const HK_ATTACK_WINDUP   = 550;  // longer windup — telegraphed
const HK_ATTACK_COOLDOWN = 1200; // ms between attacks
const HK_EDGE_CHECK_DIST = 6;
const HK_CLIMB_SPEED     = 35;   // px/s on ladders
const HK_LADDER_CHANCE   = 0.40; // 40% chance to climb when near a ladder

// Drop chances
const HK_DROP_HEART_CHANCE  = 0.25;
const HK_DROP_WEAPON_CHANCE = 0.05;
const HK_DROP_ARMOR_CHANCE  = 0.05;

class HollowKnight extends EnemyEntity {
  constructor(scene, x, y) {
    super(scene, x, y, {
      width:       12,
      height:      22,
      color:       0x885588,  // dark purple
      hp:          3,
      damage:      2,
      xpReward:    30,
      scoreReward: 150,
      gravity:     600,
    });

    this.patrolDir        = 1;
    this.attackCooldown   = 0;
    this.attackWindup     = 0;
    this.isAttacking      = false;

    // Ladder climbing disabled — was causing enemies to freeze on ladders
    this._isClimbing      = false;
    this._climbZone       = null;
    this._climbDirection  = 0;
    this._canUseLadders   = false; // disabled until ladder AI is more robust
  }

  getDropTable() {
    return [
      { type: 'accessory', chance: 0.08 },
      { type: 'special',   chance: 0.10 },
      { type: 'heart',     chance: HK_DROP_HEART_CHANCE },
      { type: 'weapon',    chance: HK_DROP_WEAPON_CHANCE },
      { type: 'armor',     chance: HK_DROP_ARMOR_CHANCE },
    ];
  }

  update(delta, player) {
    super.update(delta, player);
    if (this._skipUpdate) return;
    if (this.state === ENEMY_STATE.HURT) {
      // Exit climb on hurt
      if (this._isClimbing) this._exitLadder();
      return;
    }

    // Tick timers
    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    // Climbing takes priority (currently disabled)
    if (this._isClimbing) {
      this._updateClimbing(delta, player);
      return;
    }

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
                    this.hDistTo(player) < HK_DETECT_RANGE_X &&
                    this.vDistTo(player) < HK_DETECT_RANGE_Y;

    if (inRange && playerAlive) {
      this._chase(delta, player);
    } else {
      this._patrol(delta);
    }
  }

  _patrol(delta) {
    this.state = ENEMY_STATE.WALK;
    this.sprite.body.setVelocityX(this.patrolDir * HK_PATROL_SPEED);
    this.facing = this.patrolDir;
    this.sprite.setFlipX(this.patrolDir < 0);

    // Turn at walls
    if (this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
      this.patrolDir *= -1;
    }

    // Turn at platform edges
    if (this.sprite.body.blocked.down && this._isAtPlatformEdge()) {
      this.patrolDir *= -1;
    }

    // Ladder climbing disabled for now
    // if (this._canUseLadders && this.sprite.body.blocked.down) {
    //   this._tryLadder();
    // }
  }

  _chase(delta, player) {
    this.state = ENEMY_STATE.WALK;
    const dir = player.x > this.sprite.x ? 1 : -1;
    this.facing = dir;
    this.sprite.setFlipX(dir < 0);

    // Close enough to attack?
    if (this.hDistTo(player) < HK_ATTACK_RANGE && this.attackCooldown <= 0) {
      this._startAttack();
      return;
    }

    // Don't walk off edges
    if (this.sprite.body.blocked.down && this._isAtPlatformEdge()) {
      this.sprite.body.setVelocityX(0);
      return;
    }

    this.sprite.body.setVelocityX(dir * HK_CHASE_SPEED);
  }

  _startAttack() {
    this.state       = ENEMY_STATE.ATTACK;
    this.isAttacking = true;
    this.attackWindup = HK_ATTACK_WINDUP;
    this.sprite.setTint(0xff6666); // telegraph: red flash
  }

  _executeAttack(player) {
    this.isAttacking    = false;
    this.attackCooldown = HK_ATTACK_COOLDOWN;
    this.state          = ENEMY_STATE.IDLE;
    this._restoreTint();

    if (player && this.hDistTo(player) < HK_ATTACK_RANGE + 10 &&
        this.vDistTo(player) < HK_DETECT_RANGE_Y) {
      player.takeDamage(this.damage, this.sprite.x);
    }
  }

  // ── Ladder climbing ───────────────────────────────────────────────────────

  _tryLadder() {
    const ladderSystem = this.scene.ladderSystem;
    if (!ladderSystem) return;

    // Check if we're near a ladder zone
    const zone = ladderSystem.getZoneAt(this.sprite.x, this.sprite.y);
    if (!zone) return;

    // 40% chance to climb
    if (Math.random() > HK_LADDER_CHANCE) {
      this._ladderCooldown = 3000; // don't try again for a while
      return;
    }

    // Decide direction: randomly up or down
    const canGoUp   = this.sprite.y > zone.topY + 10;
    const canGoDown = this.sprite.y < zone.bottomY - 10;

    if (canGoUp && canGoDown) {
      this._climbDirection = Math.random() < 0.5 ? -1 : 1;
    } else if (canGoUp) {
      this._climbDirection = -1;
    } else if (canGoDown) {
      this._climbDirection = 1;
    } else {
      return; // can't go anywhere
    }

    this._enterLadder(zone);
  }

  _enterLadder(zone) {
    this._isClimbing = true;
    this._climbZone  = zone;

    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setVelocityX(0);
    this.sprite.setX(zone.x); // snap to ladder center
  }

  _updateClimbing(delta, player) {
    if (!this._climbZone) {
      this._exitLadder();
      return;
    }

    const zone = this._climbZone;
    this.sprite.body.setVelocityX(0);
    this.sprite.body.setVelocityY(this._climbDirection * HK_CLIMB_SPEED);

    // Snap X to ladder center
    this.sprite.setX(Phaser.Math.Linear(this.sprite.x, zone.x, 0.3));

    // Visual feedback: alternate tint
    const phase = Math.floor(Date.now() / 250) % 2;
    this.sprite.setTint(phase === 0 ? 0x885588 : 0x774477);

    // Check if reached top or bottom
    const midY = this.sprite.y - 11;
    if (this._climbDirection < 0 && midY <= zone.topY + 4) {
      // Reached top — dismount
      this.sprite.body.setVelocityY(-20);
      this._exitLadder();
    } else if (this._climbDirection > 0 && this.sprite.y >= zone.bottomY - 4) {
      // Reached bottom — dismount
      this._exitLadder();
    }
  }

  _exitLadder() {
    this._isClimbing = false;
    this._climbZone  = null;
    this._ladderCooldown = 3000;
    this.sprite.body.setAllowGravity(true);
    this._restoreTint();
  }

  _isAtPlatformEdge() {
    const frontX = this.sprite.x + this.facing * HK_EDGE_CHECK_DIST;
    const feetY  = this.sprite.y;
    const platforms = this.scene.currentLevelData.platforms;
    for (const plat of platforms) {
      if (frontX >= plat.x && frontX <= plat.x + plat.w) {
        const dist = plat.y - feetY;
        // Allow small tolerance below surface (physics can push feet 1-2px into platform)
        if (dist >= -4 && dist < 12) return false;
      }
    }
    return true;
  }

  _restoreTint() {
    this.sprite.setTint(0x885588);
  }
}

/**
 * HollowKingBoss.js — The Dark Knight, Level 4 boss.
 *
 * Behaviour:
 *   - Moves like the player: can walk, jump, attack
 *   - 3 attack patterns: Slash (melee), Leap (jump + slam), Charge (dash)
 *   - Loop 2+: gains Shield Bash (close-range AoE knockback)
 *   - Stagger mechanic: hitting all 4 weak points opens a critical window
 *   - Death: dramatic camera shake + screen flash sequence
 *
 * Stats (loop 1):
 *   HP: 20, Damage: 2 (slash), 3 (leap/charge)
 *   XP: 200, Score: 1000
 *
 * Per-loop scaling:
 *   HP +8 per loop, damage +1 per loop, speed +10% per loop
 */

// ── Constants ────────────────────────────────────────────────────────────────
const BOSS_BASE_HP           = 20;
const BOSS_HP_PER_LOOP       = 8;
const BOSS_BASE_DAMAGE       = 2;
const BOSS_HEAVY_DAMAGE      = 3;
const BOSS_DAMAGE_PER_LOOP   = 1;
const BOSS_WALK_SPEED        = 55;
const BOSS_CHASE_SPEED       = 70;
const BOSS_JUMP_VELOCITY     = -300;
const BOSS_CHARGE_SPEED      = 180;
const BOSS_GRAVITY           = 600;
const BOSS_XP_REWARD         = 200;
const BOSS_SCORE_REWARD      = 1000;

// Attack timings
const BOSS_SLASH_WINDUP      = 400;  // ms
const BOSS_SLASH_COOLDOWN    = 800;
const BOSS_LEAP_WINDUP       = 500;
const BOSS_LEAP_COOLDOWN     = 1500;
const BOSS_CHARGE_WINDUP     = 600;
const BOSS_CHARGE_DURATION   = 600;
const BOSS_CHARGE_COOLDOWN   = 2000;
const BOSS_BASH_WINDUP       = 350;
const BOSS_BASH_COOLDOWN     = 1800;
const BOSS_BASH_RANGE        = 30;

// Detection
const BOSS_DETECT_RANGE      = 200;
const BOSS_SLASH_RANGE       = 20;
const BOSS_LEAP_TRIGGER_DIST = 80;

// Stagger
const BOSS_STAGGER_DURATION  = 3000; // ms vulnerable window
const BOSS_STAGGER_MULT      = 2.0;  // damage multiplier during stagger

// ── Boss AI states ───────────────────────────────────────────────────────────
const BOSS_AI = {
  IDLE:      'boss_idle',
  WALK:      'boss_walk',
  SLASH:     'boss_slash',
  LEAP:      'boss_leap',
  CHARGE:    'boss_charge',
  BASH:      'boss_bash',
  STAGGER:   'boss_stagger',
  DYING:     'boss_dying',
};

class HollowKingBoss extends EnemyEntity {
  constructor(scene, x, y) {
    const loop = GameState.currentLoop || 1;
    const loopScale = 1 + (loop - 1) * 0.1; // 10% speed increase per loop

    const hp = BOSS_BASE_HP + (loop - 1) * BOSS_HP_PER_LOOP;

    super(scene, x, y, {
      width:       16,
      height:      26,
      color:       0x442244,  // deep purple — the Dark Knight
      hp:          hp,
      damage:      BOSS_BASE_DAMAGE + (loop - 1) * BOSS_DAMAGE_PER_LOOP,
      xpReward:    BOSS_XP_REWARD,
      scoreReward: BOSS_SCORE_REWARD,
      gravity:     BOSS_GRAVITY,
    });

    // Boss must stay inside the arena
    this.sprite.setCollideWorldBounds(true);

    // ── Loop-scaled values ────────────────────────────────────────────
    this._loop          = loop;
    this._loopScale     = loopScale;
    this._heavyDamage   = BOSS_HEAVY_DAMAGE + (loop - 1) * BOSS_DAMAGE_PER_LOOP;
    this._walkSpeed     = Math.floor(BOSS_WALK_SPEED * loopScale);
    this._chaseSpeed    = Math.floor(BOSS_CHASE_SPEED * loopScale);
    this._chargeSpeed   = Math.floor(BOSS_CHARGE_SPEED * loopScale);

    // ── AI state ──────────────────────────────────────────────────────
    this._aiState       = BOSS_AI.IDLE;
    this._aiTimer       = 1000; // initial delay before first action
    this._attackCooldown = 0;
    this._chargeTimer   = 0;
    this._chargeDirX    = 0;

    // ── Stagger state ─────────────────────────────────────────────────
    this._isStaggered   = false;
    this._staggerTimer  = 0;

    // ── Action selection weights ──────────────────────────────────────
    this._lastAction    = null;

    // ── Death animation flag ──────────────────────────────────────────
    this._deathSequenceStarted = false;
  }

  getDropTable() {
    return [
      { type: 'accessory', chance: 0.30 },
      { type: 'heart',     chance: 1.0 },
      { type: 'weapon',    chance: 0.4 },
      { type: 'armor',     chance: 0.4 },
    ];
  }

  // ── Override takeDamage to support stagger multiplier ───────────────────

  takeDamage(amount, sourceX) {
    if (this._dead) return;
    if (this._aiState === BOSS_AI.DYING) return;

    // Stagger multiplier
    let finalDmg = amount;
    if (this._isStaggered) {
      finalDmg = Math.ceil(amount * BOSS_STAGGER_MULT);
    }

    this.hp -= finalDmg;

    if (this.hp <= 0) {
      this.hp = 0;
      this._startDeathSequence();
      return;
    }

    // Boss has NO hurt-stun from normal hits (unless staggered)
    if (this._isStaggered) {
      // Light knockback during stagger
      const dir = this.sprite.x >= sourceX ? 1 : -1;
      this.sprite.body.setVelocityX(dir * 40);
    }

    // Flash white briefly
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (!this._dead) this._restoreTint();
    });
  }

  // ── Stagger (triggered by GameScene when all 4 weak points hit) ────────

  triggerStagger() {
    if (this._dead || this._isStaggered) return;

    this._isStaggered  = true;
    this._staggerTimer = BOSS_STAGGER_DURATION;
    this._aiState      = BOSS_AI.STAGGER;

    // Stop all movement
    this.sprite.body.setVelocity(0, 0);

    // Visual: flash yellow to indicate vulnerability
    this.sprite.setTint(0xffff44);
  }

  _endStagger() {
    this._isStaggered = false;
    this._aiState     = BOSS_AI.IDLE;
    this._aiTimer     = 500;
    this._restoreTint();
  }

  // ── Death sequence ─────────────────────────────────────────────────────

  _startDeathSequence() {
    if (this._deathSequenceStarted) return;
    this._deathSequenceStarted = true;

    this._dead    = true;
    this._aiState = BOSS_AI.DYING;
    this.state    = ENEMY_STATE.DEAD;

    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.enable = false;

    // Award XP and score
    GameState.player.xp += this.xpReward;
    GameState.score     += this.scoreReward;

    // Drop items
    if (this.scene.itemSystem) {
      this.scene.itemSystem.rollDrop(this.sprite.x, this.sprite.y, this.getDropTable());
    }

    // Dramatic multi-flash death over 1.5s
    const flashColors = [0xffffff, 0xff4444, 0xffffff, 0xffaa00, 0xffffff];
    flashColors.forEach((color, i) => {
      this.scene.time.delayedCall(i * 300, () => {
        if (this.sprite && this.sprite.active) {
          this.sprite.setTint(color);
          this.scene.cameras.main.shake(200, 0.01);
        }
      });
    });

    // Final explosion flash and destroy
    this.scene.time.delayedCall(1500, () => {
      this.scene.cameras.main.flash(400, 255, 200, 100, false);
      this.scene.cameras.main.shake(500, 0.02);

      if (this.sprite && this.sprite.active) {
        this.scene.tweens.add({
          targets: this.sprite,
          alpha: 0, scaleX: 2, scaleY: 2,
          duration: 400,
          onComplete: () => { if (this.sprite) this.sprite.destroy(); }
        });
      }
    });
  }

  // ── Override base _die to use death sequence instead ────────────────────

  _die() {
    this._startDeathSequence();
  }

  // ── Main update ────────────────────────────────────────────────────────

  update(delta, player) {
    if (this._dead || !this.sprite || !this.sprite.active || !this.sprite.body) return;

    // Tick stagger
    if (this._isStaggered) {
      this._staggerTimer -= delta;
      // Blink during stagger
      const blink = Math.floor(Date.now() / 150) % 2;
      this.sprite.setTint(blink === 0 ? 0xffff44 : 0xffdd00);

      if (this._staggerTimer <= 0) {
        this._endStagger();
      }
      return;
    }

    // Tick cooldown
    if (this._attackCooldown > 0) this._attackCooldown -= delta;

    const playerAlive = player && player.gameObject && player.gameObject.active && player.state !== 'dead';
    if (!playerAlive) {
      this.sprite.body.setVelocityX(0);
      return;
    }

    // ── AI state machine ─────────────────────────────────────────────
    switch (this._aiState) {
      case BOSS_AI.IDLE:
        this._updateIdle(delta, player);
        break;
      case BOSS_AI.WALK:
        this._updateWalk(delta, player);
        break;
      case BOSS_AI.SLASH:
        this._updateSlash(delta, player);
        break;
      case BOSS_AI.LEAP:
        this._updateLeap(delta, player);
        break;
      case BOSS_AI.CHARGE:
        this._updateCharge(delta, player);
        break;
      case BOSS_AI.BASH:
        this._updateBash(delta, player);
        break;
    }

    // ── Contact damage (always active unless staggered/dying) ────────
    if (this._aiState !== BOSS_AI.STAGGER && this._aiState !== BOSS_AI.DYING) {
      this._checkContactDamage(player);
    }
  }

  // ── AI: Idle (decide next action) ──────────────────────────────────────

  _updateIdle(delta, player) {
    this._aiTimer -= delta;
    this.sprite.body.setVelocityX(0);

    // Face player
    this.facing = player.x > this.sprite.x ? 1 : -1;
    this.sprite.setFlipX(this.facing < 0);

    if (this._aiTimer <= 0) {
      this._chooseAction(player);
    }
  }

  _chooseAction(player) {
    const hDist = this.hDistTo(player);
    const grounded = this.sprite.body.blocked.down;

    // Close range: slash or bash
    if (hDist < BOSS_SLASH_RANGE && grounded && this._attackCooldown <= 0) {
      // Loop 2+ has a chance to shield bash instead
      if (this._loop >= 2 && Math.random() < 0.35 && this._lastAction !== 'bash') {
        this._startBash(player);
        return;
      }
      this._startSlash(player);
      return;
    }

    // Mid range: charge or leap
    if (hDist > BOSS_SLASH_RANGE && hDist < BOSS_DETECT_RANGE && this._attackCooldown <= 0) {
      const roll = Math.random();

      if (roll < 0.4 && grounded && this._lastAction !== 'charge') {
        this._startCharge(player);
        return;
      }
      if (roll < 0.7 && grounded && this._lastAction !== 'leap') {
        this._startLeap(player);
        return;
      }
    }

    // Default: walk toward player
    this._aiState = BOSS_AI.WALK;
  }

  // ── AI: Walk toward player ─────────────────────────────────────────────

  _updateWalk(delta, player) {
    this.facing = player.x > this.sprite.x ? 1 : -1;
    this.sprite.setFlipX(this.facing < 0);

    this.sprite.body.setVelocityX(this.facing * this._chaseSpeed);

    const hDist = this.hDistTo(player);

    // Close enough to attack?
    if (hDist < BOSS_SLASH_RANGE && this._attackCooldown <= 0) {
      this._aiState = BOSS_AI.IDLE;
      this._aiTimer = 100;
      return;
    }

    // At a distance worth leaping/charging?
    if (hDist > BOSS_LEAP_TRIGGER_DIST && this._attackCooldown <= 0 && Math.random() < 0.02) {
      this._aiState = BOSS_AI.IDLE;
      this._aiTimer = 0;
    }
  }

  // ── AI: Slash (melee attack) ───────────────────────────────────────────

  _startSlash(player) {
    this._aiState   = BOSS_AI.SLASH;
    this._aiTimer   = BOSS_SLASH_WINDUP;
    this._lastAction = 'slash';
    this.sprite.body.setVelocityX(0);

    // Telegraph: red tint
    this.sprite.setTint(0xff4444);
  }

  _updateSlash(delta, player) {
    this._aiTimer -= delta;

    if (this._aiTimer <= 0) {
      // Execute slash
      this._restoreTint();
      this._attackCooldown = BOSS_SLASH_COOLDOWN;

      // Hit check
      if (this.hDistTo(player) < BOSS_SLASH_RANGE + 10 &&
          this.vDistTo(player) < 30) {
        player.takeDamage(this.damage, this.sprite.x);
      }

      // Brief lunge forward
      this.sprite.body.setVelocityX(this.facing * 60);
      this.scene.time.delayedCall(150, () => {
        if (!this._dead) this.sprite.body.setVelocityX(0);
      });

      this._aiState = BOSS_AI.IDLE;
      this._aiTimer = 400;
    }
  }

  // ── AI: Leap (jump + slam) ─────────────────────────────────────────────

  _startLeap(player) {
    this._aiState   = BOSS_AI.LEAP;
    this._aiTimer   = BOSS_LEAP_WINDUP;
    this._lastAction = 'leap';
    this.sprite.body.setVelocityX(0);

    // Telegraph: crouch + orange tint
    this.sprite.setTint(0xff8800);
  }

  _updateLeap(delta, player) {
    this._aiTimer -= delta;

    if (this._aiTimer <= 0 && this._aiTimer + delta > 0) {
      // Launch into air toward player
      const dir = player.x > this.sprite.x ? 1 : -1;
      this.sprite.body.setVelocityY(BOSS_JUMP_VELOCITY);
      this.sprite.body.setVelocityX(dir * this._chaseSpeed * 1.2);
      this._attackCooldown = BOSS_LEAP_COOLDOWN;
    }

    // Check landing
    if (this._aiTimer < -200 && this.sprite.body.blocked.down) {
      // Slam damage on landing
      this._restoreTint();

      if (this.hDistTo(player) < 30 && this.vDistTo(player) < 20) {
        player.takeDamage(this._heavyDamage, this.sprite.x);
      }

      // Screen shake on landing
      this.scene.cameras.main.shake(200, 0.008);

      this._aiState = BOSS_AI.IDLE;
      this._aiTimer = 600;
    }
  }

  // ── AI: Charge (dash across arena) ─────────────────────────────────────

  _startCharge(player) {
    this._aiState     = BOSS_AI.CHARGE;
    this._aiTimer     = BOSS_CHARGE_WINDUP;
    this._chargeTimer = BOSS_CHARGE_DURATION;
    this._chargeDirX  = player.x > this.sprite.x ? 1 : -1;
    this._lastAction  = 'charge';
    this.sprite.body.setVelocityX(0);

    // Telegraph: flash white + pause
    this.sprite.setTint(0xffffff);
  }

  _updateCharge(delta, player) {
    // Windup phase
    if (this._aiTimer > 0) {
      this._aiTimer -= delta;
      this.sprite.body.setVelocityX(0);

      // Blink during windup
      const blink = Math.floor(Date.now() / 100) % 2;
      this.sprite.setTint(blink === 0 ? 0xffffff : 0xff4444);

      if (this._aiTimer <= 0) {
        // Begin charge
        this.sprite.setTint(0xff2222);
      }
      return;
    }

    // Active charge phase
    this._chargeTimer -= delta;
    this.sprite.body.setVelocityX(this._chargeDirX * this._chargeSpeed);

    // Hit player during charge
    if (this.hDistTo(player) < 14 && this.vDistTo(player) < 20) {
      player.takeDamage(this._heavyDamage, this.sprite.x);
    }

    // End charge on wall hit or timer
    if (this._chargeTimer <= 0 ||
        this.sprite.body.blocked.left ||
        this.sprite.body.blocked.right) {
      this.sprite.body.setVelocityX(0);
      this._restoreTint();
      this._attackCooldown = BOSS_CHARGE_COOLDOWN;
      this._aiState = BOSS_AI.IDLE;
      this._aiTimer = 800;

      // Wall hit: brief self-stun
      if (this.sprite.body.blocked.left || this.sprite.body.blocked.right) {
        this._aiTimer = 1200;
        this.sprite.setTint(0x888888);
        this.scene.time.delayedCall(400, () => {
          if (!this._dead) this._restoreTint();
        });
      }
    }
  }

  // ── AI: Shield Bash (loop 2+ only, close-range AoE knockback) ─────────

  _startBash(player) {
    this._aiState   = BOSS_AI.BASH;
    this._aiTimer   = BOSS_BASH_WINDUP;
    this._lastAction = 'bash';
    this.sprite.body.setVelocityX(0);

    // Telegraph: blue-white flash
    this.sprite.setTint(0x88aaff);
  }

  _updateBash(delta, player) {
    this._aiTimer -= delta;

    if (this._aiTimer <= 0) {
      this._restoreTint();
      this._attackCooldown = BOSS_BASH_COOLDOWN;

      // AoE hit in radius around boss
      if (this.distanceTo(player) < BOSS_BASH_RANGE) {
        player.takeDamage(this.damage, this.sprite.x);
      }

      // Visual burst
      const burst = this.scene.add.circle(this.sprite.x, this.sprite.y - 13, BOSS_BASH_RANGE, 0x88aaff, 0.4)
        .setDepth(8);
      this.scene.tweens.add({
        targets: burst,
        alpha: 0, scaleX: 1.8, scaleY: 1.8,
        duration: 250,
        onComplete: () => burst.destroy(),
      });

      this._aiState = BOSS_AI.IDLE;
      this._aiTimer = 500;
    }
  }

  // ── Contact damage ─────────────────────────────────────────────────────

  _checkContactDamage(player) {
    if (player.isInvincible || player.state === 'dead') return;

    const dx = Math.abs(this.sprite.x - player.x);
    const dy = Math.abs((this.sprite.y - 13) - (player.y - 11));

    if (dx < 12 && dy < 16) {
      player.takeDamage(this.damage, this.sprite.x);
    }
  }

  // ── Tint ───────────────────────────────────────────────────────────────

  _restoreTint() {
    this.sprite.setTint(0x442244);
  }
}

/**
 * Mimic.js — Chest-disguised enemy (Phase 6).
 *
 * Starts looking identical to a normal chest (brown rectangle, no AI).
 * Two ways to engage:
 *   1. Player ATTACKS the chest first  -> takes damage like a normal enemy
 *      (stays in place, can be killed before it wakes up).
 *   2. Player TOUCHES the chest first  -> heavy damage hit to player,
 *      then transforms into a fast, aggressive melee enemy.
 *
 * Defeating a mimic guarantees a rare or better drop.
 * Mimic frequency increases with each loop.
 *
 * Subtle tell: the mimic "breathes" — a very slight scale pulse that
 * normal chests don't have. Observant players can spot it.
 */

// ── Mimic tuning ────────────────────────────────────────────────────────────
const MIMIC_CHEST_W       = 12;
const MIMIC_CHEST_H       = 10;
const MIMIC_CHEST_COLOR   = 0x8B6914;  // same brown as normal chests

const MIMIC_ACTIVE_W      = 14;
const MIMIC_ACTIVE_H      = 16;
const MIMIC_ACTIVE_COLOR  = 0xAA3333;  // dark red when transformed

const MIMIC_HP            = 4;
const MIMIC_DAMAGE        = 2;         // contact damage when active
const MIMIC_AMBUSH_DAMAGE = 3;         // damage dealt on surprise touch
const MIMIC_XP            = 40;
const MIMIC_SCORE         = 200;

const MIMIC_CHASE_SPEED   = 70;        // faster than most enemies
const MIMIC_DETECT_RANGE  = 90;
const MIMIC_ATTACK_RANGE  = 14;
const MIMIC_ATTACK_WINDUP = 350;
const MIMIC_ATTACK_COOLDOWN = 800;
const MIMIC_EDGE_CHECK    = 6;

// Mimic states (extends ENEMY_STATE)
const MIMIC_STATE = {
  CHEST:     'chest',      // disguised, no AI
  WAKING:    'waking',     // transformation animation
  ACTIVE:    'active',     // fully awake, chasing
};

class Mimic extends EnemyEntity {
  constructor(scene, x, y) {
    // Start as a chest-sized sprite
    super(scene, x, y, {
      width:       MIMIC_CHEST_W,
      height:      MIMIC_CHEST_H,
      color:       MIMIC_CHEST_COLOR,
      hp:          MIMIC_HP,
      damage:      MIMIC_DAMAGE,
      xpReward:    MIMIC_XP,
      scoreReward: MIMIC_SCORE,
      gravity:     600,
    });

    this.mimicState     = MIMIC_STATE.CHEST;
    this.attackCooldown = 0;
    this.attackWindup   = 0;
    this.isAttacking    = false;
    this.wakeTimer      = 0;

    // Subtle tell: very slight breathing pulse (normal chests don't have this)
    this._breathTween = scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.03,
      scaleY: 0.97,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // While in chest form, don't move
    this.sprite.body.setAllowGravity(true);
    this.sprite.body.setImmovable(true);
  }

  // ── Drop table: guaranteed rare+ drop ───────────────────────────────────
  getDropTable() {
    return [
      { type: 'accessory', chance: 0.20 },
      { type: 'weapon',    chance: 0.45 },
      { type: 'armor',     chance: 0.45 },
      { type: 'heart',     chance: 1.0 },  // fallback: always a heart at minimum
    ];
  }

  // ── Override takeDamage to handle chest state ───────────────────────────
  takeDamage(amount, sourceX) {
    if (this._dead) return;

    // If still in chest form, wake up on hit (player attacked first = good)
    if (this.mimicState === MIMIC_STATE.CHEST) {
      this._wake();
    }

    // Apply damage normally
    super.takeDamage(amount, sourceX);
  }

  // ── Contact check: called by ChestSystem before normal enemy contact ────
  /**
   * Check if player is touching this mimic while it's still disguised.
   * Returns true if ambush triggered (caller should skip normal contact).
   */
  checkAmbush(player) {
    if (this.mimicState !== MIMIC_STATE.CHEST) return false;
    if (this._dead) return false;
    if (player.isInvincible || player.state === 'dead') return false;

    const px = player.x;
    const py = player.y - 11;
    const ex = this.sprite.x;
    const ey = this.sprite.y - this.sprite.body.height / 2;

    if (Math.abs(px - ex) < 10 && Math.abs(py - ey) < 12) {
      // Ambush! Heavy damage to player
      player.takeDamage(MIMIC_AMBUSH_DAMAGE, this.sprite.x);

      // Wake up
      this._wake();
      return true;
    }
    return false;
  }

  // ── Transformation ──────────────────────────────────────────────────────
  _wake() {
    if (this.mimicState !== MIMIC_STATE.CHEST) return;
    this.mimicState = MIMIC_STATE.WAKING;
    this.wakeTimer = 500; // brief transformation

    // Stop breathing
    if (this._breathTween) {
      this._breathTween.stop();
      this._breathTween = null;
    }

    // Visual: flash red/white rapidly
    this.sprite.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 150,
      yoyo: true,
      repeat: 1,
    });

    // Camera shake to signal danger
    this.scene.cameras.main.shake(200, 0.005);

    // Allow movement
    this.sprite.body.setImmovable(false);
  }

  _finishWake() {
    this.mimicState = MIMIC_STATE.ACTIVE;

    // Rebuild sprite to active (larger) size
    const oldX = this.sprite.x;
    const oldY = this.sprite.y;

    // Resize the body to the active dimensions
    this.sprite.body.setSize(MIMIC_ACTIVE_W, MIMIC_ACTIVE_H);

    // Change color to active (red)
    const key = `enemy_${MIMIC_ACTIVE_COLOR}_${MIMIC_ACTIVE_W}x${MIMIC_ACTIVE_H}`;
    if (!this.scene.textures.exists(key)) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(MIMIC_ACTIVE_COLOR);
      gfx.fillRect(0, 0, MIMIC_ACTIVE_W, MIMIC_ACTIVE_H);
      gfx.generateTexture(key, MIMIC_ACTIVE_W, MIMIC_ACTIVE_H);
      gfx.destroy();
    }
    this.sprite.setTexture(key);
    this.sprite.setTint(0xAA3333);

    // Brief invincibility after transform so it doesn't die instantly
    this.state = ENEMY_STATE.IDLE;
  }

  // ── Update ──────────────────────────────────────────────────────────────
  update(delta, player) {
    super.update(delta, player);
    if (this._dead) return;

    // In chest form: do nothing (just sit there)
    if (this.mimicState === MIMIC_STATE.CHEST) {
      this.sprite.body.setVelocityX(0);
      return;
    }

    // Waking animation
    if (this.mimicState === MIMIC_STATE.WAKING) {
      this.wakeTimer -= delta;
      this.sprite.body.setVelocityX(0);
      if (this.wakeTimer <= 0) {
        this._finishWake();
      }
      return;
    }

    // ── Active AI (aggressive chase + attack) ─────────────────────────
    if (this.state === ENEMY_STATE.HURT) return;

    // Tick attack cooldown
    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    // Attack wind-up
    if (this.isAttacking) {
      this.attackWindup -= delta;
      this.sprite.body.setVelocityX(0);
      if (this.attackWindup <= 0) {
        this._executeAttack(player);
      }
      return;
    }

    const playerAlive = player && player.gameObject && player.gameObject.active;
    if (!playerAlive) {
      this.sprite.body.setVelocityX(0);
      return;
    }

    // Always chase when active
    this._chase(delta, player);
  }

  _chase(delta, player) {
    this.state = ENEMY_STATE.WALK;
    const dir = player.x > this.sprite.x ? 1 : -1;
    this.facing = dir;
    this.sprite.setFlipX(dir < 0);

    // Close enough to attack?
    if (this.hDistTo(player) < MIMIC_ATTACK_RANGE && this.attackCooldown <= 0) {
      this._startAttack();
      return;
    }

    // Don't walk off edges
    if (this.sprite.body.blocked.down && this._isAtPlatformEdge()) {
      this.sprite.body.setVelocityX(0);
      return;
    }

    this.sprite.body.setVelocityX(dir * MIMIC_CHASE_SPEED);
  }

  _startAttack() {
    this.state       = ENEMY_STATE.ATTACK;
    this.isAttacking = true;
    this.attackWindup = MIMIC_ATTACK_WINDUP;
    this.sprite.setTint(0xff4400);
  }

  _executeAttack(player) {
    this.isAttacking    = false;
    this.attackCooldown = MIMIC_ATTACK_COOLDOWN;
    this.state          = ENEMY_STATE.IDLE;
    this._restoreTint();

    if (player && this.hDistTo(player) < MIMIC_ATTACK_RANGE + 8 &&
        this.vDistTo(player) < 20) {
      player.takeDamage(this.damage, this.sprite.x);
    }
  }

  _isAtPlatformEdge() {
    const frontX = this.sprite.x + this.facing * MIMIC_EDGE_CHECK;
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
    if (this.mimicState === MIMIC_STATE.ACTIVE) {
      this.sprite.setTint(MIMIC_ACTIVE_COLOR);
    } else {
      this.sprite.setTint(MIMIC_CHEST_COLOR);
    }
  }
}

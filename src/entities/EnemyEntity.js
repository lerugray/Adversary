/**
 * EnemyEntity.js — Base class for all enemies in ADVERSARY.
 *
 * Phase 4: Provides the shared skeleton that every enemy type extends.
 *
 * Handles:
 *   - Physics sprite (colored rectangle placeholder)
 *   - HP, damage, XP reward, score reward
 *   - State machine: IDLE → WALK → ATTACK → HURT → DEAD
 *   - takeDamage(amount) — subtract HP, trigger hurt, check death
 *   - Death: flash, drop items via ItemSystem, award XP/score, destroy
 *   - Knockback (lighter than player knockback)
 *   - Platform collision (passed from GameScene)
 *
 * Usage:
 *   class HollowSoldier extends EnemyEntity { ... }
 */

// ── Enemy states ────────────────────────────────────────────────────────────
const ENEMY_STATE = {
  IDLE:   'idle',
  WALK:   'walk',
  ATTACK: 'attack',
  HURT:   'hurt',
  DEAD:   'dead',
};

// ── Knockback constants (lighter than player) ───────────────────────────────
const ENEMY_KNOCKBACK_VX = 80;
const ENEMY_KNOCKBACK_VY = -100;
const ENEMY_HURT_DURATION = 300;  // ms in hurt state

class EnemyEntity {
  /**
   * @param {Phaser.Scene} scene
   * @param {number}  x          - Spawn X (world)
   * @param {number}  y          - Spawn Y (world, feet)
   * @param {Object}  config     - { width, height, color, hp, damage, xpReward, scoreReward, gravity }
   */
  constructor(scene, x, y, config) {
    this.scene = scene;

    // ── Stats ────────────────────────────────────────────────────────────
    this.hp          = config.hp          || 1;
    this.maxHp       = config.hp          || 1;
    this.damage      = config.damage      || 1;
    this.xpReward    = config.xpReward != null ? config.xpReward : 10;
    this.scoreReward = config.scoreReward || 50;
    this.invulnerable = config.invulnerable === true;

    // ── State machine ───────────────────────────────────────────────────
    this.state    = ENEMY_STATE.IDLE;
    this.facing   = -1;  // -1 = left, 1 = right
    this._dead    = false;

    // ── Timers ──────────────────────────────────────────────────────────
    this.hurtTimer   = 0;
    this.attackTimer = 0;

    // ── Build physics sprite ────────────────────────────────────────────
    this._buildSprite(x, y, config);
  }

  // ── Construction ────────────────────────────────────────────────────────

  _buildSprite(x, y, config) {
    const w = config.width  || 10;
    const h = config.height || 20;
    const color = config.color || 0xff4444;

    let key = config.assetKey;

    // Generate a simple colored rectangle texture if no loaded sprite fits.
    if (!key || !this.scene.textures.exists(key)) {
      key = `enemy_${color}_${w}x${h}`;
    }
    if (!this.scene.textures.exists(key)) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(color);
      gfx.fillRect(0, 0, w, h);
      gfx.generateTexture(key, w, h);
      gfx.destroy();
    }

    this.sprite = this.scene.physics.add.sprite(x, y, key);
    this.sprite.setOrigin(0.5, 1);  // pivot at feet
    this.sprite.setCollideWorldBounds(false);

    // Physics body
    this.sprite.body.setSize(w, h);
    this.sprite.body.setOffset(0, 0);
    this.sprite.body.setGravityY(config.gravity ?? 600);

    // Store reference back to entity for collision callbacks
    this.sprite.parentEnemy = this;
  }

  // ── Public accessors ──────────────────────────────────────────────────────

  get gameObject() { return this.sprite; }
  get body()       { return this.sprite.body; }
  get isDead()     { return this._dead; }
  get x()          { return this.sprite.x; }
  get y()          { return this.sprite.y; }

  // ── Damage ────────────────────────────────────────────────────────────────

  /**
   * Called when this enemy is hit by the player.
   * @param {number} amount  - Damage to deal
   * @param {number} sourceX - X position of damage source (for knockback direction)
   */
  takeDamage(amount, sourceX) {
    if (this._dead || this.state === ENEMY_STATE.HURT) return;
    if (this.invulnerable) {
      this.sprite.setTint(0xffffff);
      this.scene.time.delayedCall(80, () => this._restoreTint());
      return;
    }

    this.hp -= amount;

    if (this.hp <= 0) {
      this._die();
      return;
    }

    // ── Hurt state ──────────────────────────────────────────────────────
    this.state     = ENEMY_STATE.HURT;
    this.hurtTimer = ENEMY_HURT_DURATION;

    // Knockback away from source
    const dir = this.sprite.x >= sourceX ? 1 : -1;
    this.sprite.body.setVelocityX(dir * ENEMY_KNOCKBACK_VX);
    this.sprite.body.setVelocityY(ENEMY_KNOCKBACK_VY);

    // Flash white
    this.sprite.setTint(0xffffff);
  }

  // ── Death ─────────────────────────────────────────────────────────────────

  _die() {
    this._dead = true;
    this.state = ENEMY_STATE.DEAD;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.enable = false;

    // Award XP and score
    GameState.player.xp += this.xpReward;
    GameState.score     += this.scoreReward;

    // Drop items via ItemSystem (if present on scene)
    if (this.scene.itemSystem) {
      this.scene.itemSystem.rollDrop(this.sprite.x, this.sprite.y, this.getDropTable());
    }

    // Death flash then fade and destroy
    this.sprite.setTint(0xffffff);
    this.scene.tweens.add({
      targets:  this.sprite,
      alpha:    0,
      duration: 400,
      ease:     'Power2',
      onComplete: () => {
        this.sprite.destroy();
      }
    });
  }

  /**
   * Override in subclasses to define drop tables.
   * Returns an array of { type, chance } objects.
   * @returns {Array<{type: string, chance: number}>}
   */
  getDropTable() {
    return [
      { type: 'special',    chance: 0.05 },
      { type: 'accessory',  chance: 0.03 },
      { type: 'mana_shard', chance: 0.4 },
    ];
  }

  // ── Base update ───────────────────────────────────────────────────────────

  /**
   * Called every frame by EnemyManager.
   * Subclasses should call super.update(delta, player) then add their AI.
   * @param {number} delta  - ms since last frame
   * @param {PlayerEntity} player
   */
  update(delta, player) {
    if (this._dead || !this.sprite || !this.sprite.active || !this.sprite.body) {
      this._skipUpdate = true;
      return;
    }
    this._skipUpdate = false;

    // Tick hurt timer
    if (this.state === ENEMY_STATE.HURT) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.state = ENEMY_STATE.IDLE;
        this._restoreTint();
      }
    }
  }

  /**
   * Restore to the enemy's default tint. Override in subclasses.
   */
  _restoreTint() {
    this.sprite.clearTint();
  }

  /**
   * Utility: distance to another entity (for range checks).
   */
  distanceTo(entity) {
    const dx = this.sprite.x - entity.x;
    const dy = this.sprite.y - entity.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Utility: horizontal distance to player.
   */
  hDistTo(entity) {
    return Math.abs(this.sprite.x - entity.x);
  }

  /**
   * Utility: vertical distance to player.
   */
  vDistTo(entity) {
    return Math.abs(this.sprite.y - entity.y);
  }
}

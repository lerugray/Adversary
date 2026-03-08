/**
 * PlayerEntity.js — Self-contained player logic for ADVERSARY.
 *
 * Phase 2 implements:
 *   - Castlevania-weight movement (left/right, duck, no movement while ducking)
 *   - Single jump with variable height (hold Z for higher jump)
 *   - Attack system: standing, ducking (low), air, plunging (Down+X in air)
 *   - Special attack (Up+X) with 6-type architecture stub
 *   - Hit reaction with Castlevania-style knockback + i-frames
 *   - Death & Soul Orb system synced to GameState
 *
 * Usage:
 *   // In GameScene.create():
 *   this.player = new PlayerEntity(this, spawnX, spawnY);
 *
 *   // In GameScene.update(time, delta):
 *   this.player.update(this.inputManager, delta);
 *
 * All stat reads/writes go through GameState.player for scene persistence.
 */

// ── Constants ──────────────────────────────────────────────────────────────

/** Horizontal walk speed (px/s). Donkey Kong feel — slow, deliberate. */
const PLAYER_SPEED        = 50;

/** Jump impulse (initial upward velocity). Donkey Kong — barely a hop. */
const JUMP_VELOCITY       = -155;

/** Extra upward boost per frame while holding jump (variable jump). */
const JUMP_HOLD_FORCE     = -4;

/** Max frames the jump-hold boost is applied. */
const JUMP_HOLD_MAX_FRAMES = 3;

/** Gravity applied to the player body (px/s²). */
const PLAYER_GRAVITY      = 650;

/** Plunging attack downward velocity. */
const PLUNGE_VELOCITY     = 160;

/** Knockback velocities on taking a hit. X is in the away-direction. */
const KNOCKBACK_VX        = 60;
const KNOCKBACK_VY        = -90;

/** Invincibility frame duration in milliseconds (~1.5 s). */
const IFRAME_DURATION     = 1500;

/** Attack cooldown in milliseconds (prevents button-mashing spam). */
const ATTACK_COOLDOWN     = 400;

/** Hitbox active duration in milliseconds. */
const HITBOX_DURATION     = 200;

/** Mana cost for special attack. */
const SPECIAL_MANA_COST   = 1;

/** Width of the standing hitbox. */
const BODY_W = 10;
/** Height of the standing hitbox. */
const BODY_H = 22;
/** Height of the ducking hitbox. */
const DUCK_H = 12;

/** Dodge roll constants. */
const DODGE_ROLL_SPEED    = 90;    // px/s during roll
const DODGE_ROLL_DURATION = 250;   // total roll time ms
const DODGE_IFRAME_DURATION = 160; // i-frames active during the first part of the roll
const DODGE_COOLDOWN      = 500;   // ms before another dodge is allowed

// ── Player states ──────────────────────────────────────────────────────────
const STATE = {
  IDLE:     'idle',
  WALK:     'walk',
  JUMP:     'jump',
  DUCK:     'duck',
  ATTACK:   'attack',
  HURT:     'hurt',
  DEAD:     'dead',
  PLUNGE:   'plunge',
  DODGE:    'dodge',
};

/** Normal tint vs soulless tint (ghostly purple when soul is out in the world). */
const TINT_NORMAL   = 0x88ccff;
const TINT_SOULLESS = 0x9966cc;

// ─────────────────────────────────────────────────────────────────────────────

class PlayerEntity {
  /**
   * @param {Phaser.Scene} scene  - The owning GameScene.
   * @param {number}       x     - World X spawn position.
   * @param {number}       y     - World Y spawn position.
   */
  constructor(scene, x, y) {
    this.scene = scene;

    // ── Spawn position (for respawn on death) ───────────────────────────
    this.spawnX = x;
    this.spawnY = y;

    // ── Last safe (grounded) position for soul placement ────────────────
    this.lastSafeX = x;
    this.lastSafeY = y;

    // ── State machine ──────────────────────────────────────────────────
    this.state = STATE.IDLE;

    // ── Facing direction (1 = right, -1 = left) ────────────────────────
    this.facing = 1;

    // ── Jump control ──────────────────────────────────────────────────
    this.jumpHoldFrames = 0;
    this.isJumping      = false;

    // ── Attack/special timing ─────────────────────────────────────────
    this.attackCooldownTimer = 0;  // ms remaining on cooldown
    this.hitboxTimer         = 0;  // ms remaining on active hitbox

    // ── I-frame / knockback state ─────────────────────────────────────
    this.iframeTimer     = 0;   // ms remaining for invincibility
    this.isInvincible    = false;
    this.knockbackActive = false;

    // ── Plunge ───────────────────────────────────────────────────────
    this.isPlunging    = false;
    this.plungeHit     = false; // true once plunge contacted something

    // ── Dodge roll state ──────────────────────────────────────────────
    this.dodgeTimer    = 0;   // ms remaining in dodge roll
    this.dodgeCooldown = 0;   // ms remaining before next dodge allowed
    this.dodgeDir      = 0;   // -1 or 1 during active dodge

    // ── Soul orb reference (Phaser GameObject) ────────────────────────
    this.soulOrb = null;

    // ── Active projectiles (for special attack collision) ──────────────
    this.projectiles = [];

    // ── Build Phaser objects ──────────────────────────────────────────
    this._buildSprite(x, y);
    this._buildHitbox();
    this._buildSoulOrbIfNeeded();
  }

  // ── Construction helpers ───────────────────────────────────────────────

  /** Create the player's visual rectangle and physics body. */
  _buildSprite(x, y) {
    const texW = BODY_W + 2;  // 12
    const texH = BODY_H + 4;  // 26

    const gfx = this.scene.add.graphics();
    // Draw within positive coordinates so generateTexture captures it
    gfx.fillStyle(0xeeeeee);
    gfx.fillRect(1, 0, 10, 8);     // head
    gfx.fillStyle(0xcccccc);
    gfx.fillRect(1, 8, 10, 12);    // torso
    gfx.fillStyle(0x999999);
    gfx.fillRect(1, 20, 4, 6);     // left leg
    gfx.fillRect(7, 20, 4, 6);     // right leg
    gfx.generateTexture('player_placeholder', texW, texH);
    gfx.destroy();

    this.sprite = this.scene.physics.add.sprite(x, y, 'player_placeholder');
    this.sprite.setOrigin(0.5, 1);  // pivot at feet for clean platform landing
    this.sprite.setCollideWorldBounds(true);

    // Set physics body size
    this.sprite.body.setSize(BODY_W, BODY_H);
    this.sprite.body.setOffset((this.sprite.width - BODY_W) / 2, this.sprite.height - BODY_H);

    // Apply per-body gravity (world gravity is 0 in config)
    this.sprite.body.setGravityY(PLAYER_GRAVITY);

    // Tint to distinguish from placeholders (ghostly purple if soul is lost)
    this.sprite.setTint(this._baseTint());
  }

  /** Create the attack hitbox (invisible rectangle, disabled by default). */
  _buildHitbox() {
    this.hitbox = this.scene.physics.add.image(0, 0, '__DEFAULT');
    this.hitbox.setVisible(false);
    this.hitbox.body.setAllowGravity(false);
    this.hitbox.body.enable = false;

    // Visible sword slash rectangle (shown during attacks)
    this._slashVisual = this.scene.add.rectangle(0, 0, 16, 4, 0xffffff)
      .setDepth(8).setVisible(false).setAlpha(0.9);
  }

  /**
   * If GameState records a soul position from a previous death this run,
   * re-instantiate the soul orb in the world.
   */
  _buildSoulOrbIfNeeded() {
    if (GameState.soul) {
      this._spawnSoulOrb(GameState.soul.x, GameState.soul.y);
    }
  }

  // ── Main update ───────────────────────────────────────────────────────────

  /**
   * Called every frame from GameScene.update().
   * @param {InputManager} input
   * @param {number}       delta  ms since last frame
   */
  update(input, delta) {
    if (this.state === STATE.DEAD || !this.sprite.body) return;

    // Tick cooldown/iframe timers
    this._tickTimers(delta);

    // Record last safe position while grounded
    if (this.sprite.body.blocked.down) {
      this.lastSafeX = this.sprite.x;
      this.lastSafeY = this.sprite.y;
    }

    // Input is ignored during knockback, plunge, and dodge
    if (!this.knockbackActive && !this.isPlunging && this.state !== STATE.DODGE) {
      this._handleMovement(input);
      this._handleJump(input);
      this._handleAttack(input);
      this._handlePause(input);
    } else if (this.state === STATE.DODGE) {
      // During dodge: maintain roll velocity, only allow pause
      this.sprite.body.setVelocityX(this.dodgeDir * DODGE_ROLL_SPEED);
      this._handlePause(input);
    } else if (this.isPlunging) {
      // Only allow pause during plunge, no movement/attack
      this._handlePause(input);
      // Enforce constant plunge speed every frame (no drift from physics)
      this.sprite.body.setVelocityX(0);
      this.sprite.body.setVelocityY(PLUNGE_VELOCITY);
    }

    // Update hitbox position to follow the sprite
    if (this.hitbox.body.enable) {
      this._positionHitbox();
    }

    // Check soul orb overlap
    if (this.soulOrb && this.soulOrb.active) {
      this._checkSoulOrbOverlap();
    }

    // Resolve knockback end condition
    if (this.knockbackActive && this.sprite.body.blocked.down) {
      this._endKnockback();
    }

    // Resolve plunge landing
    if (this.isPlunging && this.sprite.body.blocked.down) {
      this._endPlunge();
    }

    // Update special projectiles (axe spin, cross boomerang, skull key spiral)
    this._updateProjectiles(delta);
  }

  /**
   * Tick custom per-frame behaviour on active projectiles.
   */
  _updateProjectiles(delta) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!p || !p.active) {
        this.projectiles.splice(i, 1);
        continue;
      }
      if (p._updateSpin)    p._updateSpin(delta);
      if (p._updateCross)   p._updateCross(delta);
      if (p._updateSpiral)  p._updateSpiral(delta);
    }
  }

  // ── Timer tick ────────────────────────────────────────────────────────────

  _tickTimers(delta) {
    // Attack cooldown
    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= delta;
    }

    // Active hitbox duration
    if (this.hitboxTimer > 0) {
      this.hitboxTimer -= delta;
      if (this.hitboxTimer <= 0) {
        this._deactivateHitbox();
      }
    }

    // Dodge cooldown
    if (this.dodgeCooldown > 0) {
      this.dodgeCooldown -= delta;
    }

    // Dodge roll duration
    if (this.dodgeTimer > 0) {
      this.dodgeTimer -= delta;
      if (this.dodgeTimer <= 0) {
        this._endDodge();
      }
    }

    // Invincibility frames
    if (this.iframeTimer > 0) {
      this.iframeTimer -= delta;
      if (this.iframeTimer <= 0) {
        this.isInvincible = false;
        this.sprite.setAlpha(1);
        this.sprite.setTint(this._baseTint());
        // Ensure flash tween is stopped
        if (this._flashTween) {
          this._flashTween.stop();
          this._flashTween = null;
        }
      }
    }
  }

  // ── Movement ──────────────────────────────────────────────────────────────

  _handleMovement(input) {
    const grounded = this.sprite.body.blocked.down;

    // ── Dodge roll (C key / R1 button) ────────────────────────────────
    if (grounded && this.dodgeCooldown <= 0 && input.isDodgeJustPressed()) {
      // Roll in the direction being held, or facing direction if neutral
      const dir = input.isLeftHeld() ? -1 : input.isRightHeld() ? 1 : this.facing;
      this._startDodge(dir);
      return;
    }

    // ── Duck (not while climbing a ladder) ─────────────────────────────
    if (grounded && input.isDownHeld() && !this.isPlunging && !this._isClimbing) {
      this._enterDuck();
      // Castlevania 1: no horizontal movement while ducking
      this.sprite.body.setVelocityX(0);
      return;
    } else if (this.state === STATE.DUCK) {
      this._exitDuck();
    }

    // ── Horizontal movement ───────────────────────────────────────────
    const acc = GameState.player.accessory;
    const ringSpeed = (acc && acc.effect === 'speed') ? 6 : 0;
    const moveSpeed = PLAYER_SPEED + ringSpeed;

    if (input.isLeftHeld()) {
      this.sprite.body.setVelocityX(-moveSpeed);
      this.facing = -1;
      this.sprite.setFlipX(true);
      if (grounded && this.state !== STATE.ATTACK) this.state = STATE.WALK;
    } else if (input.isRightHeld()) {
      this.sprite.body.setVelocityX(moveSpeed);
      this.facing = 1;
      this.sprite.setFlipX(false);
      if (grounded && this.state !== STATE.ATTACK) this.state = STATE.WALK;
    } else {
      this.sprite.body.setVelocityX(0);
      if (grounded && this.state === STATE.WALK) this.state = STATE.IDLE;
    }

    // ── Airborne state ────────────────────────────────────────────────
    if (!grounded && this.state !== STATE.ATTACK && !this.isPlunging) {
      this.state = STATE.JUMP;
    }
  }

  _enterDuck() {
    if (this.state === STATE.DUCK) return;
    this.state = STATE.DUCK;
    // Shrink hitbox height
    this.sprite.body.setSize(BODY_W, DUCK_H);
    this.sprite.body.setOffset(
      (this.sprite.width - BODY_W) / 2,
      this.sprite.height - DUCK_H
    );
    // Visually squash the sprite to show ducking
    this.sprite.setScale(1, 0.5);
    // Slightly darker version of base tint for ducking
    this.sprite.setTint(GameState.soul ? 0x775599 : 0x5599cc);
  }

  _exitDuck() {
    this.state = STATE.IDLE;
    // Restore standing hitbox
    this.sprite.body.setSize(BODY_W, BODY_H);
    this.sprite.body.setOffset(
      (this.sprite.width - BODY_W) / 2,
      this.sprite.height - BODY_H
    );
    // Restore full height
    this.sprite.setScale(1, 1);
    this.sprite.setTint(this._baseTint());
  }

  // ── Dodge roll ─────────────────────────────────────────────────────────────

  _startDodge(dir) {
    this.state       = STATE.DODGE;
    this.dodgeDir    = dir;
    this.dodgeTimer  = DODGE_ROLL_DURATION;
    this.dodgeCooldown = DODGE_COOLDOWN;

    // Face the dodge direction
    this.facing = dir;
    this.sprite.setFlipX(dir < 0);

    // Grant i-frames for the first part of the roll
    this.isInvincible = true;
    this.iframeTimer  = DODGE_IFRAME_DURATION;

    // Visual: shrink body like a roll + tint shift
    this.sprite.body.setSize(BODY_W, DUCK_H);
    this.sprite.body.setOffset(
      (this.sprite.width - BODY_W) / 2,
      this.sprite.height - DUCK_H
    );
    this.sprite.setScale(1, 0.5);
    this.sprite.setTint(0xffffff);

    // Flash effect during roll
    this._startFlash();

    // Set roll velocity
    this.sprite.body.setVelocityX(dir * DODGE_ROLL_SPEED);
  }

  _endDodge() {
    this.state      = STATE.IDLE;
    this.dodgeTimer = 0;

    // Restore standing body
    this.sprite.body.setSize(BODY_W, BODY_H);
    this.sprite.body.setOffset(
      (this.sprite.width - BODY_W) / 2,
      this.sprite.height - BODY_H
    );
    this.sprite.setScale(1, 1);
    this.sprite.setTint(this._baseTint());

    // Stop flash if i-frames already expired
    if (!this.isInvincible && this._flashTween) {
      this._flashTween.stop();
      this._flashTween = null;
      this.sprite.setAlpha(1);
    }

    this.sprite.body.setVelocityX(0);
  }

  // ── Jump ──────────────────────────────────────────────────────────────────

  _handleJump(input) {
    const grounded = this.sprite.body.blocked.down;

    // Initiate jump
    if (input.isJumpJustPressed() && grounded && !this.isPlunging) {
      this.sprite.body.setVelocityY(JUMP_VELOCITY);
      this.isJumping      = true;
      this.jumpHoldFrames = 0;
      this.state          = STATE.JUMP;
      if (this.state === STATE.DUCK) this._exitDuck();
    }

    // Variable jump height — hold Z to keep boosting
    if (this.isJumping && input.isJumpHeld() && !grounded) {
      if (this.jumpHoldFrames < JUMP_HOLD_MAX_FRAMES) {
        this.sprite.body.velocity.y += JUMP_HOLD_FORCE;
        this.jumpHoldFrames++;
      }
    }

    // Cancel jump boost when button released
    if (!input.isJumpHeld()) {
      this.isJumping = false;
    }

    // Reset when grounded
    if (grounded) {
      this.isJumping      = false;
      this.jumpHoldFrames = 0;
    }
  }

  // ── Attack ────────────────────────────────────────────────────────────────

  _handleAttack(input) {
    if (this.attackCooldownTimer > 0) return;

    const grounded  = this.sprite.body.blocked.down;
    const airborne  = !grounded;

    // ── Plunging attack: Down + Attack while airborne ──────────────────
    if (airborne && input.isDownHeld() && input.isAttackJustPressed()) {
      this._startPlunge();
      return;
    }

    // ── Special attack: Up + Attack ────────────────────────────────────
    if (input.isUpHeld() && input.isAttackJustPressed()) {
      this._startSpecialAttack();
      return;
    }

    // ── Normal attack ──────────────────────────────────────────────────
    if (input.isAttackJustPressed()) {
      const isDucking = this.state === STATE.DUCK;
      this._startAttack(isDucking, airborne);
    }
  }

  _startAttack(isDucking, isAir) {
    this.state = STATE.ATTACK;
    this.attackCooldownTimer = ATTACK_COOLDOWN;

    // Determine hitbox zone
    let hbW = 16, hbH = 8;
    if (isDucking) {
      hbW = 14; hbH = 6; // low attack
    } else if (isAir) {
      hbW = 16; hbH = 10; // air attack — slightly taller
    }

    this._activateHitbox(hbW, hbH);

    // Briefly flash the sprite to signal attack
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(80, () => {
      if (this.state !== STATE.DEAD) this.sprite.setTint(this._baseTint());
    });

    // End attack state after cooldown
    this.scene.time.delayedCall(ATTACK_COOLDOWN * 0.6, () => {
      if (this.state === STATE.ATTACK) {
        this.state = this.sprite.body.blocked.down ? STATE.IDLE : STATE.JUMP;
      }
    });
  }

  _startPlunge() {
    this.isPlunging  = true;
    this.plungeHit   = false;
    this.state       = STATE.PLUNGE;
    this.attackCooldownTimer = ATTACK_COOLDOWN;

    // Slam downward at fixed speed — zero out per-body gravity so it doesn't accelerate
    this.sprite.body.setGravityY(0);
    this.sprite.body.setVelocityX(0);
    this.sprite.body.setVelocityY(PLUNGE_VELOCITY);

    // Activate hitbox below the player — stays active for entire plunge
    this.hitbox.body.enable = true;
    this.hitbox.body.setSize(10, 8);
    this.hitboxTimer = 0; // don't use the auto-expire timer
    this._positionHitbox();

    // Show plunge slash visual (stays visible until landing)
    if (this._slashVisual) {
      this._slashVisual.setSize(10, 8);
      this._slashVisual.setVisible(true);
      this._slashVisual.setFillStyle(0xff8800, 0.9);
    }

    // Tint orange to signal plunge
    this.sprite.setTint(0xff8800);
  }

  _endPlunge() {
    this.isPlunging = false;
    this.state      = STATE.IDLE;
    this.sprite.body.setGravityY(PLAYER_GRAVITY);
    this.sprite.setTint(this._baseTint());
    this._deactivateHitbox();

    // Stub: brief bounce effect — when enemies exist, check plungeHit here
    // and apply upward bounce velocity: this.sprite.body.setVelocityY(-150);
  }

  _startSpecialAttack() {
    const gs = GameState.player;
    if (gs.mana < SPECIAL_MANA_COST) return; // not enough mana

    gs.mana -= SPECIAL_MANA_COST;
    this.attackCooldownTimer = ATTACK_COOLDOWN;

    // Dispatch to the appropriate special handler
    const special = gs.specialAttack || 'knife';
    this._fireSpecial(special);
  }

  /**
   * Fires the selected special attack.
   * Architecture supports 6 types: knife, axe, holy water, cross, skull key, ember flask.
   * Phases 6+ will replace stubs with real behaviour.
   *
   * @param {string} type
   */
  _fireSpecial(type) {
    // Castlevania-style special weapons with proper arcs and behaviours.
    const COLORS = {
      knife:        0xffffff,
      axe:          0xffaa00,
      'holy water': 0x00aaff,
      cross:        0xffff00,
      'skull key':  0xcc44cc,
      'ember flask': 0xff4400,
    };

    // Hawk Ring: extend projectile lifetime
    const accR = GameState.player.accessory;
    const hawkBonus = (accR && accR.effect === 'range') ? 1.6 : 1.0;

    const SPECIAL_DAMAGE = {
      knife: 1, axe: 2, 'holy water': 2,
      cross: 2, 'skull key': 3, 'ember flask': 4,
    };

    const color = COLORS[type] ?? 0xffffff;
    const px = this.sprite.x + this.facing * 14;
    const py = this.sprite.y - 14;
    const facing = this.facing;
    const scene = this.scene;
    const projs = this.projectiles;

    // ── Knife — fast straight throw (like CV dagger) ─────────────────
    if (type === 'knife') {
      const proj = scene.add.rectangle(px, py, 6, 3, color);
      scene.physics.add.existing(proj);
      proj.body.setAllowGravity(false);
      proj.body.setVelocity(facing * 200, 0);
      proj._damage = SPECIAL_DAMAGE[type];
      projs.push(proj);
      scene.time.delayedCall(1000 * hawkBonus, () => {
        if (proj && proj.active) proj.destroy();
      });
      return;
    }

    // ── Axe — arcs upward then falls with gravity (like CV axe) ──────
    if (type === 'axe') {
      const proj = scene.add.rectangle(px, py, 7, 7, color);
      scene.physics.add.existing(proj);
      proj.body.setAllowGravity(true);
      proj.body.setGravityY(400);
      // Short toss arc — scaled to DK-style jump height
      proj.body.setVelocity(facing * 45, -160);
      proj._damage = SPECIAL_DAMAGE[type];
      // Spin the axe visually
      proj._spinTimer = 0;
      proj._updateSpin = (delta) => {
        proj._spinTimer += delta;
        proj.rotation = proj._spinTimer * 0.012 * facing;
      };
      projs.push(proj);
      scene.time.delayedCall(1800 * hawkBonus, () => {
        if (proj && proj.active) proj.destroy();
      });
      return;
    }

    // ── Holy water — short lob, drops and creates ground fire ────────
    if (type === 'holy water') {
      const proj = scene.add.rectangle(px, py, 6, 6, color);
      scene.physics.add.existing(proj);
      proj.body.setAllowGravity(true);
      proj.body.setGravityY(500);
      // Short forward lob — drops close to feet
      proj.body.setVelocity(facing * 35, -110);
      proj._damage = SPECIAL_DAMAGE[type];
      proj._isHolyWater = true;
      // Add platform collision so it hits the ground
      scene.physics.add.collider(proj, scene.platforms, () => {
        if (!proj.active) return;
        // Spawn ground fire effect at impact point
        this._spawnHolyWaterFire(proj.x, proj.y, SPECIAL_DAMAGE[type]);
        proj.destroy();
      });
      projs.push(proj);
      scene.time.delayedCall(1400 * hawkBonus, () => {
        if (proj && proj.active) proj.destroy();
      });
      return;
    }

    // ── Cross — boomerang, flies out and returns (like CV cross) ──────
    if (type === 'cross') {
      const proj = scene.add.rectangle(px, py, 7, 7, color);
      scene.physics.add.existing(proj);
      proj.body.setAllowGravity(false);
      proj.body.setVelocity(facing * 90, 0);
      proj._damage = SPECIAL_DAMAGE[type];
      proj._returning = false;
      proj._originX = px;
      proj._spinTimer = 0;
      // Custom update: decelerate, stop, then return
      proj._updateCross = (delta) => {
        proj._spinTimer += delta;
        proj.rotation = proj._spinTimer * 0.015;
        if (!proj._returning) {
          // Decelerate
          const curVx = proj.body.velocity.x;
          const decel = facing * -200 * (delta / 1000);
          const newVx = curVx + decel;
          // If velocity has reversed direction, start returning
          if ((facing > 0 && newVx <= 0) || (facing < 0 && newVx >= 0)) {
            proj._returning = true;
            proj.body.setVelocity(-facing * 90, 0);
          } else {
            proj.body.setVelocityX(newVx);
          }
        } else {
          // Returning — destroy when it passes origin
          if ((facing > 0 && proj.x < proj._originX) ||
              (facing < 0 && proj.x > proj._originX)) {
            proj.destroy();
          }
        }
      };
      projs.push(proj);
      scene.time.delayedCall(2200 * hawkBonus, () => {
        if (proj && proj.active) proj.destroy();
      });
      return;
    }

    // ── Skull key — slow spiralling projectile, pierces enemies ──────
    if (type === 'skull key') {
      const proj = scene.add.rectangle(px, py, 6, 6, color);
      scene.physics.add.existing(proj);
      proj.body.setAllowGravity(false);
      proj.body.setVelocity(facing * 45, 0);
      proj._damage = SPECIAL_DAMAGE[type];
      proj._spiralTimer = 0;
      proj._piercing = true; // won't destroy on enemy hit
      proj._updateSpiral = (delta) => {
        proj._spiralTimer += delta / 1000;
        // Spiral up and down while moving forward
        const spiralY = Math.sin(proj._spiralTimer * 5) * 28;
        proj.body.setVelocityY(spiralY);
        proj.rotation = proj._spiralTimer * 4;
      };
      projs.push(proj);
      scene.time.delayedCall(2000 * hawkBonus, () => {
        if (proj && proj.active) proj.destroy();
      });
      return;
    }

    // ── Ember flask — arcs then explodes on impact ───────────────────
    if (type === 'ember flask') {
      const proj = scene.add.rectangle(px, py, 6, 8, color);
      scene.physics.add.existing(proj);
      proj.body.setAllowGravity(true);
      proj.body.setGravityY(450);
      proj.body.setVelocity(facing * 50, -140);
      proj._damage = SPECIAL_DAMAGE[type];
      proj._isEmberFlask = true;
      // Explode on platform collision
      scene.physics.add.collider(proj, scene.platforms, () => {
        if (!proj.active) return;
        this._spawnExplosion(proj.x, proj.y, SPECIAL_DAMAGE[type]);
        proj.destroy();
      });
      projs.push(proj);
      scene.time.delayedCall(1600 * hawkBonus, () => {
        if (proj && proj.active) proj.destroy();
      });
      return;
    }

    // Fallback (unknown type) — straight throw
    const proj = scene.add.rectangle(px, py, 8, 4, color);
    scene.physics.add.existing(proj);
    proj.body.setAllowGravity(false);
    proj.body.setVelocity(facing * 160, 0);
    proj._damage = 1;
    projs.push(proj);
    scene.time.delayedCall(1200, () => {
      if (proj && proj.active) proj.destroy();
    });
  }

  /**
   * Holy water ground fire — damages enemies in area for a brief duration.
   */
  _spawnHolyWaterFire(x, y, damage) {
    const scene = this.scene;
    const fire = scene.add.rectangle(x, y - 2, 16, 6, 0x00aaff, 0.8);
    fire.setDepth(5);
    // Flicker effect
    scene.tweens.add({
      targets: fire, alpha: 0.3, duration: 100,
      yoyo: true, repeat: 8,
    });
    // Create a damage hitbox
    scene.physics.add.existing(fire, true); // static body
    fire.body.setSize(16, 8);

    // Check enemy overlap every frame for 900ms
    const enemies = this.scene.enemyManager ? this.scene.enemyManager.getEnemies() : [];
    const hitSet = new Set();
    const timer = scene.time.addEvent({
      delay: 150,
      repeat: 5,
      callback: () => {
        const living = this.scene.enemyManager ? this.scene.enemyManager.getEnemies() : [];
        for (const enemy of living) {
          if (hitSet.has(enemy)) continue;
          if (!enemy.sprite || !enemy.sprite.active) continue;
          const dx = Math.abs(enemy.sprite.x - x);
          const dy = Math.abs(enemy.sprite.y - enemy.sprite.body.height / 2 - (y - 2));
          if (dx < 12 && dy < 10) {
            enemy.takeDamage(damage, x);
            hitSet.add(enemy);
          }
        }
      },
    });
    scene.time.delayedCall(900, () => {
      if (fire && fire.active) fire.destroy();
    });
  }

  /**
   * Ember flask explosion — AoE burst damage at impact point.
   */
  _spawnExplosion(x, y, damage) {
    const scene = this.scene;
    // Visual: expanding orange circle
    const blast = scene.add.circle(x, y - 4, 4, 0xff4400, 0.9).setDepth(6);
    scene.tweens.add({
      targets: blast,
      scaleX: 3, scaleY: 3, alpha: 0,
      duration: 350, ease: 'Cubic.easeOut',
      onComplete: () => blast.destroy(),
    });
    // Camera shake for impact
    scene.cameras.main.shake(150, 0.005);

    // Damage all enemies in radius
    const enemies = this.scene.enemyManager ? this.scene.enemyManager.getEnemies() : [];
    for (const enemy of enemies) {
      if (!enemy.sprite || !enemy.sprite.active) continue;
      const dx = Math.abs(enemy.sprite.x - x);
      const dy = Math.abs((enemy.sprite.y - enemy.sprite.body.height / 2) - (y - 4));
      if (dx < 20 && dy < 16) {
        enemy.takeDamage(damage, x);
      }
    }
  }

  // ── Hitbox helpers ────────────────────────────────────────────────────────

  _activateHitbox(w, h) {
    this.hitbox.body.enable  = true;
    this.hitbox.body.setSize(w, h);
    this.hitboxTimer = HITBOX_DURATION;
    this._positionHitbox();

    // Show sword slash visual
    if (this._slashVisual) {
      this._slashVisual.setSize(w, h);
      this._slashVisual.setVisible(true);
      // Color based on attack type
      if (this.isPlunging) {
        this._slashVisual.setFillStyle(0xff8800, 0.9); // orange for plunge
      } else {
        this._slashVisual.setFillStyle(0xffffff, 0.9); // white for normal
      }
    }
  }

  _deactivateHitbox() {
    this.hitbox.body.enable = false;
    this.hitboxTimer = 0;
    if (this._slashVisual) this._slashVisual.setVisible(false);
  }

  /**
   * Place the hitbox in front of and slightly forward of the player.
   * Adjusted for duck/plunge/air positions.
   */
  _positionHitbox() {
    const hw = this.hitbox.body.width  / 2;
    const hh = this.hitbox.body.height / 2;

    let hx, hy;

    if (this.isPlunging) {
      // Plunge: hitbox directly below
      hx = this.sprite.x;
      hy = this.sprite.y + 4;
    } else if (this.state === STATE.DUCK) {
      // Low attack: offset forward and low
      hx = this.sprite.x + this.facing * (BODY_W / 2 + hw + 2);
      hy = this.sprite.y - 6;
    } else {
      // Normal / air: offset forward at mid torso height
      hx = this.sprite.x + this.facing * (BODY_W / 2 + hw + 2);
      hy = this.sprite.y - BODY_H * 0.45;
    }

    this.hitbox.setPosition(hx, hy);
    if (this._slashVisual && this._slashVisual.visible) {
      this._slashVisual.setPosition(hx, hy);
    }
  }

  // ── Pause hook ────────────────────────────────────────────────────────────

  _handlePause(input) {
    if (input.isStartJustPressed()) {
      this.scene.scene.launch('PauseScene');
      this.scene.scene.pause();
    }
  }

  // ── Damage / i-frames / knockback ─────────────────────────────────────────

  /**
   * Call this when the player should take damage (e.g. from an enemy).
   * @param {number} amount      - HP to subtract.
   * @param {number} sourceX     - World X of the damage source (for knockback direction).
   */
  takeDamage(amount, sourceX) {
    if (this.isInvincible || this.state === STATE.DEAD) return;

    // Armor damage negation — chance to block 1 point of damage
    const armor = GameState.player.armor;
    if (armor && armor.defenseBonus) {
      // 15% per defense bonus point (e.g. Plate Armor = 3 → 45%)
      const negateChance = armor.defenseBonus * 0.15;
      if (Math.random() < negateChance) {
        amount = Math.max(0, amount - 1);
        // Flash blue to show armor absorbed damage
        this.sprite.setTint(0x4488ff);
        this.scene.time.delayedCall(150, () => {
          if (this.state !== STATE.DEAD) this.sprite.setTint(this._baseTint());
        });
        if (amount <= 0) return; // fully negated
      }
    }

    // Subtract HP
    GameState.player.hp = Math.max(0, GameState.player.hp - amount);

    if (GameState.player.hp <= 0) {
      this._die();
      return;
    }

    // ── Cancel plunge if active ────────────────────────────────────────
    if (this.isPlunging) {
      this.isPlunging = false;
      this.sprite.body.setGravityY(PLAYER_GRAVITY);
      this._deactivateHitbox();
    }

    // ── Apply knockback ───────────────────────────────────────────────
    const dir = this.sprite.x >= sourceX ? 1 : -1; // away from source
    this.sprite.body.setVelocityX(dir * KNOCKBACK_VX);
    this.sprite.body.setVelocityY(KNOCKBACK_VY);

    this.knockbackActive = true;
    this.state           = STATE.HURT;

    // ── Start i-frames ────────────────────────────────────────────────
    this.isInvincible = true;
    const accI = GameState.player.accessory;
    const iframeBonus = (accI && accI.effect === 'iframes') ? 600 : 0;
    this.iframeTimer  = IFRAME_DURATION + iframeBonus;
    this._startFlash();
  }

  /** Flicker alpha during i-frames — classic Castlevania visual. */
  _startFlash() {
    if (this._flashTween) this._flashTween.stop();
    this._flashTween = this.scene.tweens.add({
      targets:  this.sprite,
      alpha:    0.2,
      duration: 100,
      yoyo:     true,
      repeat:   -1,
    });
  }

  /** Called when knockback resolves (player lands). */
  _endKnockback() {
    this.knockbackActive = false;
    this.state           = STATE.IDLE;
  }

  // ── Death & soul system ───────────────────────────────────────────────────

  _die() {
    this.state = STATE.DEAD;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.setTint(0xff0000);
    this._deactivateHitbox();

    // Stop flash tween
    if (this._flashTween) { this._flashTween.stop(); this._flashTween = null; }
    this.sprite.setAlpha(1);

    if (GameState.soul !== null) {
      // Second death — soul already exists → GAME OVER
      this.scene.time.delayedCall(800, () => {
        this.scene.scene.start('GameOverScene');
      });
    } else {
      // First death — spawn soul, respawn player
      this._spawnSoul();
      this.scene.time.delayedCall(600, () => {
        this._respawn();
      });
    }
  }

  _spawnSoul() {
    // Clamp soul position to something visible (Phase 3 will use real geometry)
    const sx = Phaser.Math.Clamp(this.lastSafeX, 16, 240);
    const sy = Phaser.Math.Clamp(this.lastSafeY, 16, 224);

    // Store in GameState for persistence
    GameState.soul    = { x: sx, y: sy };
    GameState.pendingXP += GameState.player.xp; // suspend XP
    GameState.player.xp = 0;                    // clear until soul recovered

    this._spawnSoulOrb(sx, sy);
  }

  /**
   * Create the pulsing soul orb visual.
   * @param {number} x
   * @param {number} y
   */
  _spawnSoulOrb(x, y) {
    // Destroy any old orb reference
    if (this.soulOrb && this.soulOrb.active) this.soulOrb.destroy();

    this.soulOrb = this.scene.add.circle(x, y, 6, 0xffdd44);
    this.soulOrb.setDepth(5);

    // Pulsing glow tween
    this.scene.tweens.add({
      targets:   this.soulOrb,
      scaleX:    1.5,
      scaleY:    1.5,
      alpha:     0.6,
      duration:  600,
      yoyo:      true,
      repeat:    -1,
      ease:      'Sine.easeInOut',
    });
  }

  /** Teleport player back to spawn with reset HP. */
  _respawn() {
    GameState.player.hp = 1; // always respawn at 1 HP

    this.sprite.setPosition(this.spawnX, this.spawnY);
    this.sprite.setAlpha(1);
    this.sprite.setTint(this._baseTint());
    this.sprite.body.setVelocity(0, 0);

    this.state           = STATE.IDLE;
    this.knockbackActive = false;
    this.isPlunging      = false;
    this._deactivateHitbox();
    this._exitDuck();

    // Grant i-frames on respawn so enemies can't immediately kill you
    this.isInvincible = true;
    this.iframeTimer  = 2000; // 2 seconds of protection
    this._startFlash();

    // Notify the scene so enemies can respawn too
    this.scene.events.emit('player-respawn');
  }

  /** Called when the player walks over the soul orb. */
  _checkSoulOrbOverlap() {
    if (!this.soulOrb || !this.soulOrb.active) return;

    const dx = Math.abs(this.sprite.x - this.soulOrb.x);
    const dy = Math.abs(this.sprite.y - this.soulOrb.y);

    if (dx < 14 && dy < 18) {
      this._retrieveSoul();
    }
  }

  _retrieveSoul() {
    // Restore pending XP
    GameState.player.xp += GameState.pendingXP;
    GameState.pendingXP  = 0;
    GameState.soul       = null;

    this.soulOrb.destroy();
    this.soulOrb = null;

    // Brief flash to confirm retrieval
    this.sprite.setTint(0xffff00);
    this.scene.time.delayedCall(200, () => {
      if (this.state !== STATE.DEAD) this.sprite.setTint(this._baseTint());
    });
  }

  // ── Public accessors ──────────────────────────────────────────────────────

  /** Returns the correct base tint depending on whether the soul is out. */
  _baseTint() {
    return GameState.soul ? TINT_SOULLESS : TINT_NORMAL;
  }

  /** World X position. */
  get x() { return this.sprite.x; }
  /** World Y position. */
  get y() { return this.sprite.y; }

  /** Returns the physics body for external collision setup (e.g. platforms). */
  get body() { return this.sprite.body; }

  /** Returns the sprite for camera follow / overlap checks. */
  get gameObject() { return this.sprite; }

  /** Returns the attack hitbox game object. */
  get attackHitbox() { return this.hitbox; }

  /** Returns true if the soul orb currently exists in the world. */
  get hasSoul() { return this.soulOrb !== null && this.soulOrb.active; }

  /**
   * Manually set the soul orb's world position (called by level system in
   * Phase 3 to clamp to valid geometry).
   */
  setSoulOrbPosition(x, y) {
    if (this.soulOrb && this.soulOrb.active) {
      this.soulOrb.setPosition(x, y);
      GameState.soul = { x, y };
    }
  }
}

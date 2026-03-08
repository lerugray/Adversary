/**
 * PhantomSystem.js — The anti-grinding ghost.
 *
 * Tracks player idle time in the current area. If the player lingers too long
 * without climbing higher, the Phantom spawns and hunts them.
 *
 * Rules:
 *   - After 20s of non-progress (configurable), spawn the Phantom
 *   - Phantom: semi-transparent, moves directly toward player at ~40px/s
 *   - Ignores all platforms and walls (no physics collision)
 *   - Completely invincible
 *   - On contact with player: deals 2 damage (1.5s cooldown)
 *   - Retreats (despawns) when player moves up 40px from trigger height
 *   - Telegraph: flashing warning text 2-3s before spawn
 *   - Does NOT spawn in Level 4 (boss level)
 *   - On later loops: trigger timer shortens
 *
 * Usage:
 *   // In GameScene.create():
 *   this.phantomSystem = new PhantomSystem(this);
 *
 *   // In GameScene.update():
 *   this.phantomSystem.update(delta, this.player);
 */

// ── Constants ───────────────────────────────────────────────────────────────
const PHANTOM_BASE_TRIGGER_TIME  = 35000; // ms before Phantom spawns
const PHANTOM_MIN_TRIGGER_TIME   = 15000; // minimum trigger time
const PHANTOM_LOOP_REDUCTION     = 3000;  // ms reduced per loop after first
const PHANTOM_SPEED              = 40;    // px/s movement toward player
const PHANTOM_DAMAGE             = 2;     // damage on contact
const PHANTOM_DAMAGE_COOLDOWN    = 1500;  // ms between damage ticks
const PHANTOM_RETREAT_THRESHOLD  = 40;    // px player must climb to dismiss
const PHANTOM_TELEGRAPH_DURATION = 2500;  // ms of warning before spawn
const PHANTOM_SIZE               = 16;    // visual size

class PhantomSystem {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;

    // ── State ──────────────────────────────────────────────────────────
    this.idleTimer       = 0;     // ms player has been "idle" (not progressing)
    this.highestY        = 9999;  // lowest Y reached (lower Y = higher on screen)
    this.triggerY        = 9999;  // Y when phantom was triggered
    this.phantomActive   = false;
    this.phantomObj      = null;
    this.damageCooldown  = 0;
    this.telegraphing    = false;
    this.telegraphTimer  = 0;
    this.warningText     = null;

    // Calculate trigger time based on current loop
    this.triggerTime = this._calcTriggerTime();
  }

  _calcTriggerTime() {
    const loop = GameState.currentLoop || 1;
    const time = PHANTOM_BASE_TRIGGER_TIME - (loop - 1) * PHANTOM_LOOP_REDUCTION;
    return Math.max(PHANTOM_MIN_TRIGGER_TIME, time);
  }

  /**
   * Called every frame from GameScene.update().
   * @param {number} delta - ms since last frame
   * @param {PlayerEntity} player
   */
  update(delta, player) {
    // Don't spawn in boss level (Level 4)
    if (GameState.currentLevel === 4) return;
    if (!player || player.state === 'dead') {
      // Reset everything so the ghost clock starts fresh after respawn
      this.idleTimer = 0;
      this.telegraphing = false;
      this.telegraphTimer = 0;
      if (this.warningText) {
        this.warningText.destroy();
        this.warningText = null;
      }
      if (this.phantomActive) this._despawnPhantom();
      return;
    }

    const playerY = player.y;

    // Only count as meaningful progress if player climbed 30+ px above previous high
    if (playerY < this.highestY - 30) {
      this.highestY = playerY;
      this.idleTimer = 0;

      // If phantom is active, check retreat condition
      if (this.phantomActive && this.triggerY - playerY >= PHANTOM_RETREAT_THRESHOLD) {
        this._despawnPhantom();
        return;
      }
    }

    // ── Phantom already active ────────────────────────────────────────
    if (this.phantomActive) {
      this._updatePhantom(delta, player);
      return;
    }

    // ── Telegraph phase ──────────────────────────────────────────────
    if (this.telegraphing) {
      this.telegraphTimer -= delta;
      // Flash warning text
      if (this.warningText) {
        const flash = Math.floor(Date.now() / 200) % 2;
        this.warningText.setAlpha(flash === 0 ? 0.3 : 1.0);
      }
      if (this.telegraphTimer <= 0) {
        this._spawnPhantom(player);
      }
      return;
    }

    // ── Idle timer accumulation ──────────────────────────────────────
    this.idleTimer += delta;

    if (this.idleTimer >= this.triggerTime) {
      this._startTelegraph(player);
    }
  }

  // ── Telegraph ─────────────────────────────────────────────────────────────

  _startTelegraph(player) {
    this.telegraphing  = true;
    this.telegraphTimer = PHANTOM_TELEGRAPH_DURATION;

    // Show flashing warning text
    this.warningText = this.scene.add.text(
      128, 120,
      '!! DANGER !!',
      {
        fontFamily: 'monospace',
        fontSize:   '10px',
        color:      '#ff4444',
        stroke:     '#000000',
        strokeThickness: 2,
      }
    ).setOrigin(0.5).setScrollFactor(0).setDepth(15);
  }

  // ── Spawn & despawn ───────────────────────────────────────────────────────

  _spawnPhantom(player) {
    this.telegraphing = false;
    this.phantomActive = true;
    this.triggerY = player.y;

    // Remove warning text
    if (this.warningText) {
      this.warningText.destroy();
      this.warningText = null;
    }

    // Create phantom visual — semi-transparent white/grey circle
    const spawnX = player.x > 128 ? 20 : 236; // spawn on opposite side
    const spawnY = player.y;

    this.phantomObj = this.scene.add.circle(
      spawnX, spawnY,
      PHANTOM_SIZE / 2,
      0xccccdd,
      0.5
    ).setDepth(12);

    // Add a subtle pulsing glow
    this.scene.tweens.add({
      targets:  this.phantomObj,
      alpha:    0.25,
      scaleX:   1.3,
      scaleY:   1.3,
      duration: 500,
      yoyo:     true,
      repeat:   -1,
      ease:     'Sine.easeInOut',
    });
  }

  _despawnPhantom() {
    this.phantomActive = false;
    this.idleTimer     = 0;
    this.damageCooldown = 0;

    if (this.phantomObj) {
      this.scene.tweens.killTweensOf(this.phantomObj);
      this.scene.tweens.add({
        targets:  this.phantomObj,
        alpha:    0,
        duration: 300,
        onComplete: () => {
          if (this.phantomObj) {
            this.phantomObj.destroy();
            this.phantomObj = null;
          }
        }
      });
    }

    if (this.warningText) {
      this.warningText.destroy();
      this.warningText = null;
    }
  }

  // ── Phantom behaviour ─────────────────────────────────────────────────────

  _updatePhantom(delta, player) {
    if (!this.phantomObj || !this.phantomObj.active) return;

    // Move directly toward player (ignores all geometry)
    const dx = player.x - this.phantomObj.x;
    const dy = (player.y - 11) - this.phantomObj.y; // aim at body center
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      const speed = PHANTOM_SPEED * (delta / 1000);
      this.phantomObj.x += (dx / dist) * speed;
      this.phantomObj.y += (dy / dist) * speed;
    }

    // Check retreat condition
    if (this.triggerY - player.y >= PHANTOM_RETREAT_THRESHOLD) {
      this._despawnPhantom();
      return;
    }

    // Damage cooldown
    if (this.damageCooldown > 0) {
      this.damageCooldown -= delta;
    }

    // Check contact with player
    const contactDist = Math.sqrt(
      Math.pow(player.x - this.phantomObj.x, 2) +
      Math.pow((player.y - 11) - this.phantomObj.y, 2)
    );

    if (contactDist < 14 && this.damageCooldown <= 0) {
      player.takeDamage(PHANTOM_DAMAGE, this.phantomObj.x);
      this.damageCooldown = PHANTOM_DAMAGE_COOLDOWN;
    }
  }

  /**
   * Clean up all phantom state. Call when scene restarts.
   */
  destroy() {
    if (this.phantomObj) {
      this.phantomObj.destroy();
      this.phantomObj = null;
    }
    if (this.warningText) {
      this.warningText.destroy();
      this.warningText = null;
    }
  }
}

/**
 * HazardSystem.js — Rolling hazard spawner (Donkey Kong-style).
 *
 * Uses manual position tracking instead of Arcade physics colliders
 * so hazards work even when off-camera. Each skull rolls across platforms,
 * falls off edges, lands on the tier below and reverses direction.
 *
 * Usage:
 *   // In GameScene.create():
 *   this.hazardSystem = new HazardSystem(this);
 *
 *   // In GameScene.update():
 *   this.hazardSystem.update(delta, player);
 */

// ── Tuning ──────────────────────────────────────────────────────────────────
const HAZARD_SIZE     = 8;   // px square
const HAZARD_GRAVITY  = 400; // px/s^2 (for manual sim)
const HAZARD_DAMAGE   = 1;
const HAZARD_MAX      = 12;
const HAZARD_CONTACT_COOLDOWN = 1200; // ms between damage ticks
const HAZARD_JUMP_BONUS      = 50;   // score for jumping over a hazard

class HazardSystem {
  constructor(scene) {
    this.scene = scene;
    this._hazards = [];
    this._spawnTimer = 0;
    this._config = null;
    this._contactCooldown = 0;
    this._platforms = []; // sorted copy of platform data for collision

    const data = scene.currentLevelData;
    if (data && data.hazardSpawner) {
      this._config = data.hazardSpawner;
      this._spawnTimer = 500; // first skull almost immediately
      // Cache platforms sorted by Y for efficient lookup
      this._platforms = (data.platforms || []).slice().sort((a, b) => a.y - b.y);
      this._buildTexture();
      this._buildSpawnerVisual();
      this._spawnPreRolled(data);
    }
  }

  // ── Texture ─────────────────────────────────────────────────────────────

  _buildTexture() {
    const key = 'hazard_skull';
    if (this.scene.textures.exists(key)) return;

    const s = HAZARD_SIZE;
    const gfx = this.scene.add.graphics();

    gfx.fillStyle(0x999977); // pale bone
    gfx.fillRect(0, 0, s, s);
    gfx.fillStyle(0x444422);
    gfx.fillRect(1, 2, 2, 2); // left eye
    gfx.fillRect(5, 2, 2, 2); // right eye
    gfx.fillStyle(0x555533);
    gfx.fillRect(3, 5, 2, 1); // mouth

    gfx.generateTexture(key, s, s);
    gfx.destroy();
  }

  // ── Stone head visual ───────────────────────────────────────────────────

  _buildSpawnerVisual() {
    const c = this._config;
    const s = this.scene;
    const hx = c.x;
    const hy = c.y;

    // Main head block (dark stone)
    s.add.rectangle(hx, hy - 12, 16, 18, 0x4a4a4a).setOrigin(0.5, 1).setDepth(1);
    // Brow ridge
    s.add.rectangle(hx, hy - 18, 18, 3, 0x555555).setOrigin(0.5, 1).setDepth(2);
    // Eyes (dark hollows)
    s.add.rectangle(hx - 3, hy - 14, 3, 3, 0x222222).setDepth(2);
    s.add.rectangle(hx + 3, hy - 14, 3, 3, 0x222222).setDepth(2);
    // Open mouth (where skulls emerge)
    s.add.rectangle(hx, hy - 4, 8, 5, 0x1a1a1a).setOrigin(0.5, 1).setDepth(2);
  }

  // ── Pre-rolled skulls (so the level feels alive from the start) ─────────

  _spawnPreRolled(data) {
    if (!this._config) return;
    const speed = this._config.speed;

    // Sort platforms by Y ascending (highest first) and skip ground (tier 0)
    const tiers = (data.platforms || [])
      .filter(p => p.tier && p.tier > 0)
      .sort((a, b) => b.y - a.y); // lowest tiers first (closest to player)

    // Place a skull on the four lowest tiers (closest to player spawn)
    const count = Math.min(4, tiers.length);
    for (let i = 0; i < count; i++) {
      const plat = tiers[i];
      // Random X somewhere in the middle of the platform
      const margin = plat.w * 0.2;
      const x = plat.x + margin + Math.random() * (plat.w - margin * 2);
      const y = plat.y; // on the platform surface

      // Alternate direction: odd tiers roll right, even roll left
      const dir = (plat.tier % 2 === 1) ? 1 : -1;

      const sprite = this.scene.add.sprite(x, y - HAZARD_SIZE / 2, 'hazard_skull');
      sprite.setOrigin(0.5, 0.5);
      sprite.setDepth(5);

      this._hazards.push({
        sprite: sprite,
        x: x,
        y: y,
        vx: dir * speed,
        vy: 0,
        grounded: true,
        age: 0,
        jumpedOver: false,
      });
    }
  }

  // ── Platform helpers ────────────────────────────────────────────────────

  /**
   * Find the platform surface directly beneath (x, y).
   * Returns the platform's Y (top surface) or null if none found.
   */
  _findPlatformBelow(x, y) {
    for (const p of this._platforms) {
      // Platform must be at or below the skull
      if (p.y < y - 2) continue;
      // Skull X must be within platform bounds
      if (x >= p.x && x <= p.x + p.w) {
        return p;
      }
    }
    return null;
  }

  /**
   * Check if (x, y) is standing on a platform surface.
   * Returns the platform or null.
   */
  _isOnPlatform(x, y) {
    for (const p of this._platforms) {
      if (x >= p.x && x <= p.x + p.w) {
        // Skull bottom at y, platform top at p.y
        const dist = p.y - y;
        if (dist >= -2 && dist <= 4) {
          return p;
        }
      }
    }
    return null;
  }

  // ── Spawn ───────────────────────────────────────────────────────────────

  _spawn() {
    if (this._hazards.length >= HAZARD_MAX) return;

    const c = this._config;

    // Visual sprite (rendering only — no physics body)
    const sprite = this.scene.add.sprite(c.x, c.y - HAZARD_SIZE / 2, 'hazard_skull');
    sprite.setOrigin(0.5, 0.5);
    sprite.setDepth(5);

    const hazard = {
      sprite: sprite,
      x: c.x,
      y: c.y,              // bottom of skull (feet), starts on platform surface
      vx: (c.initialDirection || 1) * c.speed,
      vy: 0,
      grounded: true,      // starts on the spawner platform
      age: 0,
      jumpedOver: false,    // true once player earns the jump bonus for this skull
    };

    this._hazards.push(hazard);
  }

  // ── Frame update ────────────────────────────────────────────────────────

  update(delta, player) {
    if (!this._config) return;

    const dt = delta / 1000; // seconds

    if (this._contactCooldown > 0) this._contactCooldown -= delta;

    // Spawn timer
    this._spawnTimer -= delta;
    if (this._spawnTimer <= 0) {
      this._spawn();
      this._spawnTimer = this._config.interval;
    }

    const worldH = this.scene.currentLevelData.worldHeight;
    const worldW = this.scene.currentLevelData.worldWidth;
    const speed = this._config.speed;

    for (let i = this._hazards.length - 1; i >= 0; i--) {
      const h = this._hazards[i];

      if (!h.sprite || !h.sprite.active) {
        this._hazards.splice(i, 1);
        continue;
      }

      h.age += delta;

      // ── Movement ──────────────────────────────────────────────────
      if (h.grounded) {
        // Roll horizontally
        h.x += h.vx * dt;
        h.vy = 0;

        // Check if we've walked off the edge of our current platform
        const plat = this._isOnPlatform(h.x, h.y);
        if (!plat) {
          // Walked off — start falling
          h.grounded = false;
          h.vy = 0;
        }
      } else {
        // Falling — apply gravity, keep horizontal velocity
        h.vy += HAZARD_GRAVITY * dt;
        h.x += h.vx * dt;
        const prevY = h.y;
        h.y += h.vy * dt;

        // Check if we've passed through any platform during this fall step.
        // Scan all platforms between prevY and h.y to prevent overshooting.
        let landed = false;
        for (const p of this._platforms) {
          if (h.x >= p.x && h.x <= p.x + p.w) {
            // Platform surface is at p.y. Did we cross it this frame?
            if (prevY <= p.y + 2 && h.y >= p.y - 2 && h.vy > 0) {
              h.y = p.y;
              h.vy = 0;
              h.grounded = true;
              h.vx = -Math.sign(h.vx) * speed;
              landed = true;
              break;
            }
          }
        }
      }

      // ── Sync sprite position ──────────────────────────────────────
      h.sprite.setPosition(h.x, h.y - HAZARD_SIZE / 2);

      // ── Despawn if off-world ──────────────────────────────────────
      if (h.y > worldH + 30 || h.x < -30 || h.x > worldW + 30 || h.age > 45000) {
        h.sprite.destroy();
        this._hazards.splice(i, 1);
        continue;
      }

      // ── Player contact damage ─────────────────────────────────────
      if (player && player.state !== 'dead') {
        const px = player.x;
        const py = player.y - 11;
        const hcy = h.y - HAZARD_SIZE / 2;
        const dx = Math.abs(px - h.x);
        const dy = Math.abs(py - hcy);

        if (dx < 8 && dy < 12 && !player.isInvincible && this._contactCooldown <= 0) {
          player.takeDamage(this._config.damage || HAZARD_DAMAGE, h.x);
          this._contactCooldown = HAZARD_CONTACT_COOLDOWN;
        }

        // ── Jump-over bonus (DK style) ────────────────────────────
        // Player is airborne, horizontally close, and above the skull
        const jumpDy = h.y - player.y;
        if (!h.jumpedOver && h.grounded && dx < 14 &&
            player.sprite && !player.sprite.body.blocked.down &&
            jumpDy > HAZARD_SIZE && jumpDy < 28) {
          h.jumpedOver = true;
          GameState.score += HAZARD_JUMP_BONUS;
          // Brief floating score text
          const popup = this.scene.add.text(player.x, player.y - 20, `+${HAZARD_JUMP_BONUS}`, {
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

  // ── Cleanup ─────────────────────────────────────────────────────────────

  destroyAll() {
    for (const h of this._hazards) {
      if (h.sprite && h.sprite.active) h.sprite.destroy();
    }
    this._hazards = [];
  }
}

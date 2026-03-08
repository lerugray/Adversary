/**
 * HazardSystem.js — Rolling hazard spawner (Donkey Kong-style).
 *
 * Uses manual position tracking instead of Arcade physics colliders
 * so hazards work even when off-camera. Each skull rolls across platforms,
 * falls off edges, lands on the tier below and reverses direction.
 *
 * DK-inspired mechanics:
 *   - Skulls can descend ladders using a probability algorithm based on
 *     player position, input direction, difficulty, and randomness.
 *   - "Wild" skulls (loop 2+) bounce diagonally, loosely tracking the player.
 *   - Speed, spawn rate, and ladder aggression scale with loop count.
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
const HAZARD_LADDER_SPEED    = 50;   // px/s descent speed on ladders
const HAZARD_WILD_BOUNCE_VY  = -120; // vertical bounce impulse for wild skulls

class HazardSystem {
  constructor(scene) {
    this.scene = scene;
    this._hazards = [];
    this._spawnTimer = 0;
    this._config = null;
    this._contactCooldown = 0;
    this._platforms = []; // sorted copy of platform data for collision
    this._stopped = false; // true after destroyAll — prevents new spawns during transitions
    this._ladderZones = []; // ladder zones for skull descent

    const data = scene.currentLevelData;
    if (data && data.hazardSpawner) {
      this._config = data.hazardSpawner;
      this._spawnTimer = 500; // first skull almost immediately
      // Cache platforms sorted by Y for efficient lookup
      this._platforms = (data.platforms || []).slice().sort((a, b) => a.y - b.y);
      // Cache ladder zones
      if (scene.ladderSystem) {
        this._ladderZones = scene.ladderSystem.zones;
      }
      this._buildTexture();
      this._buildSpawnerVisual();
      this._spawnPreRolled(data);
    }
  }

  // ── Loop-scaled values ────────────────────────────────────────────────────

  _getLoop() {
    return GameState.currentLoop || 1;
  }

  /** Skull roll speed — increases ~10% each loop */
  _getSpeed() {
    const loop = this._getLoop();
    return this._config.speed + (loop - 1) * 5;
  }

  /** Spawn interval — decreases each loop, minimum 2000ms */
  _getInterval() {
    const loop = this._getLoop();
    return Math.max(this._config.interval - (loop - 1) * 300, 2000);
  }

  /** Chance a skull takes a ladder (base %). Increases with loop. */
  _getLadderChance() {
    const loop = this._getLoop();
    return Math.min(0.15 + (loop - 1) * 0.12, 0.65);
  }

  /** Chance a newly spawned skull is "wild" (bouncing). Loop 2+ only. */
  _getWildChance() {
    const loop = this._getLoop();
    if (loop < 2) return 0;
    return Math.min(0.12 + (loop - 2) * 0.08, 0.45);
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

    // Wild skull texture — slightly different colour (reddish bone)
    const wildKey = 'hazard_skull_wild';
    if (this.scene.textures.exists(wildKey)) return;

    const gfx2 = this.scene.add.graphics();
    gfx2.fillStyle(0xaa7766); // reddish bone
    gfx2.fillRect(0, 0, s, s);
    gfx2.fillStyle(0x442222);
    gfx2.fillRect(1, 2, 2, 2);
    gfx2.fillRect(5, 2, 2, 2);
    gfx2.fillStyle(0x553322);
    gfx2.fillRect(3, 5, 2, 1);

    gfx2.generateTexture(wildKey, s, s);
    gfx2.destroy();
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
    const speed = this._getSpeed();

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
        wild: false,
        onLadder: false,        // currently descending a ladder
        ladderZone: null,       // which ladder zone
        passedLadders: new Set(), // ladder indices already evaluated
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

  // ── DK-style ladder decision ──────────────────────────────────────────

  /**
   * Decide whether a skull should descend a ladder it's passing over.
   * Inspired by the original Donkey Kong barrel algorithm:
   *   1. Skip if skull is already at or below the player
   *   2. Difficulty-gated random chance (increases with loop)
   *   3. "Steering" — if player is moving toward the skull, more likely
   *   4. Fallback random chance
   *
   * @param {Object} h      - the hazard object
   * @param {Object} zone   - the ladder zone
   * @param {Object} player - the player entity
   * @returns {boolean} true if the skull should take the ladder
   */
  _shouldTakeLadder(h, zone, player) {
    if (!player || player.state === 'dead') return false;

    // Step 1: Height check — no point going down if already at/below player
    if (h.y >= player.y) return false;

    // Step 2: Difficulty-gated chance (loop scaling)
    const ladderChance = this._getLadderChance();
    if (Math.random() < ladderChance) return true;

    // Step 3: "Steering" — if player is moving toward the skull
    // (mimics DK's joystick-steering mechanic)
    if (this.scene.inputManager) {
      const input = this.scene.inputManager;
      const skullIsLeft = h.x < player.x;
      const playerMovingLeft = input.isLeftHeld();
      const playerMovingRight = input.isRightHeld();

      // Player moving toward the skull? Higher chance to take ladder
      if ((skullIsLeft && playerMovingLeft) || (!skullIsLeft && playerMovingRight)) {
        if (Math.random() < 0.35) return true;
      }
    }

    // Step 4: Final fallback random (like DK's 25% last chance)
    if (Math.random() < 0.15) return true;

    return false;
  }

  /**
   * Check if a grounded skull overlaps a ladder zone and should descend.
   */
  _checkLadderDescent(h, player) {
    if (h.onLadder || h.wild) return;

    for (let i = 0; i < this._ladderZones.length; i++) {
      if (h.passedLadders.has(i)) continue;

      const zone = this._ladderZones[i];

      // Skull must be horizontally within the ladder zone
      if (h.x < zone.left || h.x > zone.right) continue;

      // Skull must be at the top of this ladder (on the upper platform)
      if (Math.abs(h.y - zone.topY) > 5) continue;

      // Mark as evaluated so we don't re-check every frame
      h.passedLadders.add(i);

      // Run the DK-style decision algorithm
      if (this._shouldTakeLadder(h, zone, player)) {
        h.preLadderDir = Math.sign(h.vx) || 1; // remember roll direction
        h.onLadder = true;
        h.ladderZone = zone;
        h.grounded = false;
        h.vx = 0;
        h.vy = HAZARD_LADDER_SPEED;
        // Snap to ladder centre
        h.x = zone.x;
        return;
      }
    }
  }

  // ── Spawn ───────────────────────────────────────────────────────────────

  _spawn() {
    if (this._hazards.length >= HAZARD_MAX) return;

    const c = this._config;
    const speed = this._getSpeed();
    const isWild = Math.random() < this._getWildChance();

    const textureKey = isWild ? 'hazard_skull_wild' : 'hazard_skull';

    // Visual sprite (rendering only — no physics body)
    const sprite = this.scene.add.sprite(c.x, c.y - HAZARD_SIZE / 2, textureKey);
    sprite.setOrigin(0.5, 0.5);
    sprite.setDepth(5);

    const hazard = {
      sprite: sprite,
      x: c.x,
      y: c.y,              // bottom of skull (feet), starts on platform surface
      vx: (c.initialDirection || 1) * speed,
      vy: 0,
      grounded: true,      // starts on the spawner platform
      age: 0,
      jumpedOver: false,    // true once player earns the jump bonus for this skull
      wild: isWild,
      onLadder: false,
      ladderZone: null,
      passedLadders: new Set(),
    };

    // Wild skulls start with an upward bounce to get airborne
    if (isWild) {
      hazard.grounded = false;
      hazard.vy = HAZARD_WILD_BOUNCE_VY;
      // Slightly faster horizontal
      hazard.vx = (c.initialDirection || 1) * (speed * 1.15);
    }

    this._hazards.push(hazard);
  }

  // ── Wild skull bounce logic ───────────────────────────────────────────

  /**
   * When a wild skull lands on a platform, it bounces back up and
   * adjusts its horizontal direction slightly toward the player.
   */
  _wildBounce(h, player) {
    const speed = this._getSpeed() * 1.15;

    // Bounce upward
    h.vy = HAZARD_WILD_BOUNCE_VY;
    h.grounded = false;

    // Slight horizontal tracking toward player
    if (player && player.state !== 'dead') {
      const dx = player.x - h.x;
      // Bias toward player direction, but keep some randomness
      if (Math.abs(dx) > 20) {
        const trackDir = Math.sign(dx);
        // 60% chance to angle toward player, 40% random
        if (Math.random() < 0.6) {
          h.vx = trackDir * speed;
        } else {
          h.vx = (Math.random() < 0.5 ? 1 : -1) * speed;
        }
      }
    }
  }

  // ── Frame update ────────────────────────────────────────────────────────

  update(delta, player) {
    if (!this._config || this._stopped) return;

    const dt = delta / 1000; // seconds

    if (this._contactCooldown > 0) this._contactCooldown -= delta;

    // Spawn timer (loop-scaled interval)
    this._spawnTimer -= delta;
    if (this._spawnTimer <= 0) {
      this._spawn();
      this._spawnTimer = this._getInterval();
    }

    const worldH = this.scene.currentLevelData.worldHeight;
    const worldW = this.scene.currentLevelData.worldWidth;
    const speed = this._getSpeed();

    for (let i = this._hazards.length - 1; i >= 0; i--) {
      const h = this._hazards[i];

      if (!h.sprite || !h.sprite.active) {
        this._hazards.splice(i, 1);
        continue;
      }

      h.age += delta;

      // ── Movement ──────────────────────────────────────────────────
      if (h.onLadder) {
        // Descending a ladder — move straight down
        h.y += h.vy * dt;
        h.x = h.ladderZone.x; // stay centred on ladder

        // Reached the bottom of the ladder?
        if (h.y >= h.ladderZone.bottomY) {
          h.y = h.ladderZone.bottomY;
          h.onLadder = false;
          const exitX = h.ladderZone.x;
          h.ladderZone = null;
          h.grounded = true;
          h.vy = 0;

          // Pick the direction with more platform space to avoid
          // immediately walking off an edge
          const plat = this._isOnPlatform(exitX, h.y);
          if (plat) {
            const spaceLeft = exitX - plat.x;
            const spaceRight = (plat.x + plat.w) - exitX;
            h.vx = (spaceRight >= spaceLeft ? 1 : -1) * speed;
          } else {
            // Fallback: reverse pre-ladder direction
            h.vx = -(h.preLadderDir || 1) * speed;
          }
        }
      } else if (h.grounded) {
        // Roll horizontally
        h.x += h.vx * dt;
        h.vy = 0;

        // Check ladder descent (DK-style) — only for regular skulls
        if (!h.wild) {
          this._checkLadderDescent(h, player);
        }

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

        // Wild skulls bounce off side walls
        if (h.wild) {
          if (h.x < 4) { h.x = 4; h.vx = Math.abs(h.vx); }
          else if (h.x > worldW - 4) { h.x = worldW - 4; h.vx = -Math.abs(h.vx); }
        }

        // Check if we've passed through any platform during this fall step.
        // Scan all platforms between prevY and h.y to prevent overshooting.
        for (const p of this._platforms) {
          if (h.x >= p.x && h.x <= p.x + p.w) {
            // Platform surface is at p.y. Did we cross it this frame?
            if (prevY <= p.y + 2 && h.y >= p.y - 2 && h.vy > 0) {
              h.y = p.y;
              h.vy = 0;

              if (h.wild) {
                // Wild skulls bounce instead of rolling
                this._wildBounce(h, player);
              } else {
                h.grounded = true;
                h.vx = -Math.sign(h.vx) * speed;
              }
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
        if (!h.jumpedOver && (h.grounded || h.onLadder) && dx < 14 &&
            player.sprite && !player.sprite.body.blocked.down &&
            jumpDy > HAZARD_SIZE && jumpDy < 28) {
          h.jumpedOver = true;
          GameState.score += HAZARD_JUMP_BONUS;
          // Brief floating score text
          const popup = this.scene.add.text(player.x, player.y - 20, `+${HAZARD_JUMP_BONUS}`, {
            fontFamily: GAME_FONT, fontSize: '7px', color: '#ffdd44',
            stroke: '#000000', strokeThickness: 2, padding: FONT_PAD,
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
    this._stopped = true; // prevent new spawns during scene transitions
  }
}

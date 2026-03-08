/**
 * FlyingHazardSystem.js — DK-style flying hazards on a timer.
 *
 * Spawns bats (or crows) that fly horizontally across the screen
 * at or near the player's height. Contact damages the player.
 * Can be killed with one hit for a small score/XP reward.
 *
 * Bats bob up and down in a sine wave as they fly, making them
 * harder to dodge and harder to hit. Amplitude and speed scale
 * with loop count.
 *
 * Configured per-level via levelData.flyingHazard:
 *   {
 *     interval: 8000,        // ms between spawns
 *     speed: 70,             // px/s horizontal
 *     damage: 1,
 *     yOffset: [-20, 20],   // random Y offset from player
 *   }
 *
 * Usage:
 *   // In GameScene.create():
 *   this.flyingHazardSystem = new FlyingHazardSystem(this);
 *
 *   // In GameScene.update():
 *   this.flyingHazardSystem.update(delta, player);
 */

// ── Tuning ──────────────────────────────────────────────────────────────────
const FH_SIZE_W         = 12;  // bat width
const FH_SIZE_H         = 8;   // bat height
const FH_MAX            = 6;   // max simultaneous bats
const FH_CONTACT_CD     = 1000; // ms cooldown between damage to player
const FH_KILL_SCORE     = 30;
const FH_KILL_XP        = 5;
const FH_WING_SPEED     = 200; // ms per wing flap frame

// Sine wave bob defaults
const FH_WAVE_AMP       = 6;   // base amplitude in pixels
const FH_WAVE_FREQ      = 3.0; // base frequency (radians/sec)

class FlyingHazardSystem {
  constructor(scene) {
    this.scene = scene;
    this._bats = [];
    this._spawnTimer = 0;
    this._config = null;
    this._contactCooldown = 0;
    this._elapsed = 0; // total elapsed time for sine wave
    this._stopped = false; // true after destroyAll — prevents spawns during transitions

    const data = scene.currentLevelData;
    if (data && data.flyingHazard) {
      this._config = data.flyingHazard;
      // First bat comes after a short delay
      this._spawnTimer = 3000;
      this._buildTexture();
    }
  }

  // ── Loop-scaled values ────────────────────────────────────────────────────

  _getLoop() {
    return GameState.currentLoop || 1;
  }

  /** Bat horizontal speed — increases each loop */
  _getSpeed() {
    const loop = this._getLoop();
    return this._config.speed + (loop - 1) * 8;
  }

  /** Spawn interval — decreases each loop, minimum 2500ms */
  _getInterval() {
    const loop = this._getLoop();
    return Math.max(this._config.interval - (loop - 1) * 500, 2500);
  }

  /** Sine wave amplitude — increases each loop, capped at 14px */
  _getWaveAmp() {
    const loop = this._getLoop();
    return Math.min(FH_WAVE_AMP + (loop - 1) * 2, 14);
  }

  /** Sine wave frequency — slightly faster each loop */
  _getWaveFreq() {
    const loop = this._getLoop();
    return FH_WAVE_FREQ + (loop - 1) * 0.3;
  }

  // ── Bat texture (simple wing-flap sprite) ──────────────────────────────

  _buildTexture() {
    // Frame 1: wings up
    if (!this.scene.textures.exists('fh_bat_1')) {
      const s = this.scene.add.graphics();
      // Body
      s.fillStyle(0x553355);
      s.fillRect(4, 3, 4, 4);
      // Wings up
      s.fillStyle(0x443344);
      s.fillRect(0, 0, 4, 3);
      s.fillRect(8, 0, 4, 3);
      // Eyes
      s.fillStyle(0xff4444);
      s.fillRect(5, 3, 1, 1);
      s.fillRect(7, 3, 1, 1);
      s.generateTexture('fh_bat_1', FH_SIZE_W, FH_SIZE_H);
      s.destroy();
    }

    // Frame 2: wings down
    if (!this.scene.textures.exists('fh_bat_2')) {
      const s = this.scene.add.graphics();
      // Body
      s.fillStyle(0x553355);
      s.fillRect(4, 1, 4, 4);
      // Wings down
      s.fillStyle(0x443344);
      s.fillRect(0, 4, 4, 3);
      s.fillRect(8, 4, 4, 3);
      // Eyes
      s.fillStyle(0xff4444);
      s.fillRect(5, 1, 1, 1);
      s.fillRect(7, 1, 1, 1);
      s.generateTexture('fh_bat_2', FH_SIZE_W, FH_SIZE_H);
      s.destroy();
    }
  }

  // ── Spawn ─────────────────────────────────────────────────────────────

  _spawn(player) {
    if (this._bats.length >= FH_MAX) return;
    if (!player || player.state === 'dead') return;

    const c = this._config;
    const worldW = this.scene.currentLevelData.worldWidth;
    const speed = this._getSpeed();

    // Pick a side to spawn from — force opposite side if player is near an edge
    const edgeMargin = 40;  // px — if player is within this distance of an edge, bat comes from the other side
    const px = player.x;
    let fromLeft;
    if (px < edgeMargin) {
      fromLeft = false;  // player near left edge → bat comes from right
    } else if (px > worldW - edgeMargin) {
      fromLeft = true;   // player near right edge → bat comes from left
    } else {
      fromLeft = Math.random() < 0.5;
    }
    const startX = fromLeft ? -FH_SIZE_W : worldW + FH_SIZE_W;
    const dir = fromLeft ? 1 : -1;

    // Spawn near the player's Y with a random offset, but not inside a platform
    const offRange = c.yOffset || [-20, 20];
    const platforms = this.scene.currentLevelData.platforms || [];
    let startY = null;

    // Try up to 8 times to find a clear Y that doesn't clip a platform
    for (let attempt = 0; attempt < 8; attempt++) {
      const yOff = offRange[0] + Math.random() * (offRange[1] - offRange[0]);
      const candidateY = Phaser.Math.Clamp(
        player.y + yOff,
        20,
        this.scene.currentLevelData.worldHeight - 20
      );

      let blocked = false;
      for (const p of platforms) {
        // Bat would be inside or just under this platform's surface
        if (candidateY >= p.y - 2 && candidateY <= p.y + p.h + 4) {
          blocked = true;
          break;
        }
      }

      if (!blocked) {
        startY = candidateY;
        break;
      }
    }

    // All attempts blocked — skip this spawn cycle
    if (startY === null) return;

    const sprite = this.scene.add.sprite(startX, startY, 'fh_bat_1');
    sprite.setOrigin(0.5, 0.5);
    sprite.setDepth(7);
    // Flip sprite to face direction of travel
    sprite.setFlipX(!fromLeft);

    this._bats.push({
      sprite: sprite,
      x: startX,
      baseY: startY,       // centre line of the sine wave
      y: startY,
      vx: dir * speed,
      dir: dir,
      alive: true,
      wingTimer: 0,
      wingFrame: 1,
      wavePhase: Math.random() * Math.PI * 2, // random start phase so bats don't sync
    });
  }

  // ── Frame update ──────────────────────────────────────────────────────

  update(delta, player) {
    if (!this._config || this._stopped) return;

    const dt = delta / 1000;
    this._elapsed += dt;

    if (this._contactCooldown > 0) this._contactCooldown -= delta;

    // Spawn timer (loop-scaled)
    this._spawnTimer -= delta;
    if (this._spawnTimer <= 0) {
      this._spawn(player);
      this._spawnTimer = this._getInterval();
    }

    const worldW = this.scene.currentLevelData.worldWidth;
    const waveAmp = this._getWaveAmp();
    const waveFreq = this._getWaveFreq();

    for (let i = this._bats.length - 1; i >= 0; i--) {
      const bat = this._bats[i];

      if (!bat.sprite || !bat.sprite.active) {
        this._bats.splice(i, 1);
        continue;
      }

      // Move horizontally
      bat.x += bat.vx * dt;

      // Sine wave vertical bobbing
      bat.y = bat.baseY + waveAmp * Math.sin(bat.wavePhase + this._elapsed * waveFreq);

      bat.sprite.setPosition(bat.x, bat.y);

      // Wing flap animation
      bat.wingTimer += delta;
      if (bat.wingTimer >= FH_WING_SPEED) {
        bat.wingTimer -= FH_WING_SPEED;
        bat.wingFrame = bat.wingFrame === 1 ? 2 : 1;
        bat.sprite.setTexture('fh_bat_' + bat.wingFrame);
      }

      // Despawn if off the other side of the screen
      if ((bat.dir > 0 && bat.x > worldW + 30) ||
          (bat.dir < 0 && bat.x < -30)) {
        bat.sprite.destroy();
        this._bats.splice(i, 1);
        continue;
      }

      // ── Player contact damage ───────────────────────────────────
      if (bat.alive && player && player.state !== 'dead' &&
          !player.isInvincible && this._contactCooldown <= 0) {
        const pb = player.body;
        if (pb) {
          const dx = Math.abs(pb.center.x - bat.x);
          const dy = Math.abs(pb.center.y - bat.y);

          if (dx < pb.halfWidth + FH_SIZE_W / 2 &&
              dy < pb.halfHeight + FH_SIZE_H / 2) {
            player.takeDamage(this._config.damage || 1, bat.x);
            this._contactCooldown = FH_CONTACT_CD;
          }
        }
      }

      // ── Check if player's attack hitbox kills the bat ───────────
      if (bat.alive) {
        const hitbox = player.attackHitbox;
        if (hitbox && hitbox.body && hitbox.body.enable) {
          const hx = hitbox.x;
          const hy = hitbox.y;
          const hw = hitbox.body.width / 2;
          const hh = hitbox.body.height / 2;

          if (Math.abs(hx - bat.x) < hw + FH_SIZE_W / 2 &&
              Math.abs(hy - bat.y) < hh + FH_SIZE_H / 2) {
            bat.alive = false;
            GameState.score += FH_KILL_SCORE;
            GameState.player.xp += FH_KILL_XP;

            // Death flash and fade
            bat.sprite.setTint(0xffffff);
            this.scene.tweens.add({
              targets: bat.sprite,
              alpha: 0,
              scaleX: 1.5,
              scaleY: 1.5,
              duration: 300,
              ease: 'Cubic.easeOut',
              onComplete: () => {
                if (bat.sprite && bat.sprite.active) bat.sprite.destroy();
              }
            });

            // Score popup
            const popup = this.scene.add.text(bat.x, bat.y - 10, `+${FH_KILL_SCORE}`, {
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
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  destroyAll() {
    for (const bat of this._bats) {
      if (bat.sprite && bat.sprite.active) bat.sprite.destroy();
    }
    this._bats = [];
    this._stopped = true; // prevent new spawns during scene transitions
  }
}

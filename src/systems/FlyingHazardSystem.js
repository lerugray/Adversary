/**
 * FlyingHazardSystem.js — DK-style flying hazards on a timer.
 *
 * Spawns bats (or crows) that fly horizontally across the screen
 * at or near the player's height. Contact damages the player.
 * Can be killed with one hit for a small score/XP reward.
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

class FlyingHazardSystem {
  constructor(scene) {
    this.scene = scene;
    this._bats = [];
    this._spawnTimer = 0;
    this._config = null;
    this._contactCooldown = 0;

    const data = scene.currentLevelData;
    if (data && data.flyingHazard) {
      this._config = data.flyingHazard;
      // First bat comes after a short delay
      this._spawnTimer = 3000;
      this._buildTexture();
    }
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

    // Pick a side to spawn from (random)
    const fromLeft = Math.random() < 0.5;
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
      y: startY,
      vx: dir * c.speed,
      dir: dir,
      alive: true,
      wingTimer: 0,
      wingFrame: 1,
    });
  }

  // ── Frame update ──────────────────────────────────────────────────────

  update(delta, player) {
    if (!this._config) return;

    const dt = delta / 1000;

    if (this._contactCooldown > 0) this._contactCooldown -= delta;

    // Spawn timer
    this._spawnTimer -= delta;
    if (this._spawnTimer <= 0) {
      this._spawn(player);
      this._spawnTimer = this._config.interval;
    }

    const worldW = this.scene.currentLevelData.worldWidth;

    for (let i = this._bats.length - 1; i >= 0; i--) {
      const bat = this._bats[i];

      if (!bat.sprite || !bat.sprite.active) {
        this._bats.splice(i, 1);
        continue;
      }

      // Move horizontally
      bat.x += bat.vx * dt;
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
        const px = player.x;
        const py = player.y - 11;
        const dx = Math.abs(px - bat.x);
        const dy = Math.abs(py - bat.y);

        if (dx < 10 && dy < 10) {
          player.takeDamage(this._config.damage || 1, bat.x);
          this._contactCooldown = FH_CONTACT_CD;
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
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  destroyAll() {
    for (const bat of this._bats) {
      if (bat.sprite && bat.sprite.active) bat.sprite.destroy();
    }
    this._bats = [];
  }
}

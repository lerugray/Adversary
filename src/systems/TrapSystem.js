/**
 * TrapSystem.js — Environmental trap manager (Sen's Fortress style).
 *
 * Two trap types:
 *   1. Pendulum blades — swing back and forth over platforms
 *   2. Dart traps     — wall-mounted arrows on a timer
 *
 * Configured per-level via levelData.traps:
 *   {
 *     pendulums: [
 *       { anchorX, anchorY, length, damage, speed, startAngle },
 *     ],
 *     dartTraps: [
 *       { x, y, direction, interval, speed, damage },
 *     ],
 *   }
 *
 * Usage:
 *   this.trapSystem = new TrapSystem(this);
 *   this.trapSystem.update(delta, player);
 */

// ── Pendulum tuning ─────────────────────────────────────────────────────────
const PEND_BLADE_W     = 4;
const PEND_BLADE_H     = 10;
const PEND_SWING_ARC   = 1.3;    // radians each side of center (~75 degrees)
const PEND_CONTACT_CD  = 1000;   // ms between damage ticks per pendulum

// ── Dart tuning ─────────────────────────────────────────────────────────────
const DART_W           = 8;
const DART_H           = 3;
const DART_LIFETIME    = 3000;   // ms before auto-despawn
const DART_CONTACT_CD  = 800;    // ms cooldown after dart damages player
const DART_JUMP_BONUS  = 25;     // score for jumping over a dart

class TrapSystem {
  constructor(scene) {
    this.scene = scene;
    this._pendulums = [];
    this._dartTraps = [];
    this._darts = [];       // active flying darts
    this._pendCD = 0;       // global pendulum contact cooldown
    this._dartCD = 0;       // global dart contact cooldown

    const data = scene.currentLevelData;
    if (data && data.traps) {
      if (data.traps.pendulums) this._buildPendulums(data.traps.pendulums);
      if (data.traps.dartTraps) this._buildDartTraps(data.traps.dartTraps);
    }
  }

  // ── Pendulums ─────────────────────────────────────────────────────────────

  _buildPendulums(defs) {
    for (const def of defs) {
      const ax = def.anchorX;
      const ay = def.anchorY;
      const len = def.length || 30;
      const speed = def.speed || 1.5;  // radians/sec
      const damage = def.damage || 1;
      const startAngle = def.startAngle || 0;

      // Chain/arm visual (thin line)
      const arm = this.scene.add.rectangle(ax, ay, 2, len, 0x888888)
        .setOrigin(0.5, 0).setDepth(6);

      // Blade at the end
      const blade = this.scene.add.rectangle(ax, ay + len, PEND_BLADE_W, PEND_BLADE_H, 0xcccccc)
        .setOrigin(0.5, 0).setDepth(7);

      // Blade edge highlight
      const edge = this.scene.add.rectangle(ax, ay + len, PEND_BLADE_W, 2, 0xffffff, 0.6)
        .setOrigin(0.5, 0).setDepth(7);

      // Anchor point (rivet)
      this.scene.add.circle(ax, ay, 3, 0x666666).setDepth(8);

      this._pendulums.push({
        ax, ay, len, speed, damage, startAngle,
        angle: startAngle,
        arm, blade, edge,
        bladeX: ax, bladeY: ay + len,
      });
    }
  }

  _updatePendulums(delta, player) {
    const dt = delta / 1000;

    if (this._pendCD > 0) this._pendCD -= delta;

    for (const p of this._pendulums) {
      // Swing using sine wave
      p.angle = Math.sin(this.scene.time.now / 1000 * p.speed + p.startAngle) * PEND_SWING_ARC;

      // Calculate blade position
      const bx = p.ax + Math.sin(p.angle) * p.len;
      const by = p.ay + Math.cos(p.angle) * p.len;
      p.bladeX = bx;
      p.bladeY = by;

      // Rotate and position arm
      p.arm.setPosition(p.ax, p.ay);
      p.arm.setRotation(p.angle);

      // Position blade at end of arm
      p.blade.setPosition(bx, by);
      p.blade.setRotation(p.angle);
      p.edge.setPosition(bx, by);
      p.edge.setRotation(p.angle);

      // Player collision
      if (player && player.state !== 'dead' && !player.isInvincible && this._pendCD <= 0) {
        const px = player.x;
        const py = player.y - 11;
        const dx = Math.abs(px - bx);
        const dy = Math.abs(py - by);

        if (dx < PEND_BLADE_W / 2 + 5 && dy < PEND_BLADE_H / 2 + 8) {
          player.takeDamage(p.damage, bx);
          this._pendCD = PEND_CONTACT_CD;
        }
      }
    }
  }

  // ── Dart traps ────────────────────────────────────────────────────────────

  _buildDartTraps(defs) {
    for (const def of defs) {
      const x = def.x;
      const y = def.y;
      const dir = def.direction || 1;  // 1 = right, -1 = left
      const interval = def.interval || 2500;
      const speed = def.speed || 120;
      const damage = def.damage || 1;

      // Wall-mounted launcher visual
      const launcherW = 6;
      const launcherH = 8;
      const launcher = this.scene.add.rectangle(x, y, launcherW, launcherH, 0x555555)
        .setDepth(6);
      // Dark slot where darts emerge
      this.scene.add.rectangle(x + dir * 3, y, 3, 4, 0x222222).setDepth(6);

      this._dartTraps.push({
        x, y, dir, interval, speed, damage,
        timer: interval * 0.3, // first dart comes quickly
        launcher,
      });
    }
  }

  _fireDart(trap) {
    const sprite = this.scene.add.rectangle(
      trap.x + trap.dir * 6, trap.y,
      DART_W, DART_H, 0xdddd44
    ).setDepth(7);

    // Brief flash on launcher
    trap.launcher.setFillStyle(0xffaa00);
    this.scene.time.delayedCall(100, () => {
      if (trap.launcher && trap.launcher.active) trap.launcher.setFillStyle(0x555555);
    });

    this._darts.push({
      sprite: sprite,
      x: trap.x + trap.dir * 6,
      y: trap.y,
      vx: trap.dir * trap.speed,
      damage: trap.damage,
      age: 0,
      jumpedOver: false,
    });
  }

  _updateDartTraps(delta, player) {
    const dt = delta / 1000;

    if (this._dartCD > 0) this._dartCD -= delta;

    // Spawn timers
    for (const trap of this._dartTraps) {
      trap.timer -= delta;
      if (trap.timer <= 0) {
        this._fireDart(trap);
        trap.timer = trap.interval;
      }
    }

    const worldW = this.scene.currentLevelData.worldWidth;

    // Update active darts
    for (let i = this._darts.length - 1; i >= 0; i--) {
      const d = this._darts[i];

      if (!d.sprite || !d.sprite.active) {
        this._darts.splice(i, 1);
        continue;
      }

      d.x += d.vx * dt;
      d.age += delta;
      d.sprite.setPosition(d.x, d.y);

      // Despawn if off-screen or expired
      if (d.x < -10 || d.x > worldW + 10 || d.age > DART_LIFETIME) {
        d.sprite.destroy();
        this._darts.splice(i, 1);
        continue;
      }

      // Player collision
      if (player && player.state !== 'dead' && !player.isInvincible && this._dartCD <= 0) {
        const px = player.x;
        const py = player.y - 11;
        const dx = Math.abs(px - d.x);
        const dy = Math.abs(py - d.y);

        if (dx < DART_W / 2 + 5 && dy < DART_H / 2 + 8) {
          player.takeDamage(d.damage, d.x);
          this._dartCD = DART_CONTACT_CD;
          // Dart is consumed on hit
          d.sprite.destroy();
          this._darts.splice(i, 1);
          continue;
        }
      }

      // Jump-over bonus — player is airborne, horizontally close, and above the dart
      if (player && player.state !== 'dead' && !d.jumpedOver &&
          player.sprite && !player.sprite.body.blocked.down) {
        const dx = Math.abs(player.x - d.x);
        const jumpDy = d.y - player.y;
        if (dx < 14 && jumpDy > 4 && jumpDy < 24) {
          d.jumpedOver = true;
          GameState.score += DART_JUMP_BONUS;
          const popup = this.scene.add.text(player.x, player.y - 20, `+${DART_JUMP_BONUS}`, {
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

  // ── Frame update ──────────────────────────────────────────────────────────

  update(delta, player) {
    this._updatePendulums(delta, player);
    this._updateDartTraps(delta, player);
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroyAll() {
    for (const d of this._darts) {
      if (d.sprite && d.sprite.active) d.sprite.destroy();
    }
    this._darts = [];
  }
}

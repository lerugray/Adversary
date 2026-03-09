/**
 * ElevatorSystem.js — DK-style cycling elevator platforms.
 *
 * Creates vertical elevator shafts with platforms that cycle continuously.
 * Left shaft goes UP, right shaft goes DOWN (classic DK 75m layout).
 * Platforms wrap around when they pass the shaft bounds.
 *
 * Uses velocity-based movement so Phaser Arcade physics resolves
 * collisions properly (manual position updates break collision).
 *
 * Levels can also define `shaftBlockers` — static platforms placed
 * inside elevator shafts that force the player to jump off and
 * traverse the level rather than riding straight to the top.
 *
 * Configured per-level via levelData.elevators and levelData.shaftBlockers.
 *
 * Usage:
 *   // In GameScene.create(), after player is created:
 *   this.elevatorSystem = new ElevatorSystem(this);
 *
 *   // In GameScene.update():
 *   this.elevatorSystem.update(delta);
 */

// ── Tuning ──────────────────────────────────────────────────────────────────
const ELEV_DEFAULT_COLOR     = 0x5577aa;
const ELEV_HIGHLIGHT_COLOR   = 0x7799cc;
const ELEV_RIDE_TOLERANCE    = 6;   // px tolerance for "standing on" detection
const ELEV_X_TOLERANCE       = 3;   // px leeway for horizontal overlap

class ElevatorSystem {
  constructor(scene) {
    this.scene = scene;
    this._platforms = [];
    this._group = null;
    this._collider = null;

    const data = scene.currentLevelData;
    if (data && data.elevators) {
      this._build(data.elevators);
      this._buildBlockers(data.shaftBlockers);
    }
  }

  // ── Build elevator shafts from level data ─────────────────────────────────

  _build(elevatorDefs) {
    this._group = this.scene.physics.add.group({
      immovable: true,
      allowGravity: false,
    });

    for (const def of elevatorDefs) {
      const range = def.maxY - def.minY;
      const spacing = range / def.count;
      const color = def.color || ELEV_DEFAULT_COLOR;
      const hlColor = def.hlColor || ELEV_HIGHLIGHT_COLOR;

      for (let i = 0; i < def.count; i++) {
        const startY = def.minY + i * spacing;

        // Main platform rectangle
        const rect = this.scene.add.rectangle(
          def.x, startY, def.w, def.h, color
        ).setDepth(3);

        this.scene.physics.add.existing(rect, false);
        rect.body.setImmovable(true);
        rect.body.setAllowGravity(false);
        // One-way platform: only collide on top
        rect.body.checkCollision.down = false;
        rect.body.checkCollision.left = false;
        rect.body.checkCollision.right = false;

        // Set velocity for movement (physics engine needs this for collision)
        rect.body.setVelocityY(def.speed);

        // Top highlight (NES-style edge)
        const highlight = this.scene.add.rectangle(
          def.x, startY - def.h / 2 + 1, def.w, 2, hlColor
        ).setDepth(4);

        const platform = {
          rect,
          highlight,
          x: def.x,
          w: def.w,
          h: def.h,
          speed: def.speed,
          minY: def.minY,
          maxY: def.maxY,
        };

        this._platforms.push(platform);
        this._group.add(rect);
      }
    }

    // Collider with player
    const player = this.scene.player;
    if (player && player.gameObject) {
      this._collider = this.scene.physics.add.collider(
        player.gameObject, this._group
      );
    }
  }

  // ── Build shaft blockers (static geometry that forces player off) ─────────

  _buildBlockers(blockerDefs) {
    if (!blockerDefs || blockerDefs.length === 0) return;

    // Add blockers to the scene's existing static platform group
    // so they behave identically to normal platforms
    const platforms = this.scene.platforms;

    for (const b of blockerDefs) {
      const color = b.color || 0x3a3545;

      const rect = this.scene.add.rectangle(
        b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, color
      ).setDepth(2);

      // Top highlight
      this.scene.add.rectangle(
        b.x + b.w / 2, b.y + 1, b.w, 2,
        Phaser.Display.Color.IntegerToColor(color).lighten(15).color
      ).setDepth(3);

      platforms.add(rect);
    }

    platforms.refresh();
  }

  // ── Frame update ──────────────────────────────────────────────────────────

  update(delta) {
    if (this._platforms.length === 0) return;

    const dt = delta / 1000;
    const player = this.scene.player;
    const pb = player && player.sprite ? player.sprite.body : null;

    for (const plat of this._platforms) {
      const rect = plat.rect;
      const y = rect.y;

      // Wrap around at shaft bounds (teleport to other end)
      let wrapped = false;
      if (plat.speed < 0 && y < plat.minY) {
        rect.setY(plat.maxY);
        rect.body.updateFromGameObject();
        wrapped = true;
      } else if (plat.speed > 0 && y > plat.maxY) {
        rect.setY(plat.minY);
        rect.body.updateFromGameObject();
        wrapped = true;
      }

      // Keep velocity set (Phaser can reset it on collision)
      rect.body.setVelocityY(plat.speed);

      // Sync highlight visual with platform position
      plat.highlight.setPosition(rect.x, rect.y - plat.h / 2 + 1);

      // ── Player riding detection for downward elevators ─────────
      // Arcade physics pushes player UP when on a rising platform,
      // but for descending platforms the player floats. Detect and
      // nudge the player downward.
      if (pb && plat.speed > 0 && player.state !== 'dead' && !wrapped) {
        const platTop = rect.y - plat.h / 2;
        const playerBottom = pb.bottom;
        const isOnTop = Math.abs(playerBottom - platTop) < ELEV_RIDE_TOLERANCE;
        const isWithinX = pb.center.x > rect.x - plat.w / 2 - ELEV_X_TOLERANCE &&
                          pb.center.x < rect.x + plat.w / 2 + ELEV_X_TOLERANCE;

        if (isOnTop && isWithinX && pb.velocity.y >= -10) {
          player.sprite.y += plat.speed * dt;
        }
      }
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroyAll() {
    if (this._collider) {
      this.scene.physics.world.removeCollider(this._collider);
      this._collider = null;
    }
    for (const plat of this._platforms) {
      if (plat.rect && plat.rect.active) plat.rect.destroy();
      if (plat.highlight && plat.highlight.active) plat.highlight.destroy();
    }
    this._platforms = [];
  }
}

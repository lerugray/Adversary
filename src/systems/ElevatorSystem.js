/**
 * ElevatorSystem.js — DK-style cycling elevator platforms.
 *
 * Creates vertical elevator shafts with platforms that cycle continuously.
 * Left shaft goes UP, right shaft goes DOWN (classic DK 75m layout).
 * Platforms wrap around when they pass the shaft bounds.
 *
 * Configured per-level via levelData.elevators:
 *   [
 *     {
 *       x: 85,        // center X of shaft
 *       w: 28,        // platform width
 *       h: 6,         // platform height
 *       minY: 40,     // top of shaft (platforms wrap here)
 *       maxY: 210,    // bottom of shaft
 *       speed: -40,   // px/s (negative = up, positive = down)
 *       count: 3,     // number of platforms in this shaft
 *       color: 0x6688aa,  // optional platform color
 *     },
 *   ]
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
const ELEV_RIDE_TOLERANCE    = 5;   // px tolerance for "standing on" detection
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
    }
  }

  // ── Build elevator shafts from level data ─────────────────────────────────

  _build(elevatorDefs) {
    this._group = this.scene.physics.add.group();

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
        rect.body.checkCollision.down = false;  // one-way: only collide on top
        rect.body.checkCollision.left = false;
        rect.body.checkCollision.right = false;

        // Top highlight (NES-style edge)
        const highlight = this.scene.add.rectangle(
          def.x, startY - def.h / 2 + 1, def.w, 2, hlColor
        ).setDepth(4);

        const platform = {
          rect,
          highlight,
          y: startY,
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

  // ── Frame update ──────────────────────────────────────────────────────────

  update(delta) {
    if (this._platforms.length === 0) return;

    const dt = delta / 1000;
    const player = this.scene.player;
    const pb = player && player.sprite ? player.sprite.body : null;

    for (const plat of this._platforms) {
      const oldY = plat.y;

      // Move platform
      plat.y += plat.speed * dt;

      // Wrap around at shaft bounds
      if (plat.speed < 0 && plat.y < plat.minY) {
        plat.y = plat.maxY;
      } else if (plat.speed > 0 && plat.y > plat.maxY) {
        plat.y = plat.minY;
      }

      // Update visual + physics positions
      plat.rect.setPosition(plat.x, plat.y);
      plat.highlight.setPosition(plat.x, plat.y - plat.h / 2 + 1);
      plat.rect.body.updateFromGameObject();

      // ── Player riding detection ─────────────────────────────────
      // For downward elevators, Arcade physics won't pull the player
      // down automatically. We detect if the player is standing on
      // this platform and nudge them along.
      if (pb && plat.speed > 0 && player.state !== 'dead') {
        const platTop = plat.y - plat.h / 2;
        const playerBottom = pb.bottom;
        const isOnTop = Math.abs(playerBottom - platTop) < ELEV_RIDE_TOLERANCE;
        const isWithinX = pb.center.x > plat.x - plat.w / 2 - ELEV_X_TOLERANCE &&
                          pb.center.x < plat.x + plat.w / 2 + ELEV_X_TOLERANCE;

        if (isOnTop && isWithinX && pb.velocity.y >= -10) {
          // Nudge player down with the platform
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

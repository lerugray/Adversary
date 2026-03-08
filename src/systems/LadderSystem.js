/**
 * LadderSystem.js — Manages ladder zones and player/enemy climb interactions.
 *
 * Phase 3: player climbing only.
 * Phase 4: enemies will call LadderSystem.getZoneAt(x, y) to pathfind.
 *
 * Usage (in GameScene.create):
 *   this.ladderSystem = new LadderSystem(this, Level1Data.ladders);
 *
 * Usage (in GameScene.update):
 *   this.ladderSystem.update(this.player, this.inputManager);
 *
 * Architecture note:
 *   Ladder zones are plain JS objects — no Phaser physics bodies are used.
 *   Overlap is tested manually each frame with AABB (axis-aligned bounding box)
 *   checks. This is deliberately lightweight and easy for enemy AI to query
 *   without needing physics group membership.
 *
 * Public API for Phase 4 enemies:
 *   ladderSystem.zones          — array of raw zone objects from Level data
 *   ladderSystem.getZoneAt(x,y) — returns the zone overlapping world (x,y), or null
 *   ladderSystem.isOnLadder(entity) — returns true if entity is inside any zone
 */

class LadderSystem {
  /**
   * @param {Phaser.Scene}  scene
   * @param {Object[]}      zoneDefs  - Array from LevelXData.ladders
   */
  constructor(scene, zoneDefs) {
    this.scene = scene;

    /** @type {LadderZone[]} — public; Phase 4 enemies read this directly. */
    this.zones = [];

    // ── Build zone objects and their visuals ───────────────────────────────
    zoneDefs.forEach(def => this._buildZone(def));
  }

  // ── Zone construction ─────────────────────────────────────────────────────

  /**
   * Create one ladder zone from a raw data definition.
   * @param {{ x, topY, bottomY, w }} def
   */
  _buildZone(def) {
    const zone = {
      // Logical bounds
      x:       def.x,          // horizontal centre
      topY:    def.topY,
      bottomY: def.bottomY,
      w:       def.w,

      // Derived AABB (left/right edges)
      left:  def.x - def.w / 2,
      right: def.x + def.w / 2,
    };

    // ── Ladder visual: two amber vertical lines ────────────────────────────
    const RUNG_COLOR  = 0x8b6914;   // warm amber-brown
    const RAIL_COLOR  = 0x7a5c10;
    const height      = def.bottomY - def.topY;
    const cx          = def.x;

    // Left rail
    const lRail = this.scene.add.rectangle(
      cx - 4, def.topY + height / 2,
      2, height,
      RAIL_COLOR
    ).setDepth(1);

    // Right rail
    const rRail = this.scene.add.rectangle(
      cx + 4, def.topY + height / 2,
      2, height,
      RAIL_COLOR
    ).setDepth(1);

    // Rungs — spaced every 8 px
    const rungs = [];
    const RUNG_SPACING = 8;
    for (let ry = def.topY + 4; ry < def.bottomY - 2; ry += RUNG_SPACING) {
      const rung = this.scene.add.rectangle(cx, ry, 10, 2, RUNG_COLOR).setDepth(1);
      rungs.push(rung);
    }

    zone.visuals = { lRail, rRail, rungs };
    this.zones.push(zone);
  }

  // ── Public query API ──────────────────────────────────────────────────────

  /**
   * Returns the ladder zone whose bounds contain world position (x, y), or null.
   * Phase 4 enemies call this to determine whether they can climb at a position.
   *
   * @param {number} x
   * @param {number} y
   * @returns {Object|null}
   */
  getZoneAt(x, y) {
    for (const zone of this.zones) {
      if (x >= zone.left && x <= zone.right &&
          y >= zone.topY  && y <= zone.bottomY) {
        return zone;
      }
    }
    return null;
  }

  /**
   * Returns true if the entity's body centre overlaps any ladder zone.
   * @param {{ x: number, y: number }} entity — any object with world x/y
   * @returns {boolean}
   */
  isOnLadder(entity) {
    return this.getZoneAt(entity.x, entity.y) !== null;
  }

  // ── Player climb logic ────────────────────────────────────────────────────

  /**
   * Called every frame from GameScene.update().
   * Manages climb mode entry/exit and vertical movement for the player.
   *
   * @param {PlayerEntity} player
   * @param {InputManager} input
   * @param {number}       delta   ms since last frame
   */
  update(player, input, delta) {
    const sprite = player.gameObject;
    const body   = player.body;

    // Foot and mid positions for overlap checks
    const px  = sprite.x;
    const py  = sprite.y;            // feet (origin is at feet)
    const midY = py - 11;            // approximate body mid-point

    // Check which zone the player's body centre is inside
    const zone = this.getZoneAt(px, midY);

    if (!player._isClimbing) {
      // ── Not yet climbing ─────────────────────────────────────────────
      if (zone) {
        // Player is horizontally aligned with a ladder
        if (input.isUpHeld() && midY > zone.topY) {
          // Initiate climb going up
          this._enterClimb(player, zone);
        } else if (input.isDownHeld() && midY < zone.bottomY - 4) {
          // Initiate climb going down (step off platform edge onto ladder)
          this._enterClimb(player, zone);
        }
      }
    } else {
      // ── Currently climbing ───────────────────────────────────────────
      const activeZone = player._climbZone;

      // Exit conditions: jump off, or scrolled outside zone bounds
      const exitJump  = input.isJumpJustPressed();
      const outOfZone = !activeZone ||
                        px < activeZone.left - 2 ||
                        px > activeZone.right + 2 ||
                        midY < activeZone.topY - 2 ||
                        midY > activeZone.bottomY + 2;

      if (exitJump || outOfZone) {
        this._exitClimb(player, input);
        return;
      }

      // Left/right changes facing direction (for attacks) but stays on ladder
      if (input.isLeftHeld())  { player.facing = -1; sprite.setFlipX(true);  }
      if (input.isRightHeld()) { player.facing =  1; sprite.setFlipX(false); }

      // ── Vertical movement on ladder ──────────────────────────────────
      const CLIMB_SPEED = 60; // px/s

      if (input.isUpHeld()) {
        body.setVelocityY(-CLIMB_SPEED);

        // Snap horizontally to ladder centre for clean look
        body.setVelocityX(0);
        sprite.setX(Phaser.Math.Linear(sprite.x, activeZone.x, 0.3));

        // Reached the top of the zone → dismount onto upper platform
        if (midY <= activeZone.topY + 4) {
          sprite.setY(activeZone.topY - 1);
          body.setVelocityY(0);
          this._exitClimb(player, input);
        }
      } else if (input.isDownHeld()) {
        body.setVelocityY(CLIMB_SPEED);

        body.setVelocityX(0);
        sprite.setX(Phaser.Math.Linear(sprite.x, activeZone.x, 0.3));

        // Reached the bottom of the zone → dismount onto lower platform
        if (py >= activeZone.bottomY - 4) {
          this._exitClimb(player, input);
        }
      } else {
        // Idle on ladder — freeze in place
        body.setVelocityY(0);
        body.setVelocityX(0);
      }

      // Visual feedback: cycle tint to suggest climbing animation
      const phase = Math.floor(Date.now() / 200) % 2;
      sprite.setTint(phase === 0 ? 0x88ccff : 0x66aadd);
    }
  }

  // ── Climb state helpers ───────────────────────────────────────────────────

  /**
   * Put the player into climb mode.
   * @param {PlayerEntity}  player
   * @param {Object}        zone
   */
  _enterClimb(player, zone) {
    player._isClimbing  = true;
    player._climbZone   = zone;

    const body = player.body;

    // Disable gravity while on ladder
    body.setAllowGravity(false);
    body.setVelocity(0, 0);

    // Disable platform collision so player can pass through platforms while climbing
    if (this.scene.playerPlatformCollider) {
      this.scene.playerPlatformCollider.active = false;
    }

    // Snap X to ladder centre for visual cleanliness
    player.gameObject.setX(zone.x);
  }

  /**
   * Return player to normal physics.
   * @param {PlayerEntity}  player
   * @param {InputManager}  input
   */
  _exitClimb(player, input) {
    player._isClimbing = false;
    player._climbZone  = null;

    const body = player.body;
    body.setAllowGravity(true);

    // Re-enable platform collision
    if (this.scene.playerPlatformCollider) {
      this.scene.playerPlatformCollider.active = true;
    }

    // If exiting via jump, apply a small upward kick
    if (input.isJumpJustPressed()) {
      body.setVelocityY(-180);
    }

    // Restore player tint
    player.gameObject.setTint(0x88ccff);
  }
}

/**
 * GearHazardSystem.js — Frame-timed crushing gears for The Iron Passage.
 *
 * Level data owns the rhythm. The system only advances a 60fps frame clock,
 * swaps between four hard-edged gear silhouettes, and applies contact damage
 * while the authored danger window is open.
 *
 * Usage:
 *   this.gearHazardSystem = new GearHazardSystem(this, data.gearHazards);
 *   this.gearHazardSystem.update(this.player, delta);
 */

// ── Gear tuning ──────────────────────────────────────────────────────────────
const GEAR_DEFAULT_RADIUS          = 8;
const GEAR_DEFAULT_ROTATION_RATE   = 4;   // animation frames per second
const GEAR_DEFAULT_DAMAGE          = 1;
const GEAR_DEFAULT_CYCLE_FRAMES    = 120; // 2 seconds at 60fps
const GEAR_DEFAULT_DANGER_FRAMES   = 60;  // half danger, half safe
const GEAR_CONTACT_COOLDOWN        = 1000;

class GearHazardSystem {
  constructor(scene, gearDefs) {
    this.scene = scene;
    this._gears = [];

    if (gearDefs && gearDefs.length > 0) {
      this._buildGears(gearDefs);
    }
  }

  // ── Texture generation ────────────────────────────────────────────────────

  _texturePrefix(radius) {
    return `gear_hazard_${radius}`;
  }

  _ensureTextures(radius) {
    const prefix = this._texturePrefix(radius);
    if (this.scene.textures.exists(`${prefix}_safe_0`)) return;

    for (let frame = 0; frame < 4; frame++) {
      this._buildTexture(radius, frame, false);
      this._buildTexture(radius, frame, true);
    }
  }

  _buildTexture(radius, frame, dangerous) {
    const prefix = this._texturePrefix(radius);
    const key = `${prefix}_${dangerous ? 'danger' : 'safe'}_${frame}`;
    const size = radius * 2;
    const center = radius;
    const gfx = this.scene.add.graphics();

    // Teeth use the Iron Passage mechanical palette. The red glint is the
    // danger tell, not decoration, so the safe frame stays deliberately dull.
    gfx.fillStyle(0xcc6800);
    this._drawTeeth(gfx, size, frame);

    gfx.fillStyle(0x503000);
    gfx.fillRect(center - 5, center - 5, 10, 10);
    gfx.fillRect(center - 7, center - 2, 14, 4);
    gfx.fillRect(center - 2, center - 7, 4, 14);

    gfx.fillStyle(0x000000);
    gfx.fillRect(center - 2, center - 2, 4, 4);

    if (dangerous) {
      gfx.fillStyle(0xa40000);
      gfx.fillRect(center + 3, center - 4, 2, 2);
    } else {
      gfx.fillStyle(0x884000);
      gfx.fillRect(center + 4, center - 4, 1, 1);
    }

    gfx.generateTexture(key, size, size);
    gfx.destroy();
  }

  _drawTeeth(gfx, size, frame) {
    const max = size - 4;
    const mid = size / 2;

    if (frame === 0 || frame === 2) {
      const offset = frame === 0 ? 0 : 1;
      gfx.fillRect(mid - 2 + offset, 0, 4, 4);
      gfx.fillRect(mid - 2 - offset, size - 4, 4, 4);
      gfx.fillRect(0, mid - 2 - offset, 4, 4);
      gfx.fillRect(size - 4, mid - 2 + offset, 4, 4);
      return;
    }

    const inset = frame === 1 ? 1 : 2;
    gfx.fillRect(inset, inset, 4, 4);
    gfx.fillRect(max - inset, inset, 4, 4);
    gfx.fillRect(inset, max - inset, 4, 4);
    gfx.fillRect(max - inset, max - inset, 4, 4);
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  _buildGears(defs) {
    for (const def of defs) {
      const radius = def.radius || GEAR_DEFAULT_RADIUS;
      const rhythm = def.crushingRhythm || {};

      this._ensureTextures(radius);

      const gear = {
        x: def.x,
        y: def.y,
        radius: radius,
        rotationRate: def.rotationRate || GEAR_DEFAULT_ROTATION_RATE,
        damage: def.damage || GEAR_DEFAULT_DAMAGE,
        cycleFrames: rhythm.cycleFrames || GEAR_DEFAULT_CYCLE_FRAMES,
        dangerFrames: rhythm.dangerFrames || GEAR_DEFAULT_DANGER_FRAMES,
        frameClock: rhythm.phaseFrames || 0,
        rotationClock: def.startFrame || 0,
        contactCooldown: 0,
        wasDangerous: false,
        sprite: null,
      };

      const textureKey = this._textureKey(gear, false);
      gear.sprite = this.scene.add.sprite(gear.x, gear.y, textureKey)
        .setOrigin(0.5, 0.5)
        .setDepth(7);

      this._gears.push(gear);
    }
  }

  _textureKey(gear, dangerous) {
    const frame = this._rotationFrame(gear);
    return `${this._texturePrefix(gear.radius)}_${dangerous ? 'danger' : 'safe'}_${frame}`;
  }

  _rotationFrame(gear) {
    const frame = Math.floor(gear.rotationClock) % 4;
    return frame < 0 ? frame + 4 : frame;
  }

  _isDangerous(gear) {
    const cycle = Math.max(gear.cycleFrames, 1);
    const frame = gear.frameClock % cycle;
    return frame < gear.dangerFrames;
  }

  // ── Collision helpers ─────────────────────────────────────────────────────

  _playerOverlapsGear(player, gear) {
    const body = player && player.body;
    if (!body) return false;

    const closestX = Phaser.Math.Clamp(gear.x, body.left, body.right);
    const closestY = Phaser.Math.Clamp(gear.y, body.top, body.bottom);
    const dx = gear.x - closestX;
    const dy = gear.y - closestY;

    return dx * dx + dy * dy <= gear.radius * gear.radius;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  update(player, delta) {
    if (this._gears.length === 0) return;

    const frameDelta = delta / (1000 / 60);

    for (const gear of this._gears) {
      gear.frameClock += frameDelta;
      gear.rotationClock += gear.rotationRate * (delta / 1000);
      if (gear.contactCooldown > 0) gear.contactCooldown -= delta;

      const dangerous = this._isDangerous(gear);
      if (gear.sprite && gear.sprite.active) {
        gear.sprite.setTexture(this._textureKey(gear, dangerous));
      }
      gear.wasDangerous = dangerous;

      if (!dangerous) continue;
      if (!player || player.state === 'dead' || player.isInvincible) continue;
      if (gear.contactCooldown > 0) continue;

      if (this._playerOverlapsGear(player, gear)) {
        player.takeDamage(gear.damage, gear.x);
        gear.contactCooldown = GEAR_CONTACT_COOLDOWN;
      }
    }
  }

  getActiveGearAt(x, y) {
    for (const gear of this._gears) {
      if (!this._isDangerous(gear)) continue;

      const dx = x - gear.x;
      const dy = y - gear.y;
      if (dx * dx + dy * dy <= gear.radius * gear.radius) {
        return gear;
      }
    }

    return null;
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  destroyAll() {
    for (const gear of this._gears) {
      if (gear.sprite && gear.sprite.active) gear.sprite.destroy();
    }
    this._gears = [];
  }
}

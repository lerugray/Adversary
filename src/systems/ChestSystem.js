/**
 * ChestSystem.js — Manages chest spawning, mimic detection, and drops (Phase 6).
 *
 * Chests only appear after the first successful loop (currentLoop >= 2).
 * They spawn contextually:
 *   - After an enemy kill (chance-based, higher for multi-kills)
 *   - Mimics look identical to chests but have a subtle breathing animation
 *
 * Normal chests: higher-than-normal chance of equipment drops.
 * Mimics: see Mimic.js for full behavior.
 *
 * Mimic chance increases with each loop.
 *
 * Usage:
 *   // In GameScene.create():
 *   this.chestSystem = new ChestSystem(this);
 *
 *   // In GameScene.update():
 *   this.chestSystem.update(delta, player);
 *
 *   // When an enemy dies (called from GameScene attack collision):
 *   this.chestSystem.onEnemyKilled(x, y);
 */

// ── Chest tuning ────────────────────────────────────────────────────────────
const CHEST_W             = 12;
const CHEST_H             = 10;
const CHEST_COLOR         = 0x8B6914;   // brown/gold — matches mimic disguise
const CHEST_HIGHLIGHT     = 0xBB9924;   // lighter trim on top

const CHEST_SPAWN_CHANCE  = 0.15;       // base chance per enemy kill
const CHEST_MULTI_BONUS   = 0.10;       // bonus chance if 2+ kills within 2s
const CHEST_LIFETIME      = 15000;      // ms before uncollected chest vanishes

// Mimic chance: base + (loop - 2) * increment, capped
const MIMIC_BASE_CHANCE   = 0.25;       // 25% of spawned chests are mimics on loop 2
const MIMIC_LOOP_INCREMENT = 0.08;      // +8% per additional loop
const MIMIC_MAX_CHANCE    = 0.65;       // never more than 65% mimics

// Chest drop table (better than normal enemy drops)
const CHEST_DROP_TABLE = [
  { type: 'weapon', chance: 0.30 },
  { type: 'armor',  chance: 0.30 },
  { type: 'heart',  chance: 0.50 },
  { type: 'mana_shard', chance: 1.0 },  // fallback
];

class ChestSystem {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene  = scene;
    this.chests = [];   // array of { obj, highlight, lifetime, opened }
    this.mimics = [];   // array of Mimic instances (managed by EnemyManager too)

    // Track recent kills for multi-kill bonus
    this._recentKillTimestamps = [];
    this._killWindowMs = 2000; // 2 second window for multi-kill
  }

  /**
   * Is the chest system active? Only after loop 1 is completed.
   */
  get isActive() {
    return GameState.currentLoop >= 2;
  }

  /**
   * Called when an enemy is killed. May spawn a chest or mimic.
   * @param {number} x - Death position X
   * @param {number} y - Death position Y
   */
  onEnemyKilled(x, y) {
    if (!this.isActive) return;

    // Track kill timestamp for multi-kill detection
    const now = Date.now();
    this._recentKillTimestamps.push(now);
    // Prune old timestamps
    this._recentKillTimestamps = this._recentKillTimestamps.filter(
      t => now - t < this._killWindowMs
    );

    // Calculate spawn chance
    let chance = CHEST_SPAWN_CHANCE;
    if (this._recentKillTimestamps.length >= 2) {
      chance += CHEST_MULTI_BONUS;
    }

    if (Math.random() >= chance) return; // no chest this time

    // Decide: normal chest or mimic?
    const loop = GameState.currentLoop;
    const mimicChance = Math.min(
      MIMIC_BASE_CHANCE + (loop - 2) * MIMIC_LOOP_INCREMENT,
      MIMIC_MAX_CHANCE
    );

    if (Math.random() < mimicChance) {
      this._spawnMimic(x, y);
    } else {
      this._spawnChest(x, y);
    }
  }

  // ── Normal chest ────────────────────────────────────────────────────────

  _spawnChest(x, y) {
    // Main body
    const chest = this.scene.add.rectangle(x, y, CHEST_W, CHEST_H, CHEST_COLOR);
    chest.setDepth(5);
    chest.setOrigin(0.5, 1);

    // Highlight strip on top
    const highlight = this.scene.add.rectangle(x, y - CHEST_H + 2, CHEST_W - 2, 3, CHEST_HIGHLIGHT);
    highlight.setDepth(6);

    this.chests.push({
      obj:       chest,
      highlight: highlight,
      lifetime:  CHEST_LIFETIME,
      opened:    false,
      x:         x,
      y:         y,
    });
  }

  // ── Mimic ───────────────────────────────────────────────────────────────

  _spawnMimic(x, y) {
    const mimic = new Mimic(this.scene, x, y);

    // Add platform collision
    this.scene.physics.add.collider(mimic.gameObject, this.scene.platforms);

    // Register with enemy manager so attack collisions work
    this.scene.enemyManager.enemies.push(mimic);

    this.mimics.push(mimic);
  }

  // ── Update (called each frame) ──────────────────────────────────────────

  update(delta, player) {
    if (!this.isActive) return;

    const playerAlive = player && player.gameObject && player.gameObject.active;

    // ── Update normal chests ──────────────────────────────────────────
    for (let i = this.chests.length - 1; i >= 0; i--) {
      const entry = this.chests[i];

      if (entry.opened || !entry.obj || !entry.obj.active) {
        this.chests.splice(i, 1);
        continue;
      }

      // Tick lifetime
      entry.lifetime -= delta;
      if (entry.lifetime <= 0) {
        this._fadeAndDestroy(entry);
        this.chests.splice(i, 1);
        continue;
      }

      // Blink when about to expire (last 3 seconds)
      if (entry.lifetime < 3000) {
        const blink = Math.floor(Date.now() / 200) % 2;
        entry.obj.setAlpha(blink === 0 ? 0.3 : 1.0);
        entry.highlight.setAlpha(blink === 0 ? 0.3 : 1.0);
      }

      // Check player overlap to open
      if (playerAlive) {
        const dx = Math.abs(entry.x - player.x);
        const dy = Math.abs((entry.y - CHEST_H / 2) - (player.y - 11));
        if (dx < 12 && dy < 14) {
          this._openChest(entry, player);
        }
      }
    }

    // ── Check mimic ambush (before normal enemy contact checks) ───────
    if (playerAlive) {
      for (let i = this.mimics.length - 1; i >= 0; i--) {
        const mimic = this.mimics[i];
        if (mimic.isDead) {
          this.mimics.splice(i, 1);
          continue;
        }
        // Check ambush (mimic handles the actual damage)
        mimic.checkAmbush(player);
      }
    }
  }

  // ── Open a normal chest ─────────────────────────────────────────────────

  _openChest(entry, player) {
    entry.opened = true;

    // Visual: flash gold and expand
    this.scene.tweens.add({
      targets: [entry.obj, entry.highlight],
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (entry.obj.active) entry.obj.destroy();
        if (entry.highlight.active) entry.highlight.destroy();
      }
    });

    // Roll drops (using the chest drop table, which is more generous)
    if (this.scene.itemSystem) {
      this.scene.itemSystem.rollDrop(entry.x, entry.y - 8, CHEST_DROP_TABLE);
    }

    // Score bonus for finding a chest
    GameState.score += 50;

    // Brief camera flash to celebrate
    this.scene.cameras.main.flash(150, 200, 180, 50, false);
  }

  // ── Cleanup helpers ─────────────────────────────────────────────────────

  _fadeAndDestroy(entry) {
    this.scene.tweens.add({
      targets: [entry.obj, entry.highlight],
      alpha: 0,
      duration: 300,
      onComplete: () => {
        if (entry.obj.active) entry.obj.destroy();
        if (entry.highlight.active) entry.highlight.destroy();
      }
    });
  }

  destroyAll() {
    for (const entry of this.chests) {
      if (entry.obj && entry.obj.active) entry.obj.destroy();
      if (entry.highlight && entry.highlight.active) entry.highlight.destroy();
    }
    this.chests = [];
    // Mimics are destroyed via EnemyManager, just clear our references
    this.mimics = [];
  }
}

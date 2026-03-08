/**
 * EnemyManager.js — Spawns, updates, and cleans up all active enemies.
 *
 * Usage:
 *   // In GameScene.create():
 *   this.enemyManager = new EnemyManager(this);
 *   this.enemyManager.spawn(this.enemySpawnPoints, this.platforms, this.player);
 *
 *   // In GameScene.update():
 *   this.enemyManager.update(delta, this.player);
 */

// ── Enemy type registry ─────────────────────────────────────────────────────
const ENEMY_TYPES = {
  hollow_soldier: HollowSoldier,
  hollow_archer:  HollowArcher,
  hollow_knight:  HollowKnight,
  skeleton:       Skeleton,
  gargoyle:       Gargoyle,
};

class EnemyManager {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene   = scene;
    this.enemies = [];
  }

  /**
   * Instantiate enemies from the spawn-point array.
   * @param {Array<{x,y,type}>} spawnPoints
   * @param {Phaser.Physics.Arcade.StaticGroup} platforms
   * @param {PlayerEntity} player
   */
  spawn(spawnPoints, platforms, player) {
    if (!spawnPoints || !spawnPoints.length) return;

    for (const sp of spawnPoints) {
      const EnemyClass = ENEMY_TYPES[sp.type];
      if (!EnemyClass) {
        console.warn(`[EnemyManager] Unknown enemy type: "${sp.type}" — skipping`);
        continue;
      }

      const enemy = new EnemyClass(this.scene, sp.x, sp.y, sp);

      // Add platform collision
      this.scene.physics.add.collider(enemy.gameObject, platforms);

      this.enemies.push(enemy);
    }
  }

  /**
   * Update all living enemies. Called each frame from GameScene.update().
   * @param {number} delta - ms since last frame
   * @param {PlayerEntity} player
   */
  update(delta, player) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      if (enemy.isDead && (!enemy.sprite || !enemy.sprite.active)) {
        // Keep archer alive if it still has arrows in flight
        if (enemy.arrows && enemy.arrows.length > 0) {
          enemy.update(delta, player);
          continue;
        }
        // Fully destroyed — remove from array
        this.enemies.splice(i, 1);
        continue;
      }

      enemy.update(delta, player);
    }
  }

  /**
   * Returns all currently active (alive) enemy instances.
   * @returns {EnemyEntity[]}
   */
  getEnemies() {
    return this.enemies.filter(e => !e.isDead);
  }

  /**
   * Returns ALL enemies (including dying ones with active sprites).
   * Used for hitbox collision checks.
   * @returns {EnemyEntity[]}
   */
  getAllEnemies() {
    return this.enemies;
  }

  /**
   * Destroy all enemies and clear the array.
   */
  destroyAll() {
    for (const enemy of this.enemies) {
      if (enemy.sprite && enemy.sprite.active) {
        enemy.sprite.destroy();
      }
    }
    this.enemies = [];
  }
}

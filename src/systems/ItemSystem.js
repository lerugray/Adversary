/**
 * ItemSystem.js — Handles item drops, pickups, and equipping.
 *
 * Called by EnemyEntity._die() to roll drops.
 * Called each frame from GameScene.update() to check pickups.
 *
 * Usage:
 *   // In GameScene.create():
 *   this.itemSystem = new ItemSystem(this);
 *
 *   // In GameScene.update():
 *   this.itemSystem.update(delta, this.player);
 */

// ── Item auto-destroy timer ─────────────────────────────────────────────────
const ITEM_LIFETIME = 8000; // ms before uncollected items vanish

// ── Item visual definitions ─────────────────────────────────────────────────
const ITEM_DEFS = {
  mana_shard: { w: 6,  h: 6,  color: 0x4488ff, label: 'Mana Shard' },
  heart:      { w: 8,  h: 8,  color: 0xff4444, label: 'Heart' },
  weapon:     { w: 10, h: 10, color: 0xaaaaaa, label: 'Weapon' },
  armor:      { w: 10, h: 10, color: 0xddaa44, label: 'Armor' },
  accessory:  { w: 8,  h: 8,  color: 0x44ccaa, label: 'Accessory' },
  special:    { w: 8,  h: 6,  color: 0xff88ff, label: 'Special' },
};

// ── Weapon pool (random selection on drop) ──────────────────────────────────
const WEAPON_POOL = [
  { name: 'Rusty Sword',   attackBonus: 1 },
  { name: 'Iron Blade',    attackBonus: 2 },
  { name: 'Knight Saber',  attackBonus: 3 },
];

// ── Armor pool ──────────────────────────────────────────────────────────────
const ARMOR_POOL = [
  { name: 'Leather Vest',  defenseBonus: 1 },
  { name: 'Chain Mail',    defenseBonus: 2 },
  { name: 'Plate Armor',   defenseBonus: 3 },
];

// ── Accessory pool ─────────────────────────────────────────────────────────
const ACCESSORY_POOL = [
  { name: 'Rusted Ring',     effect: 'speed',       desc: 'Slight speed boost' },
  { name: 'Hawk Ring',       effect: 'range',       desc: 'Special attack range up' },
  { name: 'Chloranthy Ring', effect: 'mana_regen',  desc: 'Passive mana regen' },
  { name: 'Covetous Ring',   effect: 'drop_rate',   desc: 'Better item drops' },
  { name: 'Hornet Ring',     effect: 'plunge_crit', desc: 'Plunge attack crits' },
  { name: 'Ring of Fog',     effect: 'iframes',     desc: 'Extended i-frames' },
];

// ── Special attack cycle order ─────────────────────────────────────────────
const SPECIAL_CYCLE = ['knife', 'axe', 'holy water', 'cross', 'skull key', 'ember flask'];

class ItemSystem {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.items = []; // array of { obj, type, lifetime }
  }

  /**
   * Roll a drop from the given drop table and spawn the item.
   * @param {number} x - World X (enemy death position)
   * @param {number} y - World Y
   * @param {Array<{type: string, chance: number}>} dropTable
   */
  rollDrop(x, y, dropTable) {
    if (!dropTable || !dropTable.length) return;

    // Covetous Ring: 20% boost to all drop chances
    const acc = GameState.player.accessory;
    const dropBonus = (acc && acc.effect === 'drop_rate') ? 0.20 : 0;

    // Roll once per enemy death — pick the first drop that hits
    for (const entry of dropTable) {
      if (Math.random() < entry.chance + dropBonus) {
        this._spawnItem(x, y, entry.type);
        return; // only one drop per enemy
      }
    }
  }

  /**
   * Spawn an item pickup at the given position.
   * @param {number} x
   * @param {number} y
   * @param {string} type - 'mana_shard', 'heart', 'weapon', 'armor'
   */
  _spawnItem(x, y, type) {
    const def = ITEM_DEFS[type];
    if (!def) return;

    // Create colored rectangle
    const item = this.scene.add.rectangle(x, y, def.w, def.h, def.color);
    this.scene.physics.add.existing(item);
    item.setDepth(5);

    // Float-up-then-fall physics
    item.body.setVelocityY(-80);       // gentle upward pop
    item.body.setGravityY(200);        // then fall
    item.body.setBounce(0.3);
    item.body.setCollideWorldBounds(false);

    // Collide with platforms so items land on surfaces
    this.scene.physics.add.collider(item, this.scene.platforms);

    this.items.push({
      obj:      item,
      type:     type,
      lifetime: ITEM_LIFETIME,
    });
  }

  /**
   * Called each frame from GameScene.update().
   * Checks pickups and ages items.
   * @param {number} delta - ms since last frame
   * @param {PlayerEntity} player
   */
  update(delta, player) {
    const playerAlive = player && player.gameObject && player.gameObject.active;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const entry = this.items[i];

      if (!entry.obj || !entry.obj.active) {
        this.items.splice(i, 1);
        continue;
      }

      // Tick lifetime
      entry.lifetime -= delta;
      if (entry.lifetime <= 0) {
        // Fade out and destroy
        this.scene.tweens.add({
          targets: entry.obj,
          alpha: 0,
          duration: 300,
          onComplete: () => { if (entry.obj.active) entry.obj.destroy(); }
        });
        this.items.splice(i, 1);
        continue;
      }

      // Blink when about to expire (last 2 seconds)
      if (entry.lifetime < 2000) {
        const blink = Math.floor(Date.now() / 150) % 2;
        entry.obj.setAlpha(blink === 0 ? 0.3 : 1.0);
      }

      // Check pickup overlap with player
      if (playerAlive) {
        const dx = Math.abs(entry.obj.x - player.x);
        const dy = Math.abs(entry.obj.y - (player.y - 11));
        if (dx < 10 && dy < 14) {
          this._collect(entry, player);
          this.items.splice(i, 1);
        }
      }
    }
  }

  /**
   * Apply the collected item's effect.
   * @param {{ obj, type }} entry
   * @param {PlayerEntity} player
   */
  _collect(entry, player) {
    const gs = GameState.player;

    switch (entry.type) {
      case 'mana_shard': {
        const restore = 1 + Math.floor(Math.random() * 2); // 1-2
        gs.mana = Math.min(gs.maxMana, gs.mana + restore);
        break;
      }
      case 'heart': {
        gs.hp = Math.min(gs.maxHp, gs.hp + 1);
        break;
      }
      case 'weapon': {
        const weapon = WEAPON_POOL[Math.floor(Math.random() * WEAPON_POOL.length)];
        gs.weapon = { ...weapon };
        break;
      }
      case 'armor': {
        const armor = ARMOR_POOL[Math.floor(Math.random() * ARMOR_POOL.length)];
        gs.armor = { ...armor };
        break;
      }
      case 'accessory': {
        const acc = ACCESSORY_POOL[Math.floor(Math.random() * ACCESSORY_POOL.length)];
        // Add to inventory if not already collected
        const already = gs.accessoryInventory.some(a => a.name === acc.name);
        if (!already) {
          gs.accessoryInventory.push({ ...acc });
        }
        // Auto-equip if nothing equipped
        if (!gs.accessory) {
          gs.accessory = { ...acc };
        }
        break;
      }
      case 'special': {
        // Cycle to the next special attack in the list
        const curIdx = SPECIAL_CYCLE.indexOf(gs.specialAttack);
        const nextIdx = (curIdx + 1) % SPECIAL_CYCLE.length;
        gs.specialAttack = SPECIAL_CYCLE[nextIdx];
        break;
      }
    }

    // Brief flash on player sprite to confirm pickup
    if (player.gameObject && player.gameObject.active) {
      player.gameObject.setTint(0xffff88);
      this.scene.time.delayedCall(150, () => {
        if (player.gameObject && player.gameObject.active && player.state !== 'dead') {
          player.gameObject.setTint(player._baseTint());
        }
      });
    }

    // Destroy item
    entry.obj.destroy();
  }

  /**
   * Destroy all active items.
   */
  destroyAll() {
    for (const entry of this.items) {
      if (entry.obj && entry.obj.active) entry.obj.destroy();
    }
    this.items = [];
  }
}

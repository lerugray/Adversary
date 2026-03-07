/**
 * GameState.js — Global, persistent game-state object.
 *
 * Lives on window.ADVERSARY.GameState (set in main.js).
 * Because it is a plain JS object (not a Phaser plugin), it persists across
 * ALL scene transitions without any special serialisation.
 *
 * Extend this object as new systems come online in later phases:
 *  - Phase 2: real player stats wired to PlayerEntity
 *  - Phase 5: XP / levelling logic
 *  - Phase 6: mana / spell system
 *  - Phase 9: score multipliers, combo counters
 */

const GameState = {

  // ── Progression ───────────────────────────────────────────────────────────
  /** Current level index. Valid values: 1–4 (maps to Level1–Level4). */
  currentLevel: 1,

  /** How many times the player has looped through all four levels. */
  currentLoop: 1,

  // ── Player stats (Phase 2 corrected values) ──────────────────────────────
  player: {
    hp:      1,
    maxHp:   1,
    mana:    6,
    maxMana: 6,
    xp:      0,
    level:   1,
    // Gear slots — null means unequipped
    weapon:    null,
    armor:     null,
    accessory: null,
    // Special attack currently equipped
    specialAttack: 'knife',
    // Level-up bonuses (accumulated from choices)
    attackPowerBonus: 0,
    speedBonus:       0,
  },

  // ── Soul / death state ────────────────────────────────────────────────────
  // Managed by PlayerEntity; stored here so it persists across scene restarts.
  soul: null,           // null | { x, y }  — world position of the soul orb
  pendingXP: 0,         // XP suspended until soul is retrieved

  // ── Scoring ───────────────────────────────────────────────────────────────
  score: 0,

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Reset all state to new-game defaults. Call from TitleScene on new game. */
  reset() {
    this.currentLevel = 1;
    this.currentLoop  = 1;
    this.score        = 0;
    this.soul         = null;
    this.pendingXP    = 0;
    this.player = {
      hp:            1,
      maxHp:         1,
      mana:          6,
      maxMana:       6,
      xp:            0,
      level:         1,
      weapon:        null,
      armor:         null,
      accessory:     null,
      specialAttack: 'knife',
      attackPowerBonus: 0,
      speedBonus:       0,
    };
  },

  /**
   * Advance to the next level, wrapping at level 4 and incrementing loop.
   * Returns { level, loop } after advance.
   */
  advanceLevel() {
    if (this.currentLevel >= 4) {
      this.currentLevel = 1;
      this.currentLoop += 1;
    } else {
      this.currentLevel += 1;
    }
    return { level: this.currentLevel, loop: this.currentLoop };
  },
};

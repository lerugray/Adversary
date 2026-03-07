/**
 * LevelRegistry.js — Maps level numbers (1–4) to their data objects.
 *
 * Loaded after all LevelXData files and before GameScene.
 * GameScene reads: LevelRegistry[GameState.currentLevel]
 */

const LevelRegistry = {
  1: Level1Data,
  2: Level2Data,
  3: Level3Data,
  4: Level4Data,
};

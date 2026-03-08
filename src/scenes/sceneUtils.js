/**
 * sceneUtils.js — Shared utility functions available to all scenes.
 *
 * Loaded in index.html before any scene files so these globals
 * are available everywhere.
 */

/** Global font family — change here to update every text element in the game. */
const GAME_FONT = '"Press Start 2P", monospace';

/** Narrower font for the HUD where space is tight. */
const HUD_FONT = '"Silkscreen", monospace';

/** Standard padding to prevent pixel fonts from being clipped by Phaser. */
const FONT_PAD = { top: 2, bottom: 2 };

/**
 * Adds a small scene-name label in the top-left corner.
 * Used by placeholder scenes in Phase 1 to identify what's on screen.
 * Remove or gate behind DEBUG flag in later phases.
 *
 * @param {Phaser.Scene} scene
 * @param {string} name
 */
function _addSceneLabel(scene, name) {
  scene.add.text(4, 4, name, {
    fontFamily: GAME_FONT,
    fontSize:   '7px',
    color:      '#ffffff',
    alpha:      0.5,
    padding:    FONT_PAD,
  }).setDepth(1000);
}

/**
 * sceneUtils.js — Shared utility functions available to all scenes.
 *
 * Loaded in index.html before any scene files so these globals
 * are available everywhere.
 */

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
    fontFamily: 'monospace',
    fontSize:   '7px',
    color:      '#ffffff',
    alpha:      0.5,
  }).setDepth(1000);
}

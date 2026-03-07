/**
 * InputManager.js — Centralised input abstraction layer.
 *
 * Wraps Phaser's keyboard (and, in future phases, gamepad) APIs behind a
 * consistent interface so scenes and gameplay systems never reference raw
 * Phaser input objects directly.
 *
 * Usage (inside a scene):
 *   // create():
 *   this.inputManager = new InputManager(this);
 *
 *   // update():
 *   if (this.inputManager.isJumpJustPressed()) { ... }
 *
 * ── Button mapping ────────────────────────────────────────────────────────
 *  Arrow keys → D-Pad (UP / DOWN / LEFT / RIGHT)
 *  Z          → Jump
 *  X          → Attack
 *  Enter      → Start / Pause
 *
 * ── Future gamepad support (Phase 2) ─────────────────────────────────────
 * The isXxx() methods will OR gamepad button states with keyboard states.
 * No calling code changes required.
 */

class InputManager {
  /**
   * @param {Phaser.Scene} scene
   * Each scene instantiates its own InputManager so key objects are bound
   * to the correct scene lifecycle.
   */
  constructor(scene) {
    this._scene = scene;

    const kb = scene.input.keyboard;

    // ── Keyboard bindings ─────────────────────────────────────────────────
    this._keys = kb.addKeys({
      up:     Phaser.Input.Keyboard.KeyCodes.UP,
      down:   Phaser.Input.Keyboard.KeyCodes.DOWN,
      left:   Phaser.Input.Keyboard.KeyCodes.LEFT,
      right:  Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jump:   Phaser.Input.Keyboard.KeyCodes.Z,
      attack: Phaser.Input.Keyboard.KeyCodes.X,
      start:  Phaser.Input.Keyboard.KeyCodes.ENTER,
      // Debug shortcuts (remove or gate behind a DEBUG flag in later phases)
      dbgGameOver:    Phaser.Input.Keyboard.KeyCodes.G,
      dbgLoopComplete: Phaser.Input.Keyboard.KeyCodes.L,
    });

    // Gamepad plugin enabled in main.js config — store reference for Phase 2.
    this._gamepad = scene.input.gamepad;
  }

  // ── D-Pad ─────────────────────────────────────────────────────────────────

  isUpHeld()    { return this._keys.up.isDown; }
  isDownHeld()  { return this._keys.down.isDown; }
  isLeftHeld()  { return this._keys.left.isDown; }
  isRightHeld() { return this._keys.right.isDown; }

  isUpJustPressed()    { return Phaser.Input.Keyboard.JustDown(this._keys.up); }
  isDownJustPressed()  { return Phaser.Input.Keyboard.JustDown(this._keys.down); }
  isLeftJustPressed()  { return Phaser.Input.Keyboard.JustDown(this._keys.left); }
  isRightJustPressed() { return Phaser.Input.Keyboard.JustDown(this._keys.right); }

  // ── Action buttons ────────────────────────────────────────────────────────

  isJumpHeld()          { return this._keys.jump.isDown; }
  isJumpJustPressed()   { return Phaser.Input.Keyboard.JustDown(this._keys.jump); }

  isAttackHeld()        { return this._keys.attack.isDown; }
  isAttackJustPressed() { return Phaser.Input.Keyboard.JustDown(this._keys.attack); }

  isStartJustPressed()  { return Phaser.Input.Keyboard.JustDown(this._keys.start); }

  // ── Debug shortcuts ───────────────────────────────────────────────────────
  isDebugGameOverPressed()    { return Phaser.Input.Keyboard.JustDown(this._keys.dbgGameOver); }
  isDebugLoopCompletePressed(){ return Phaser.Input.Keyboard.JustDown(this._keys.dbgLoopComplete); }

  // ── Utility ───────────────────────────────────────────────────────────────

  /**
   * Returns true the first frame ANY tracked key is pressed.
   * Used for "press any button to continue" prompts.
   */
  isAnyJustPressed() {
    return Object.values(this._keys).some(
      k => Phaser.Input.Keyboard.JustDown(k)
    );
  }

  /**
   * Returns the first connected gamepad, or null.
   * Stub — full implementation in Phase 2.
   * @returns {Phaser.Input.Gamepad.Gamepad|null}
   */
  getGamepad() {
    if (this._gamepad && this._gamepad.total > 0) {
      return this._gamepad.getPad(0);
    }
    return null;
  }
}

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

    // ── Gamepad ───────────────────────────────────────────────────────────
    // Phaser gamepad plugin enabled in main.js config.
    // Standard mapping: D-pad (12-15), A=0 (jump), X=2 (attack), Start=9
    // Left stick axis 0 = horizontal, axis 1 = vertical, threshold 0.5
    this._gpPlugin = scene.input.gamepad;
    this._gpPrevButtons = {}; // track previous frame for "just pressed"
    this._STICK_THRESHOLD = 0.5;
  }

  /** @returns {Phaser.Input.Gamepad.Gamepad|null} */
  _gp() {
    if (this._gpPlugin && this._gpPlugin.total > 0) {
      return this._gpPlugin.getPad(0);
    }
    return null;
  }

  /** True if gamepad button is currently held. */
  _gpHeld(index) {
    const gp = this._gp();
    return gp && gp.buttons[index] && gp.buttons[index].pressed;
  }

  /** True only on the first frame a gamepad button is pressed. */
  _gpJust(index) {
    const curr = this._gpHeld(index);
    const prev = this._gpPrevButtons[index] || false;
    this._gpPrevButtons[index] = curr;
    return curr && !prev;
  }

  /** Left stick horizontal axis value (-1 to 1). */
  _gpAxisH() {
    const gp = this._gp();
    return gp ? (gp.axes[0] ? gp.axes[0].getValue() : 0) : 0;
  }

  /** Left stick vertical axis value (-1 to 1). */
  _gpAxisV() {
    const gp = this._gp();
    return gp ? (gp.axes[1] ? gp.axes[1].getValue() : 0) : 0;
  }

  // ── D-Pad ─────────────────────────────────────────────────────────────────

  isUpHeld()    { return this._keys.up.isDown    || this._gpHeld(12) || this._gpAxisV() < -this._STICK_THRESHOLD; }
  isDownHeld()  { return this._keys.down.isDown   || this._gpHeld(13) || this._gpAxisV() >  this._STICK_THRESHOLD; }
  isLeftHeld()  { return this._keys.left.isDown   || this._gpHeld(14) || this._gpAxisH() < -this._STICK_THRESHOLD; }
  isRightHeld() { return this._keys.right.isDown  || this._gpHeld(15) || this._gpAxisH() >  this._STICK_THRESHOLD; }

  isUpJustPressed()    { return Phaser.Input.Keyboard.JustDown(this._keys.up)    || this._gpJust(12); }
  isDownJustPressed()  { return Phaser.Input.Keyboard.JustDown(this._keys.down)  || this._gpJust(13); }
  isLeftJustPressed()  { return Phaser.Input.Keyboard.JustDown(this._keys.left)  || this._gpJust(14); }
  isRightJustPressed() { return Phaser.Input.Keyboard.JustDown(this._keys.right) || this._gpJust(15); }

  // ── Action buttons ────────────────────────────────────────────────────────
  // A (0) = Jump, X (2) = Attack, Start (9) = Pause
  // Also: B (1) = Jump alt, Y (3) = Attack alt for comfort

  isJumpHeld()          { return this._keys.jump.isDown   || this._gpHeld(0)  || this._gpHeld(1); }
  isJumpJustPressed()   { return Phaser.Input.Keyboard.JustDown(this._keys.jump)   || this._gpJust(0)  || this._gpJust(1); }

  isAttackHeld()        { return this._keys.attack.isDown || this._gpHeld(2)  || this._gpHeld(3); }
  isAttackJustPressed() { return Phaser.Input.Keyboard.JustDown(this._keys.attack) || this._gpJust(2)  || this._gpJust(3); }

  // Pause: only keyboard Enter for now until we confirm gamepad mapping
  isStartJustPressed()  { return Phaser.Input.Keyboard.JustDown(this._keys.start); }

  // ── Debug shortcuts ───────────────────────────────────────────────────────
  isDebugGameOverPressed()    { return Phaser.Input.Keyboard.JustDown(this._keys.dbgGameOver); }
  isDebugLoopCompletePressed(){ return Phaser.Input.Keyboard.JustDown(this._keys.dbgLoopComplete); }

  // ── Utility ───────────────────────────────────────────────────────────────

  /**
   * Returns true the first frame ANY tracked key or gamepad button is pressed.
   * Used for "press any button to continue" prompts.
   */
  isAnyJustPressed() {
    const kb = Object.values(this._keys).some(
      k => Phaser.Input.Keyboard.JustDown(k)
    );
    if (kb) return true;

    // Check any gamepad button
    const gp = this._gp();
    if (gp) {
      for (let i = 0; i < gp.buttons.length; i++) {
        if (this._gpJust(i)) return true;
      }
    }
    return false;
  }

  /**
   * Returns the first connected gamepad, or null.
   * @returns {Phaser.Input.Gamepad.Gamepad|null}
   */
  getGamepad() {
    return this._gp();
  }

  /**
   * Debug: returns a string showing which gamepad buttons are currently pressed.
   * Call from scene update and display on screen to diagnose controller mapping.
   */
  getGamepadDebug() {
    const gp = this._gp();
    if (!gp) return 'No gamepad';
    const pressed = [];
    for (let i = 0; i < gp.buttons.length; i++) {
      if (gp.buttons[i] && gp.buttons[i].pressed) pressed.push(i);
    }
    const axes = [];
    for (let i = 0; i < gp.axes.length; i++) {
      const v = gp.axes[i] ? gp.axes[i].getValue() : 0;
      if (Math.abs(v) > 0.2) axes.push(`A${i}:${v.toFixed(1)}`);
    }
    return `BTN:[${pressed.join(',')}] ${axes.join(' ')}`;
  }
}

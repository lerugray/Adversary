/**
 * GameScene.js — Main gameplay scene.
 *
 * Phase 5B: Level-aware. Reads GameState.currentLevel on create(),
 * looks up data via LevelRegistry, stores as this.currentLevelData.
 * Level 4 boss fight wired via boss threshold + HollowKingBoss.
 */

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  // ── create ────────────────────────────────────────────────────────────────

  create() {
    // ── Resolve current level data ──────────────────────────────────
    const levelNum = GameState.currentLevel;
    const data = LevelRegistry[levelNum];
    if (!data) {
      console.error(`[GameScene] No level data for level ${levelNum}`);
      this.scene.start('TitleScene');
      return;
    }
    this.currentLevelData = data; // public — enemies read this for edge detection

    // ── Background ────────────────────────────────────────────────────
    this.cameras.main.setBackgroundColor('#0d0a0f');

    // ── World bounds ──────────────────────────────────────────────────
    this.physics.world.setBounds(0, 0, data.worldWidth, data.worldHeight);

    // ── Level geometry ────────────────────────────────────────────────
    this._buildDecorations(data.decorations);
    this._buildPlatforms(data.platforms);

    // ── Ladder system ─────────────────────────────────────────────────
    this.ladderSystem = new LadderSystem(this, data.ladders);

    // ── Checkpoint (bonfire) — null on Level 4 ────────────────────────
    this._checkpointTriggered = false;
    if (data.checkpoint) {
      this._buildCheckpoint(data.checkpoint);
    }

    // ── Input ─────────────────────────────────────────────────────────
    this.inputManager = new InputManager(this);

    // ── Player ────────────────────────────────────────────────────────
    const sp = data.playerSpawn;
    this.player = new PlayerEntity(this, sp.x, sp.y);

    // Platform collider
    this.physics.add.collider(this.player.gameObject, this.platforms);

    // Geometry-aware soul spawn
    this._patchPlayerSoulSpawn();

    // ── HUD ────────────────────────────────────────────────────────────
    this.hud = new HUD(this);

    // ── Camera ────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, data.worldWidth, data.worldHeight);
    this.cameras.main.startFollow(this.player.gameObject, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(40, 30);

    // ── Pause / resume events ─────────────────────────────────────────
    this.scene.get('PauseScene').events.on('resume-game', () => {
      this.scene.resume();
    }, this);

    // ── Debug overlay ─────────────────────────────────────────────────
    this._buildDebugText();

    // ── Item System (must exist before enemies spawn) ─────────────────
    this.itemSystem = new ItemSystem(this);

    // ── Enemy Manager ─────────────────────────────────────────────────
    this.enemyManager = new EnemyManager(this);
    this.enemyManager.spawn(data.enemySpawns, this.platforms, this.player);

    // ── Phantom System (anti-grinding ghost — skips Level 4) ─────────
    this.phantomSystem = new PhantomSystem(this);

    // ── Attack hit-list (prevent multi-hit per swing) ─────────────────
    this._attackHitList = new Set();

    // ── Phase 5B: Boss system (Level 4 only) ──────────────────────────
    this.boss = null;
    this._bossTriggered = false;
    this._weakPoints = [];
    this._weakPointsHit = new Set();

    if (levelNum === 4 && data.bossThreshold) {
      this._buildWeakPoints(data.weakPoints);
      this._bossThresholdY = data.bossThreshold.y;
    }
  }

  // ── Level geometry builders ───────────────────────────────────────────────

  _buildDecorations(defs) {
    defs.forEach(def => {
      this.add.rectangle(
        def.x + def.w / 2,
        def.y + def.h / 2,
        def.w, def.h,
        def.color,
        def.alpha !== undefined ? def.alpha : 1.0
      ).setDepth(0);
    });
  }

  _buildPlatforms(defs) {
    const TIER_COLORS = [
      0x2e2830,  // 0
      0x3a3035,  // 1
      0x403840,  // 2
      0x4a4045,  // 3
      0x52484e,  // 4
      0x5c5060,  // 5
      0x625868,  // 6
      0x6a6070,  // 7
    ];

    this.platforms = this.physics.add.staticGroup();

    defs.forEach(def => {
      const color = TIER_COLORS[def.tier] ?? TIER_COLORS[1];

      const rect = this.add.rectangle(
        def.x + def.w / 2,
        def.y + def.h / 2,
        def.w, def.h,
        color
      ).setDepth(2);

      this.add.rectangle(
        def.x + def.w / 2,
        def.y + 1,
        def.w, 2,
        Phaser.Display.Color.IntegerToColor(color).lighten(15).color
      ).setDepth(3);

      this.platforms.add(rect);
    });

    this.platforms.refresh();
  }

  // ── Checkpoint (bonfire) ──────────────────────────────────────────────────

  _buildCheckpoint(def) {
    this.checkpointGlow = this.add.circle(def.x, def.y, def.radius + 4, 0xff6a00, 0.35)
      .setDepth(4);
    this.checkpointFlame = this.add.circle(def.x, def.y, def.radius, 0xff8c00, 1.0)
      .setDepth(5);
    this.checkpointCore = this.add.circle(def.x, def.y, Math.floor(def.radius * 0.45), 0xffdd44, 1.0)
      .setDepth(6);

    this.tweens.add({
      targets: this.checkpointGlow,
      scaleX: 1.6, scaleY: 1.6, alpha: 0.15,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: this.checkpointFlame,
      scaleX: 1.15, scaleY: 0.9, alpha: 0.85,
      duration: 350, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    const r = def.radius + 6;
    this._checkpointBounds = {
      left: def.x - r, right: def.x + r,
      top: def.y - r, bottom: def.y + r,
    };
  }

  _testCheckpointOverlap() {
    if (this._checkpointTriggered) return;
    if (!this._checkpointBounds) return; // Level 4 has no checkpoint

    const px = this.player.x;
    const py = this.player.y;
    const b  = this._checkpointBounds;

    if (px >= b.left && px <= b.right && py >= b.top && py <= b.bottom) {
      this._triggerCheckpoint();
    }
  }

  _triggerCheckpoint() {
    this._checkpointTriggered = true;

    // Visual celebration
    this.tweens.killTweensOf(this.checkpointFlame);
    this.tweens.add({
      targets: [this.checkpointFlame, this.checkpointCore, this.checkpointGlow],
      alpha: 0, scaleX: 3, scaleY: 3,
      duration: 600, ease: 'Cubic.easeOut',
    });

    this.cameras.main.shake(400, 0.008);
    this.cameras.main.flash(300, 255, 140, 0, false);

    // Advance to next level and restart GameScene
    GameState.advanceLevel();

    this.time.delayedCall(1400, () => {
      this.scene.start('GameScene');
    });
  }

  // ── Phase 5B: Boss threshold & weak points (Level 4) ──────────────────────

  _buildWeakPoints(wpDefs) {
    if (!wpDefs) return;

    for (const wp of wpDefs) {
      const obj = this.add.circle(wp.x, wp.y, wp.radius, 0x44ffaa, 0.6)
        .setDepth(4);

      // Gentle pulse
      this.tweens.add({
        targets: obj,
        alpha: 0.25, scaleX: 1.4, scaleY: 1.4,
        duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      this._weakPoints.push({ obj, x: wp.x, y: wp.y, radius: wp.radius, hit: false });
    }
  }

  _checkBossThreshold() {
    if (this._bossTriggered) return;
    if (GameState.currentLevel !== 4) return;
    if (!this._bossThresholdY) return;

    // Player crossed into boss arena (above threshold Y)
    if (this.player.y < this._bossThresholdY) {
      this._triggerBoss();
    }
  }

  _triggerBoss() {
    this._bossTriggered = true;

    // Spawn boss in center of arena
    this.boss = new HollowKingBoss(this, 180, 84);
    this.physics.add.collider(this.boss.gameObject, this.platforms);
    this.enemyManager.enemies.push(this.boss);

    // Show boss health bar
    this.hud.setBossHealth(this.boss.hp, this.boss.maxHp);

    // Brief dramatic flash
    this.cameras.main.flash(200, 180, 60, 60, false);
    this.cameras.main.shake(300, 0.006);
  }

  _checkWeakPointHits() {
    if (!this._bossTriggered || !this.boss || this.boss.isDead) return;
    if (this.boss._isStaggered) return; // already staggered

    const hitbox = this.player.attackHitbox;
    if (!hitbox || !hitbox.body || !hitbox.body.enable) return;

    const hx = hitbox.x;
    const hy = hitbox.y;

    for (const wp of this._weakPoints) {
      if (wp.hit) continue;

      const dx = hx - wp.x;
      const dy = hy - wp.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < wp.radius + 8) {
        wp.hit = true;
        this._weakPointsHit.add(wp);

        // Visual feedback: flash and shrink
        wp.obj.setFillStyle(0xffffff, 1.0);
        this.tweens.killTweensOf(wp.obj);
        this.tweens.add({
          targets: wp.obj,
          alpha: 0, scaleX: 0, scaleY: 0,
          duration: 300, ease: 'Cubic.easeIn',
        });

        // All 4 hit → stagger the boss
        if (this._weakPointsHit.size >= this._weakPoints.length) {
          this.boss.triggerStagger();
        }
      }
    }
  }

  _updateBoss(delta) {
    if (!this.boss || this.boss.isDead) return;

    // Update boss health bar
    this.hud.setBossHealth(this.boss.hp, this.boss.maxHp);

    // Check boss death → victory
    if (this.boss._dead) {
      this._onBossDefeated();
    }
  }

  _onBossDefeated() {
    if (this._bossVictory) return;
    this._bossVictory = true;

    this.hud.hideBossHealth();

    // Dramatic death sequence
    this.cameras.main.shake(800, 0.015);
    this.cameras.main.flash(500, 255, 255, 200, false);

    // Advance level (wraps to level 1, increments loop)
    GameState.advanceLevel();

    this.time.delayedCall(2000, () => {
      this.scene.start('LoopCompleteScene');
    });
  }

  // ── Soul clamping to platform geometry ─────────────────────────────────────

  _patchPlayerSoulSpawn() {
    const scene  = this;
    const player = this.player;

    player._spawnSoul = function () {
      const { sx, sy } = scene._clampSoulToGeometry(
        this.lastSafeX,
        this.lastSafeY
      );

      GameState.soul      = { x: sx, y: sy };
      GameState.pendingXP += GameState.player.xp;

      this._spawnSoulOrb(sx, sy);
    };
  }

  _clampSoulToGeometry(rawX, rawY) {
    const data = this.currentLevelData;
    const platforms = data.platforms;
    let   bestSurfaceY = null;
    let   bestDist     = Infinity;

    for (const plat of platforms) {
      if (rawX >= plat.x && rawX <= plat.x + plat.w) {
        const platTopY = plat.y;
        const dist = Math.abs(rawY - platTopY);
        if (dist < bestDist) {
          bestDist     = dist;
          bestSurfaceY = platTopY - 4;
        }
      }
    }

    if (bestSurfaceY === null) {
      bestSurfaceY = Phaser.Math.Clamp(rawY, 16, data.worldHeight - 16);
    }

    const sx = Phaser.Math.Clamp(rawX, 8, data.worldWidth - 8);
    return { sx, sy: bestSurfaceY };
  }

  // ── Debug overlay ─────────────────────────────────────────────────────────

  _buildDebugText() {
    this._debugText = this.add.text(4, 20,
      '[G] GameOver  [L] LoopComplete', {
        fontFamily: 'monospace',
        fontSize:   '6px',
        color:      '#334433',
      }
    ).setScrollFactor(0).setDepth(20);
  }

  // ── Attack hitbox → enemy collision ────────────────────────────────────────

  _checkAttackHitboxCollisions() {
    const hitbox = this.player.attackHitbox;
    if (!hitbox || !hitbox.body || !hitbox.body.enable) {
      if (this._attackHitList.size > 0) {
        this._attackHitList.clear();
      }
      return;
    }

    const hx = hitbox.x;
    const hy = hitbox.y;
    const hw = hitbox.body.width  / 2;
    const hh = hitbox.body.height / 2;

    const weaponBonus = GameState.player.weapon?.attackBonus ?? 0;
    let attackPower = 1 + weaponBonus;

    if (this.player.isPlunging) {
      attackPower *= 2;
    }

    const enemies = this.enemyManager.getEnemies();
    for (const enemy of enemies) {
      if (this._attackHitList.has(enemy)) continue;
      if (!enemy.sprite || !enemy.sprite.active) continue;

      const ex = enemy.sprite.x;
      const ey = enemy.sprite.y - enemy.sprite.body.height / 2;
      const ew = enemy.sprite.body.width  / 2;
      const eh = enemy.sprite.body.height / 2;

      if (Math.abs(hx - ex) < hw + ew &&
          Math.abs(hy - ey) < hh + eh) {
        enemy.takeDamage(attackPower, this.player.x);
        this._attackHitList.add(enemy);

        if (this.player.isPlunging && !this.player.plungeHit) {
          this.player.plungeHit = true;
          this.player.body.setVelocityY(-150);
        }
      }
    }
  }

  // ── Enemy body → player contact damage ─────────────────────────────────────

  _checkEnemyContactDamage() {
    if (this.player.isInvincible || this.player.state === 'dead') return;

    const px = this.player.x;
    const py = this.player.y - 11;
    const pw = 5;
    const ph = 11;

    const enemies = this.enemyManager.getEnemies();
    for (const enemy of enemies) {
      if (!enemy.sprite || !enemy.sprite.active) continue;
      if (enemy.state === ENEMY_STATE.HURT || enemy.state === ENEMY_STATE.DEAD) continue;

      const ex = enemy.sprite.x;
      const ey = enemy.sprite.y - enemy.sprite.body.height / 2;
      const ew = enemy.sprite.body.width  / 2;
      const eh = enemy.sprite.body.height / 2;

      if (Math.abs(px - ex) < pw + ew &&
          Math.abs(py - ey) < ph + eh) {
        this.player.takeDamage(enemy.damage, ex);
        return;
      }
    }
  }

  // ── update ────────────────────────────────────────────────────────────────

  update(time, delta) {
    // Debug shortcuts
    if (this.inputManager.isDebugGameOverPressed()) {
      this.scene.start('GameOverScene');
      return;
    }
    if (this.inputManager.isDebugLoopCompletePressed()) {
      this.scene.start('LoopCompleteScene');
      return;
    }

    // Player
    this.player.update(this.inputManager, delta);

    // Ladder system
    this.ladderSystem.update(this.player, this.inputManager, delta);

    // Enemies
    this.enemyManager.update(delta, this.player);

    // Items
    this.itemSystem.update(delta, this.player);

    // Phantom
    this.phantomSystem.update(delta, this.player);

    // Attack hitbox → enemy collision
    this._checkAttackHitboxCollisions();

    // Enemy body → player contact damage
    this._checkEnemyContactDamage();

    // Checkpoint detection (levels 1-3)
    this._testCheckpointOverlap();

    // Boss threshold (level 4)
    this._checkBossThreshold();

    // Weak point hits (level 4)
    this._checkWeakPointHits();

    // Boss health bar update (level 4)
    this._updateBoss(delta);

    // HUD
    this.hud.update(this.player);
  }
}

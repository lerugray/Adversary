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

    // Platform collider (stored so LadderSystem can toggle it)
    this.playerPlatformCollider = this.physics.add.collider(this.player.gameObject, this.platforms);

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

    // ── Chest System (Phase 6 — active after loop 1) ────────────────
    this.chestSystem = new ChestSystem(this);

    // ── Level-Up System ────────────────────────────────────────────
    this.levelUpSystem = new LevelUpSystem(this);

    // ── Mana regen timer (for Chloranthy Ring) ─────────────────────
    this._manaRegenTimer = 0;

    // ── Hazard System (rolling skulls — Donkey Kong style) ────────────
    this.hazardSystem = new HazardSystem(this);

    // ── Flying Hazard System (bats — DK-style, timer-based) ────────────
    this.flyingHazardSystem = new FlyingHazardSystem(this);

    // ── Trap System (pendulums, dart traps — Sen's Fortress style) ────
    this.trapSystem = new TrapSystem(this);

    // ── Breakable System (destructible containers) ──────────────────────
    this.breakableSystem = new BreakableSystem(this);

    // ── Phantom System (anti-grinding ghost — skips Level 4) ─────────
    this.phantomSystem = new PhantomSystem(this);

    // ── Respawn enemies when player dies and respawns ──────────────────
    this.events.on('player-respawn', this._respawnEnemies, this);

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

    // ── Dark Souls-style level name overlay ─────────────────────────────
    this._showLevelName(data.name || `Level ${levelNum}`, levelNum);
  }

  /**
   * Show the level name centered on screen, fade in then fade out.
   * Styled like Dark Souls area discovery text.
   */
  _showLevelName(name, levelNum) {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Thin horizontal rule lines above and below the text
    const lineW = 100;
    const lineY1 = H * 0.38;
    const lineY2 = H * 0.58;

    const topLine = this.add.rectangle(W / 2, lineY1, lineW, 1, 0xaaaaaa, 0.6)
      .setScrollFactor(0).setDepth(50).setAlpha(0);
    const bottomLine = this.add.rectangle(W / 2, lineY2, lineW, 1, 0xaaaaaa, 0.6)
      .setScrollFactor(0).setDepth(50).setAlpha(0);

    // Level name text (large)
    const nameText = this.add.text(W / 2, H * 0.46, name, {
      fontFamily: GAME_FONT,
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      padding: FONT_PAD,
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true },
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(50).setAlpha(0);

    // Subtitle (smaller)
    const subText = this.add.text(W / 2, H * 0.53, `— Level ${levelNum} —`, {
      fontFamily: GAME_FONT,
      fontSize: '6px',
      color: '#999999',
      stroke: '#000000',
      strokeThickness: 2,
      padding: FONT_PAD,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(50).setAlpha(0);

    const elements = [topLine, bottomLine, nameText, subText];

    // Fade in
    this.tweens.add({
      targets: elements,
      alpha: 1,
      duration: 800,
      ease: 'Sine.easeIn',
      onComplete: () => {
        // Hold for 2 seconds, then fade out
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: elements,
            alpha: 0,
            duration: 1000,
            ease: 'Sine.easeOut',
            onComplete: () => {
              elements.forEach(el => el.destroy());
            }
          });
        });
      }
    });
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

    // ── Make the player safe — nothing can hurt them after clearing the level ──
    this.player.isInvincible = true;

    // Destroy all enemies, traps, hazards, and flying hazards
    this.enemyManager.destroyAll();
    if (this.hazardSystem) this.hazardSystem.destroyAll();
    if (this.trapSystem) this.trapSystem.destroyAll();
    if (this.flyingHazardSystem) this.flyingHazardSystem.destroyAll();
    if (this.phantomSystem) this.phantomSystem.reset();

    // If soulless, restore the soul but forfeit the pending XP
    if (GameState.soul) {
      GameState.soul      = null;
      GameState.pendingXP = 0;
      if (this.player.soulOrb && this.player.soulOrb.active) {
        this.player.soulOrb.destroy();
      }
      this.player.soulOrb = null;
      this.player.sprite.setTint(this.player._baseTint());
    }

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

    // Spawn boss on arena floor (right side of arena)
    this.boss = new HollowKingBoss(this, 200, 200);
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

    this.player.isInvincible = true;
    this.hud.hideBossHealth();

    // Clear all remaining hazards so nothing can cheap-kill the player
    this.enemyManager.destroyAll();
    if (this.hazardSystem) this.hazardSystem.destroyAll();
    if (this.trapSystem) this.trapSystem.destroyAll();
    if (this.flyingHazardSystem) this.flyingHazardSystem.destroyAll();
    if (this.phantomSystem) this.phantomSystem.reset();

    // Restore soul if soulless (forfeit pending XP)
    if (GameState.soul) {
      GameState.soul      = null;
      GameState.pendingXP = 0;
      if (this.player.soulOrb && this.player.soulOrb.active) {
        this.player.soulOrb.destroy();
      }
      this.player.soulOrb = null;
    }

    // Dramatic death sequence
    this.cameras.main.shake(800, 0.015);
    this.cameras.main.flash(500, 255, 255, 200, false);

    // Advance level (wraps to level 1, increments loop)
    GameState.advanceLevel();

    this.time.delayedCall(2000, () => {
      this.scene.start('LoopCompleteScene');
    });
  }

  // ── Enemy respawn on player death ──────────────────────────────────────────

  _respawnEnemies() {
    const data = this.currentLevelData;
    if (!data || !data.enemySpawns) return;

    // Destroy all existing enemies
    this.enemyManager.destroyAll();

    // Clear flying bats and active darts
    if (this.flyingHazardSystem) this.flyingHazardSystem.destroyAll();
    if (this.trapSystem) this.trapSystem.destroyAll();

    // Reset phantom idle timer so it doesn't carry over from before death
    if (this.phantomSystem) this.phantomSystem.reset();

    // Respawn fresh enemies from level data
    this.enemyManager.spawn(data.enemySpawns, this.platforms, this.player);

    // Level 4: re-trigger the boss on respawn
    if (GameState.currentLevel === 4 && this._bossTriggered) {
      this._bossTriggered = false;
      this.boss = null;
      this._weakPointsHit.clear();
      // Reset weak point visuals
      for (const wp of this._weakPoints) {
        wp.hit = false;
        if (wp.obj) {
          wp.obj.setAlpha(1);
          wp.obj.setScale(1);
        }
      }
      this._triggerBoss();
    }
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
        fontFamily: GAME_FONT,
        fontSize:   '6px',
        color:      '#334433',
      }
    ).setScrollFactor(0).setDepth(20);

    // Gamepad debug — shows button indices when pressed
    this._gpDebugText = this.add.text(4, 230, '', {
      fontFamily: GAME_FONT,
      fontSize:   '8px',
      color:      '#44ff44',
      stroke:     '#000000',
      strokeThickness: 1,
    }).setScrollFactor(0).setDepth(20);
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
    const levelBonus = GameState.player.attackPowerBonus || 0;
    let attackPower = 1 + weaponBonus + levelBonus;

    if (this.player.isPlunging) {
      attackPower *= 2;
      // Hornet Ring: 40% chance for plunge crit (double again)
      const accP = GameState.player.accessory;
      if (accP && accP.effect === 'plunge_crit' && Math.random() < 0.4) {
        attackPower *= 2;
      }
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

        // Notify chest system when enemy dies (Phase 6)
        if (enemy.isDead && this.chestSystem) {
          this.chestSystem.onEnemyKilled(enemy.x, enemy.y);
        }

        if (this.player.isPlunging && !this.player.plungeHit) {
          this.player.plungeHit = true;
          this.player.body.setVelocityY(-150);
        }
      }
    }
  }

  // ── Projectile → enemy collision ──────────────────────────────────────

  _checkProjectileCollisions() {
    const projs = this.player.projectiles;
    if (!projs || projs.length === 0) return;

    const enemies = this.enemyManager.getEnemies();

    for (let i = projs.length - 1; i >= 0; i--) {
      const proj = projs[i];
      if (!proj || !proj.active) {
        projs.splice(i, 1);
        continue;
      }

      const px = proj.x;
      const py = proj.y;

      for (const enemy of enemies) {
        if (!enemy.sprite || !enemy.sprite.active) continue;
        if (enemy.isDead) continue;

        const ex = enemy.sprite.x;
        const ey = enemy.sprite.y - enemy.sprite.body.height / 2;
        const ew = enemy.sprite.body.width / 2 + 4;
        const eh = enemy.sprite.body.height / 2 + 4;

        if (Math.abs(px - ex) < ew && Math.abs(py - ey) < eh) {
          enemy.takeDamage(proj._damage || 1, px);

          // Notify chest system when enemy dies
          if (enemy.isDead && this.chestSystem) {
            this.chestSystem.onEnemyKilled(enemy.x, enemy.y);
          }

          // Piercing projectiles (skull key) pass through enemies
          if (proj._piercing) continue;

          proj.destroy();
          projs.splice(i, 1);
          break;
        }
      }
    }
  }

  // ── Enemy body → player contact damage ─────────────────────────────────────

  _checkEnemyContactDamage() {
    if (this.player.isInvincible || this.player.state === 'dead') return;

    const pb = this.player.body;
    if (!pb) return;
    const pcx = pb.center.x;
    const pcy = pb.center.y;
    const phw = pb.halfWidth;
    const phh = pb.halfHeight;

    const enemies = this.enemyManager.getEnemies();
    for (const enemy of enemies) {
      if (!enemy.sprite || !enemy.sprite.active || !enemy.sprite.body) continue;
      if (enemy.state === ENEMY_STATE.HURT || enemy.state === ENEMY_STATE.DEAD) continue;

      const eb = enemy.sprite.body;
      const ecx = eb.center.x;
      const ecy = eb.center.y;
      const ehw = eb.halfWidth;
      const ehh = eb.halfHeight;

      if (Math.abs(pcx - ecx) < phw + ehw &&
          Math.abs(pcy - ecy) < phh + ehh) {
        this.player.takeDamage(enemy.damage, ecx);
        return;
      }
    }
  }

  // ── update ────────────────────────────────────────────────────────────────

  update(time, delta) {
    // Level-up menu takes priority over all other input
    if (this.levelUpSystem.isActive) {
      this.levelUpSystem.update(this.inputManager, delta);
      this.hud.update(this.player);
      return;
    }

    // Check for level-up trigger
    this.levelUpSystem.update(this.inputManager, delta);

    // Debug shortcuts
    if (this.inputManager.isDebugGameOverPressed()) {
      this.scene.start('GameOverScene');
      return;
    }
    if (this.inputManager.isDebugLoopCompletePressed()) {
      this.scene.start('LoopCompleteScene');
      return;
    }
    if (this.inputManager.isDebugSkipLevelPressed()) {
      GameState.advanceLevel();
      this.scene.start('GameScene');
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

    // Chests & Mimics
    this.chestSystem.update(delta, this.player);

    // Rolling hazards
    this.hazardSystem.update(delta, this.player);

    // Flying hazards (bats)
    this.flyingHazardSystem.update(delta, this.player);

    // Traps (pendulums, darts)
    this.trapSystem.update(delta, this.player);

    // Phantom
    this.phantomSystem.update(delta, this.player);

    // Chloranthy Ring: passive mana regen (1 mana every 5 seconds)
    const accM = GameState.player.accessory;
    if (accM && accM.effect === 'mana_regen') {
      this._manaRegenTimer += delta;
      if (this._manaRegenTimer >= 5000) {
        this._manaRegenTimer -= 5000;
        GameState.player.mana = Math.min(GameState.player.maxMana, GameState.player.mana + 1);
      }
    }

    // Attack hitbox → enemy collision
    this._checkAttackHitboxCollisions();

    // Attack hitbox → breakable containers
    this.breakableSystem.checkHits(this.player);

    // Special attack projectile → enemy collision
    this._checkProjectileCollisions();

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

    // Gamepad debug display
    if (this._gpDebugText) {
      this._gpDebugText.setText(this.inputManager.getGamepadDebug());
    }
  }
}

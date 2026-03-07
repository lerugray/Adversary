# ADVERSARY — Changelog

All notable changes across development phases, organized chronologically.

---

## Phase 1 — Skeleton & Engine Setup

Established the core Phaser 3 project structure, scene manager, input system,
persistence layer, and display scaling.

### Files Created

- **`index.html`** — Main HTML entry point. Loads Phaser 3.60.0 via CDN,
  configures pixelated canvas rendering (256x240 NES resolution), loads all
  JS files via script tags in dependency order.
- **`src/main.js`** — Phaser 3 game config and bootstrap. 256x240 native
  resolution with FIT scaling, Arcade physics (world gravity 0, per-body
  gravity), gamepad plugin enabled. Registers all 9 scenes in order. Exposes
  `window.ADVERSARY` global with game, GameState, SaveManager, InputManager.
- **`src/systems/GameState.js`** — Global persistent state object. Tracks
  currentLevel (1-4), currentLoop, score. Provides `reset()` and
  `advanceLevel()` helpers. Persists across scene transitions without
  serialization.
- **`src/systems/SaveManager.js`** — Persistence layer via IIFE singleton.
  localStorage backend for high scores and settings. Swappable
  `useBackend()` method for future Steam Cloud adapter.
- **`src/systems/InputManager.js`** — Per-scene input abstraction. Maps
  arrow keys to D-Pad, Z to Jump, X to Attack, Enter to Start/Pause.
  Provides `isXxxHeld()`, `isXxxJustPressed()`, `isAnyJustPressed()`.
  Gamepad detection stub. Debug shortcuts: G (GameOver), L (LoopComplete).
- **`src/scenes/sceneUtils.js`** — Shared utility. `_addSceneLabel(scene, name)`
  adds a small debug label in the top-left corner of any scene.
- **`src/scenes/BootScene.js`** — First scene. Sets background color, adds
  scene label, immediately transitions to PreloadScene. Stub for future
  platform detection (Electron vs browser).
- **`src/scenes/PreloadScene.js`** — Asset loading scene. Displays progress
  bar. Loads a placeholder base64-encoded 16x16 white PNG to validate the
  asset pipeline. Stubs for `_loadSpritesheets()`, `_loadTilemaps()`,
  `_loadAudio()`, `_loadUI()`. Transitions to TitleScene.
- **`src/scenes/TitleScene.js`** — Title screen. Displays "ADVERSARY" in
  red with stroke, blinking "PRESS ANY KEY TO START" prompt. Calls
  `GameState.reset()` on entry. Transitions to GameScene on any input.
- **`src/scenes/GameScene.js`** — Main gameplay scene (initial stub with
  placeholder background and debug text).
- **`src/scenes/PauseScene.js`** — Overlay scene launched via
  `scene.launch()`. Semi-transparent backdrop, "PAUSED" text, resume on
  Enter. Emits `resume-game` event so GameScene can resume.
- **`src/scenes/InterludeScene.js`** — Between-level story beat stub. Shows
  "INTERLUDE" and next level number. Auto-advances after 2s or on any key.
- **`src/scenes/LoopCompleteScene.js`** — Loop victory screen stub. Displays
  "LOOP COMPLETE!" with loop number and blinking continue prompt.
- **`src/scenes/GameOverScene.js`** — Game over screen. Displays final score.
  Saves score to SaveManager (top 10, sorted descending). Auto-advances to
  HighScoreScene after 1.5s.
- **`src/scenes/HighScoreScene.js`** — High score table. Displays top 10
  entries (rank, score, loop, level). Top score highlighted gold. Returns
  to TitleScene on any key.

---

## Phase 2 — Player System

Implemented all player movement, combat, knockback/hit reaction, death/soul
mechanic, HUD overlay, and wired player stats to GameState.

### Files Created

- **`src/entities/PlayerEntity.js`** — Self-contained player logic:
  - **Movement**: 80px/s walk speed, Castlevania-weight feel, no movement
    while ducking. Facing direction tracked for attacks.
  - **Jumping**: -280 impulse, variable height (hold Z for up to 14 frames
    of additional -18 boost per frame). 600 px/s^2 gravity.
  - **Ducking**: Down while grounded shrinks body hitbox from 10x22 to 10x12.
  - **Attacks**: Standing (16x8 hitbox), Ducking/Low (14x6), Air (16x10),
    Plunging (Down+X in air, 380px/s downward, 10x8 hitbox). 400ms cooldown,
    200ms hitbox active duration.
  - **Special attacks**: Up+X fires projectile. 6-type architecture stub
    (knife, axe, holy water, cross, skull key, ember flask) with per-type
    colors and trajectory arcs. Costs 1 mana.
  - **Knockback**: On damage, 160px/s horizontal (away from source) + -200
    vertical. Locks out input until landing. 1500ms i-frames with alpha
    flashing.
  - **Death & Soul**: First death spawns soul orb at last safe ground
    position, respawns player at level start with 1 HP. Second death (soul
    already exists) triggers Game Over. Soul retrieved on overlap restores
    pending XP.
  - **Placeholder visual**: Graphics-generated colored rectangle (white head,
    grey torso, dark legs) with 0x88ccff tint.
- **`src/ui/HUD.js`** — Heads-up display overlay (scrollFactor 0, depth 10-11):
  - HP hearts: colored squares (red = full, dark red = empty), max 20.
  - MP, XP, LV, Special attack labels.
  - Score (top-right), Loop indicator (top-center, shown only if loop > 1).
  - Soul directional arrow: shows arrow glyph pointing toward off-screen
    soul orb from nearest screen edge.

### Files Modified

- **`src/systems/GameState.js`** — Added `player` sub-object with hp, maxHp,
  mana, maxMana, xp, level, weapon/armor/accessory slots, specialAttack.
  Added soul/pendingXP fields. Updated `reset()` to initialize all fields.
- **`src/scenes/GameScene.js`** — Added player spawning, platform collision,
  camera follow, HUD instantiation, pause handling.

---

## Phase 3 — Level 1 Buildout

Built the first playable level ("Firelink Shrine") with tilemap-style platform
geometry, ladder climbing, checkpoint/bonfire detection, and soul-orb clamping
to valid platform surfaces.

### Files Created

- **`src/levels/Level1.js`** — "Firelink Shrine" level data (pure data, no
  Phaser calls). 256x320 world. 6 platform tiers (ground through summit).
  5 ladder zones connecting all tiers. Bonfire checkpoint at summit (36, 28).
  Player spawn at (28, 274). 6 enemy spawn markers. 9 decorative elements
  (pillar stumps, arch fragments, rubble, distant silhouettes).
- **`src/systems/LadderSystem.js`** — Ladder zone manager using manual AABB
  overlap (no physics bodies):
  - **Visuals**: Amber-colored rails (2px wide) and rungs (10px wide, every 8px).
  - **Player climb**: Enter with Up/Down while overlapping zone. Exit with
    Left/Right/Jump or reaching zone top/bottom. 60px/s climb speed. Snaps
    player X to ladder center.
  - **Public API**: `getZoneAt(x, y)` and `isOnLadder(entity)` for enemy AI.
  - **Climb exit**: Jump off ladder gives -180 upward velocity. Reaching top
    gives small -20 nudge to clear the platform edge.

### Files Modified

- **`src/scenes/GameScene.js`** — Major expansion:
  - Reads Level1Data to build platforms (static physics group with tier-based
    color ramp), decorations (no collision), and ladders.
  - Checkpoint/bonfire: pulsing orange/amber circles with tweens. Manual AABB
    overlap detection. Celebration sequence (scale-up, camera shake, amber
    flash) on trigger. Calls `advanceLevel()` and transitions.
  - Camera bounds set to level world dimensions. Follows player with smooth
    lerp (0.12) and deadzone (40x30).
  - Soul spawn monkey-patched on PlayerEntity instance to clamp soul orb to
    nearest valid platform surface (searches platform data for closest
    surface Y above the raw position).

---

## Phase 4 — Enemy & Item Systems

Full enemy AI with 5 enemy types, item drop/pickup/equip system, and the
Phantom anti-grinding mechanic.

### Files Created

- **`src/entities/EnemyEntity.js`** — Base class for all enemies:
  - State machine: IDLE, WALK, ATTACK, HURT, DEAD.
  - Colored rectangle placeholder sprite with physics body.
  - `takeDamage(amount, sourceX)`: subtract HP, enter HURT state with 300ms
    stun and 80/-100 knockback, or die if HP <= 0.
  - Death: awards XP + score to GameState, rolls item drops via ItemSystem,
    white flash + 400ms fade-out + destroy.
  - Utility methods: `distanceTo()`, `hDistTo()`, `vDistTo()`.
  - Virtual methods: `getDropTable()`, `_restoreTint()`, `update()`.

- **`src/entities/enemies/HollowSoldier.js`** — Basic melee patrol:
  - 1 HP, 1 damage, 10 XP, 50 score. 10x18 rusty red rectangle.
  - Patrol: 30px/s, turns at walls and platform edges (raycasts forward using
    level platform data).
  - Chase: 50px/s when player within 60px H + 25px V. Won't walk off edges.
  - Attack: 14px range, 400ms orange-tinted windup, 900ms cooldown.
  - Drops: 45% mana shard, 15% heart.

- **`src/entities/enemies/HollowArcher.js`** — Stationary ranged:
  - 1 HP, 1 damage, 15 XP, 75 score. 8x18 blue-grey rectangle.
  - Stands still, faces player. Fires horizontal arrows when player within
    120px H + 30px V. 2.5s cooldown (1.25s initial).
  - Arrow: 8x3 rectangle, 100px/s horizontal, 2.5s lifetime. Collides with
    platforms. Manual overlap check for player damage.
  - Cleans up all arrows on death.
  - Drops: 50% mana shard.

- **`src/entities/enemies/HollowKnight.js`** — Tougher melee with climbing:
  - 3 HP, 2 damage, 30 XP, 150 score. 12x22 dark purple rectangle.
  - Patrol: 22px/s. Chase: 38px/s within 80px H + 30px V.
  - Attack: 16px range, 550ms red-tinted windup, 1200ms cooldown.
  - Ladder climbing: 40% chance when encountering a ladder zone while
    patrolling. 35px/s climb speed. Randomly chooses up or down. Exits
    climb on hurt.
  - Drops: 25% heart, 5% weapon, 5% armor.

- **`src/entities/enemies/Skeleton.js`** — Reassembling enemy:
  - 1 HP, 1 damage, 20 XP, 80 score. 10x18 bone-yellow rectangle.
  - Same patrol/chase/attack AI as HollowSoldier.
  - First death: collapses (shrink + fade to 40% alpha), awards 25% score
    only, reassembles after 1.5s at 1 HP with flash. No drops.
  - Second death: permanent. Normal drops (45% mana shard).
  - Special attack kills bypass reassembly (instant permanent death).

- **`src/entities/enemies/Gargoyle.js`** — Flying swooper:
  - 2 HP, 1 damage, 20 XP, 100 score. 14x10 dark grey-green rectangle.
  - Zero gravity, origin center. Patrols horizontally between
    patrolLeft/Right at patrolY altitude (40px/s).
  - Swoop: triggers when player within 80px H and below gargoyle. Dives
    diagonally at 90px/s toward player position, then returns to patrol
    altitude at 50px/s.
  - Contact damage: 1 damage on overlap, 800ms cooldown.
  - `isHitboxValidAngle(hitboxY)`: prevents low/duck attacks from connecting
    (hitbox must be within 8px below gargoyle center).
  - Drops: 40% mana shard.

- **`src/systems/EnemyManager.js`** — Enemy lifecycle manager:
  - Type registry: hollow_soldier, hollow_archer, hollow_knight, skeleton,
    gargoyle.
  - `spawn(spawnPoints, platforms, player)`: instantiates enemies from data,
    adds platform colliders.
  - `update(delta, player)`: iterates all enemies, removes fully destroyed.
  - `getEnemies()`: returns living enemies. `getAllEnemies()`: includes dying.
  - `destroyAll()`: cleanup for scene restart.

- **`src/systems/ItemSystem.js`** — Drop and pickup system:
  - Item definitions: mana_shard (6x6 blue), heart (8x8 red), weapon (10x10
    grey), armor (10x10 gold).
  - `rollDrop(x, y, dropTable)`: rolls once per enemy death, spawns first
    successful drop.
  - Items pop upward (-80 vy), fall with 200 gravity, bounce (0.3), collide
    with platforms. 8s lifetime, blink during last 2s.
  - Pickup: manual overlap check (10px H, 14px V). Effects: mana_shard
    restores 1-2, heart restores 1 HP, weapon/armor equip from random pool.
  - Weapon pool: Rusty Sword (+1), Iron Blade (+2), Knight Saber (+3).
  - Armor pool: Leather Vest (+1), Chain Mail (+2), Plate Armor (+3).
  - Yellow flash on player sprite confirms pickup.

- **`src/systems/PhantomSystem.js`** — Anti-grinding ghost:
  - 20s base trigger timer (reduced 3s/loop, min 8s). Tracks player's
    highest Y (lowest screen position). Progress = climbing 30+ px above
    previous high.
  - Telegraph: 2.5s of flashing "!! DANGER !!" text before spawn.
  - Phantom: semi-transparent 16px circle, 40px/s direct movement toward
    player (ignores all geometry). 2 damage on contact, 1.5s cooldown.
    Completely invincible.
  - Retreats when player climbs 40px above trigger position. Fades out over
    300ms.
  - Disabled in Level 4 (boss level).

- **`src/levels/Level2.js`** — "Crestfall" level data. 256x320 world, 7 tiers.
  Ruined city theme. 6 ladder zones. 9 enemy spawns (soldiers, skeletons,
  archers, knight). Gate checkpoint.

- **`src/levels/Level3.js`** — "The Iron Gauntlet" level data. 256x360 world
  (tallest), 8 tiers. Iron architecture theme. 7 ladder zones. 9 enemy
  spawns including gargoyles. Full-width gauntlet platforms forcing combat.
  Iron gate checkpoint.

- **`src/levels/Level4.js`** — "The Ivory Spire" level data. 256x280 world,
  7 tiers. Cathedral theme. 2 ladder zones. 3 pre-boss enemy spawns. No
  checkpoint — uses bossThreshold at y=100. Boss arena with wide floor +
  upper ledges + ceiling ledge. 4 weak points for stagger mechanic.

### Files Modified

- **`src/scenes/GameScene.js`** — Added:
  - EnemyManager spawning from Level1Data.enemySpawns.
  - ItemSystem and PhantomSystem instantiation.
  - `_checkAttackHitboxCollisions()`: per-frame AABB test of player attack
    hitbox against all living enemies. Weapon bonus applied. Plunging deals
    2x damage with upward bounce on hit. Hit-list Set prevents multi-hit
    per swing.
  - `_checkEnemyContactDamage()`: per-frame overlap test of enemy bodies
    against player. Skips hurt/dead enemies. Only one damage source per frame.
- **`index.html`** — Added script tags for EnemyEntity, all 4 enemy types
  (HollowSoldier, HollowArcher, HollowKnight, Skeleton), EnemyManager,
  ItemSystem, PhantomSystem. Added Level2-4 data files.

---

## Phase 4 Patches — Bug Fixes

Three bugs fixed before Phase 5B work began.

### Files Modified

- **`src/systems/PhantomSystem.js`** — Fixed syntax error at lines 78-82.
  Literal `...` (invalid JS outside of spread context) replaced with
  properly structured if-block. Fixed broken indentation. The progress
  check now correctly contains the idle timer reset and phantom retreat
  condition.
- **`src/entities/enemies/Skeleton.js`** — Fixed `_isAtPlatformEdge()` to
  read `this.scene.currentLevelData.platforms` instead of hardcoded
  `Level1Data.platforms`.
- **`index.html`** — Added missing script tags for Level2.js, Level3.js,
  Level4.js in correct load order (after Level1.js, before LadderSystem.js).

---

## Phase 5B — Levels 2-4, Boss Fight & Level Transitions

Made GameScene level-aware, wired all 4 levels into the game loop, implemented
the full Level 4 boss fight with multiple attack patterns, stagger mechanic,
and dramatic death sequence.

### Files Created

- **`src/levels/LevelRegistry.js`** — Maps level numbers 1-4 to their data
  objects (`{1: Level1Data, 2: Level2Data, 3: Level3Data, 4: Level4Data}`).
  Loaded after all level data files and before GameScene.

- **`src/entities/enemies/HollowKingBoss.js`** — The Dark Knight, Level 4
  boss. Extends EnemyEntity:
  - **Stats (loop 1)**: 20 HP, 2 damage (slash), 3 damage (leap/charge),
    200 XP, 1000 score. 16x26 deep purple rectangle.
  - **Loop scaling**: +8 HP, +1 damage, +10% speed per loop.
  - **AI states**: IDLE, WALK, SLASH, LEAP, CHARGE, BASH, STAGGER, DYING.
  - **Slash**: Close-range melee. 400ms red-tinted windup, 20px range,
    800ms cooldown. Brief forward lunge on execute.
  - **Leap**: Mid-range jump attack. 500ms orange-tinted windup, -300 jump
    velocity, diagonal arc toward player, heavy damage (3) on landing,
    camera shake. 1.5s cooldown.
  - **Charge**: Dash across arena. 600ms windup with red/white blink
    telegraph, 180px/s for 600ms. Heavy damage on contact. Self-stuns
    (1.2s) on wall collision. 2s cooldown.
  - **Shield Bash** (loop 2+ only): AoE close-range knockback. 350ms
    blue-white windup, 30px radius, visual burst circle. 35% chance at
    close range. 1.8s cooldown.
  - **Stagger**: Triggered externally when all 4 weak points hit. 3s
    vulnerability window with 2x damage multiplier and yellow flashing.
    Boss frozen during stagger. Light knockback from hits during stagger.
  - **No hurt-stun**: Boss cannot be interrupted by normal attacks (no
    HURT state from regular hits). Only staggers from weak points.
  - **Contact damage**: Always active (12px H, 16px V overlap). Disabled
    during stagger and death.
  - **Death sequence**: Multi-flash over 1.5s (white/red/white/orange/white)
    with progressive camera shakes. Final explosion: 400ms screen flash,
    strong shake, sprite scales up 2x and fades. Awards XP/score, drops
    items (100% heart, 40% weapon, 40% armor).
  - **Action selection**: Weighted random based on distance to player. Avoids
    repeating same attack consecutively.

### Files Modified

- **`src/scenes/GameScene.js`** — Full rewrite for level awareness:
  - Reads `GameState.currentLevel` on `create()`, looks up data via
    `LevelRegistry[levelNum]`, stores as `this.currentLevelData`.
  - All `Level1Data` references replaced with `this.currentLevelData` or
    local `data` alias.
  - Handles null checkpoint gracefully (Level 4 has no bonfire).
  - Added tier colors 6 and 7 for Levels 2-4 platform rendering.
  - **Level transition flow**: Checkpoint trigger calls `advanceLevel()` then
    restarts `GameScene` (loads the next level automatically).
  - **Boss system (Level 4 only)**:
    - `_buildWeakPoints()`: creates 4 pulsing green circles from level data.
    - `_checkBossThreshold()`: spawns boss when player crosses threshold Y.
    - `_triggerBoss()`: instantiates HollowKingBoss at (180, 84), adds
      platform collider, pushes into enemyManager, shows boss health bar.
    - `_checkWeakPointHits()`: AABB test of player attack hitbox against
      weak point circles. Hit weak points flash white and shrink. All 4
      hit triggers `boss.triggerStagger()`.
    - `_updateBoss()`: updates boss health bar each frame, detects boss
      death to trigger victory.
    - `_onBossDefeated()`: hides boss health bar, dramatic camera shake +
      flash, calls `advanceLevel()` (wraps to level 1, increments loop),
      transitions to LoopCompleteScene after 2s delay.

- **`src/scenes/LoopCompleteScene.js`** — Fixed transition flow:
  - Removed duplicate `advanceLevel()` call (already called by
    `_onBossDefeated()`).
  - Displays "Starting Loop N" (reads already-incremented currentLoop).
  - On any key: transitions directly to GameScene (level is already 1).

- **`src/ui/HUD.js`** — Added boss health bar system:
  - **Boss bar elements** (hidden by default): 180px-wide background bar,
    fill bar, border with stroke, "THE DARK KNIGHT" label. Positioned at
    bottom of screen.
  - `setBossHealth(current, max)`: shows bar, updates fill width based on
    HP ratio. Color shifts: red (>50%) -> orange (25-50%) -> dark red (<25%).
  - `hideBossHealth()`: hides all boss bar elements.

- **`index.html`** — Added 3 missing script tags:
  - `src/levels/LevelRegistry.js` (after Level4.js, before LadderSystem.js).
  - `src/entities/enemies/Gargoyle.js` (after Skeleton.js — was missing since
    Phase 4 despite being in the ENEMY_TYPES registry).
  - `src/entities/enemies/HollowKingBoss.js` (after Gargoyle.js, before
    EnemyManager.js).

---

## Phase 6 — Chests & Mimics

Added contextual chest spawning after enemy kills (post-loop 1 only) and
the Mimic enemy — a chest-disguised threat that rewards observant players.

### Files Created

- **`src/systems/ChestSystem.js`** — Chest spawning and lifecycle manager:
  - Only active when `GameState.currentLoop >= 2` (after first loop).
  - `onEnemyKilled(x, y)`: 15% base chance to spawn a chest at enemy death
    location. +10% bonus if 2+ kills within 2 seconds (multi-kill reward).
  - Normal chests: 12x10 brown/gold rectangles with highlight strip. 15s
    lifetime, blink during last 3s. Player overlap opens chest with gold
    flash, 50 score bonus, and generous drop roll (30% weapon, 30% armor,
    50% heart, 100% mana shard fallback).
  - Mimic selection: 25% of spawned chests are mimics on loop 2, +8% per
    additional loop, capped at 65%. Spawns a Mimic enemy instance instead.
  - `update(delta, player)`: ticks chest lifetimes, checks player overlap
    for normal chests, runs mimic ambush checks.
  - `destroyAll()`: cleanup for scene restart.

- **`src/entities/enemies/Mimic.js`** — Chest-disguised enemy (extends
  EnemyEntity):
  - **Chest form**: 12x10 brown rectangle, identical to normal chests.
    Subtle tell: very slight breathing scale pulse (1.03x/0.97x, 1.2s
    cycle) that normal chests don't have.
  - **Ambush**: If player touches mimic without attacking first, deals 3
    heavy damage and transforms. `checkAmbush(player)` called by
    ChestSystem each frame.
  - **Attack-first path**: If player attacks the chest, mimic takes damage
    normally and wakes up. Can be killed before fully transforming.
  - **Transformation**: 500ms wake animation with red flash, scale pulse,
    and camera shake. Body resizes from 12x10 to 14x16, texture changes
    to dark red.
  - **Active AI**: Fast aggressive chase (70px/s). 14px attack range, 350ms
    windup, 800ms cooldown. Platform edge detection prevents walking off.
  - **Stats**: 4 HP, 2 contact damage (3 on ambush), 40 XP, 200 score.
  - **Drops**: Guaranteed rare+ (45% weapon, 45% armor, 100% heart fallback).

### Files Modified

- **`src/scenes/GameScene.js`** — Added:
  - ChestSystem instantiation in `create()` (after EnemyManager).
  - `chestSystem.update(delta, player)` call in update loop.
  - Enemy kill notification: `chestSystem.onEnemyKilled(x, y)` called in
    `_checkAttackHitboxCollisions()` when an enemy dies from player attack.

- **`index.html`** — Added script tags for `Mimic.js` (after
  HollowKingBoss.js) and `ChestSystem.js` (after ItemSystem.js).

---

## Known Items — Phases 7-11

The following phases remain unimplemented per the Master Design Document.

### Phase 7 — UI & Screens
- Full pause/inventory screen with equipment management and controller
  navigation.
- Animated interlude cutscene panels between levels (Pac-Man style story
  beats).
- 3-character initials entry on high score (old-school arcade style).
- Narrative text, portrait art, and voice-over timing for interludes.

### Phase 8 — Asset Integration
- Replace all colored-rectangle placeholders with real sprite sheets and
  texture atlases.
- Swap programmatic level geometry for Tiled JSON tilemap exports.
- NES palette constraint: 54 hardware colors, max 4 per background tile,
  max 3 + transparency per sprite.
- Integrate chiptune music (BeepBox/FamiTracker) and SFX (JSFXR).
- Audio tracks needed: title theme, level 1-3 themes, boss theme, phantom
  warning, loop complete, game over, high score entry.
- SFX needed: jump, attack, hit, hurt, death, soul, items, chest, mimic,
  level up, special attacks, boss stagger/death, phantom, knockback.

### Phase 9 — Loop System & Secrets
- Per-loop enemy scaling: HP and damage increase, spawn rates rise.
- Platform arrangement subtle randomization per loop.
- Phantom trigger timer shortens and movement speed increases per loop.
- Loop-exclusive enemies: Silver Knight (fast armored variant), Painting
  Guardian (fast + aggressive), Titanite Demon (rare + powerful), Darkmoon
  Soldier (ranged + special projectiles).
- Score multipliers and combo counters.
- Level completion time bonus.
- Soul retrieval score multiplier.
- Environmental easter eggs: hollows sitting by walls, ground messages,
  illusory walls with Dark Souls references.
- Attract-mode demo playback on idle title screen.
- Breakable objects: barrels, crates, coffins with item drops.

### Phase 10 — Electron Wrapper & Desktop Build
- Package game for desktop via Electron (.exe/.app).
- Implement SaveManager Electron path (local file fallback).
- Full gamepad support via Phaser gamepad API (currently stubbed in
  InputManager).
- Test builds on Windows/Mac.

### Phase 11 — Steam Prep
- Greenworks (Steamworks SDK) integration.
- Achievements design and implementation.
- Steam Cloud save via SaveManager backend swap
  (`SaveManager.useBackend(SteamBackend)`).
- Steam leaderboard sync for high scores.
- Steam store page assets and submission materials.

### Cross-Phase Items Not Yet Implemented
- Level-up system: pick one per level (max HP +1, attack power up, max mana
  +3, speed boost).
- Accessory system: Rusted Ring (speed), Hawk Ring (range), Chloranthy Ring
  (mana regen), Covetous Ring (drop rates), Hornet Ring (plunge crits),
  Ring of Fog (extended i-frames).
- Special attack pickup cycling (swap current special on collect).
- Armor damage negation chance mechanic.
- Loop count displayed as subtle HUD indicator (currently only shows if > 1).

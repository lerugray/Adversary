# ADVERSARY — Session Notes

## What we worked on
- Bug fixes (plunge attack, enemy death crash, duck-ladder glitch, phantom reset)
- Level 2 flying bats (DK-style timed hazard)
- Level 3 Sen's Fortress redesign (pendulums, dart traps)
- Destructible containers on Levels 1-3
- Special attack drop rates improved
- Debug level-skip on R1 gamepad button

## What got done

### Bug Fixes
1. **Plunge attack acceleration** — body gravity wasn't being zeroed (world gravity was already 0, per-body gravity was the issue). Now zeroes body gravity on plunge start, restores on end. Also enforces constant velocity every frame during plunge.
2. **Crash when hit during plunge** — takeDamage now cancels plunge state (clears isPlunging, restores gravity, deactivates hitbox) before applying knockback.
3. **Enemy death crash** — sprite.body accessed after destruction during death fade tween. Added `_skipUpdate` flag in base EnemyEntity.update(), all 6 subclasses + boss now check it.
4. **Duck-ladder glitch** — ladder system used hardcoded `py - 11` for body center; now uses actual `body.center.y`. Ducking also blocked while on a ladder.
5. **Phantom not resetting on death** — the `player.state === 'dead'` check only caught one frame. Added `phantomSystem.reset()` called on player-respawn event.
6. **Safety guard** — player update bails if sprite.body is gone.

### New Systems
7. **FlyingHazardSystem** — DK-style bats fly across screen on 6s timer (Level 2 only). Spawn near player Y but avoid platforms. Killable for 30 score + 5 XP.
8. **TrapSystem** — Pendulum blades (swinging sine-wave) and dart traps (wall-mounted timed arrows). Used on Level 3.
9. **BreakableSystem** — Destructible crates/barrels. Attack to break for items + 25 score. Debris particle effect.

### Level Changes
10. **Level 2** — Added flying bat config (6s interval, 65 px/s) and 3 breakable containers off main path.
11. **Level 3 redesign** — "The Iron Passage" as Sen's Fortress: world expanded 360→540px for 60px headroom. 4 pendulums (increasing speed/damage per tier), 5 dart traps (crossfire on Tier 3). Only 6 enemies (traps are the main threat). 2 breakable containers.
12. **Level 1** — Added 3 breakable containers off main path.

### Drop Table & Debug
13. **Special attack drops** — added to archers (6%), skeletons (8%), gargoyles (7%). Previously only knights dropped them.
14. **R1 level skip** — gamepad button 5 skips to next level for debug testing.

### Files Created
- src/systems/FlyingHazardSystem.js
- src/systems/TrapSystem.js
- src/systems/BreakableSystem.js

### Files Modified
- src/entities/PlayerEntity.js (plunge fix, duck-ladder, body guard)
- src/entities/EnemyEntity.js (_skipUpdate flag)
- src/entities/enemies/* (all 6 subclasses + boss: _skipUpdate check)
- src/systems/LadderSystem.js (actual body center)
- src/systems/PhantomSystem.js (reset method, respawn wiring)
- src/systems/InputManager.js (R1 debug skip)
- src/systems/ItemSystem.js (unchanged but investigated)
- src/scenes/GameScene.js (wire new systems, respawn cleanup, level skip)
- src/levels/Level1.js, Level2.js, Level3.js (containers, bats, full L3 redesign)
- index.html (3 new script tags)

## Current state
- Levels 1-3 playable with new features, Level 4 boss fight unchanged
- Level 3 needs playtesting — pendulum timing, dart patterns, headroom feel
- Breakable containers need testing on all 3 levels
- Flying bats on Level 2 at 6s timer — may need tuning

## What's next
- Playtest Level 3 traps (pendulum/dart tuning)
- Playtest breakable containers across all levels
- Phase 7: UI & Screens (pause/inventory, interludes, high score initials)
- More polish as needed from playtesting

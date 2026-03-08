# ADVERSARY — Session Notes

## What we worked on
- Polish pass: dodge roll, bat spawning, font clipping, hazard cleanup, soul/tint system, Level 2 layout, dart jump bonus

## What got done

1. **Dodge roll tuning** — Shortened roll: speed 120→90 px/s, duration 350→250ms, i-frames 220→160ms (~22px travel).
2. **Dodge roll remap** — Removed double-tap trigger. Dodge is now C key / R1 controller. Rolls in held direction or facing direction. Debug skip-level moved to L1.
3. **Bat spawn fix** — Bats spawn from opposite side when player is within 40px of screen edge.
4. **Font clipping fix** — Added `FONT_PAD` constant in sceneUtils.js. Applied padding to every text element across all scenes/systems.
5. **Hazard cleanup on level complete** — Skulls, enemies, traps, bats all destroyed at checkpoint and boss defeat. Player made invincible during transitions.
6. **Ladder tint fix** — Climbing/exit now uses `_baseTint()` to respect soulless state.
7. **I-frame tint fix** — When i-frames expire, tint now properly restores to `_baseTint()` instead of leaving stale color.
8. **Item pickup tint fix** — ItemSystem pickup flash now restores `_baseTint()` instead of hardcoded blue.
9. **Soul system refinement** — XP zeroed on death, restored on soul pickup. Completing a level while soulless restores soul but forfeits pending XP. Player can still earn XP and level up while soulless.
10. **Level 2 archer perches** — Moved two downward-shooting archers onto small inaccessible platforms (Tier 5 right perch, summit perch) so they're environmental hazards, not melee encounters.
11. **Level 2 checkpoint** — Moved further right (x=36 → x=88) on the summit platform.
12. **Dart jump bonus** — Jumping over darts in Level 3 awards +25 score with floating popup (same style as skull/arrow bonuses).

### Files Modified
- src/entities/PlayerEntity.js (dodge tuning/remap, i-frame tint fix)
- src/systems/InputManager.js (dodge button, debug skip moved)
- src/systems/FlyingHazardSystem.js (bat edge spawn, font padding)
- src/systems/TrapSystem.js (dart jump bonus)
- src/systems/HazardSystem.js (font padding)
- src/systems/LadderSystem.js (soulless tint fix)
- src/systems/LevelUpSystem.js (font padding)
- src/systems/ItemSystem.js (pickup tint fix)
- src/systems/BreakableSystem.js, PhantomSystem.js (font padding)
- src/scenes/sceneUtils.js (FONT_PAD constant)
- src/scenes/GameScene.js (hazard cleanup, soul restore on level complete, font padding)
- src/scenes/TitleScene.js, GameOverScene.js, InterludeScene.js, LoopCompleteScene.js, PauseScene.js, PreloadScene.js, HighScoreScene.js (font padding)
- src/ui/HUD.js (font padding)
- src/entities/enemies/HollowArcher.js (font padding)
- src/entities/EnemyEntity.js, src/entities/enemies/HollowKingBoss.js (XP award cleanup)
- src/levels/Level2.js (archer perches, checkpoint repositioned)

## Current state
- Levels 1-3 playable, Level 4 boss fight unchanged
- Dodge roll feels tighter, mapped to dedicated button
- All text renders without clipping
- Soul/tint system solid across all states (climbing, i-frames, items, dodge)
- Level 2 archers are now proper environmental hazards

## What's next
- Phase 7: UI & Screens (full pause/inventory, interludes, high score initials)
- More polish as needed

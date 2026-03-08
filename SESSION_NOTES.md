# ADVERSARY — Session Notes

## What we worked on
- Polish pass: dodge roll, bat spawning, font clipping, hazard cleanup, soul system

## What got done

1. **Dodge roll tuning** — Shortened roll: speed 120→90 px/s, duration 350→250ms, i-frames 220→160ms. Now covers ~22px instead of ~42px.
2. **Dodge roll remap** — Removed accidental double-tap trigger. Dodge is now C key (keyboard) / R1 (controller). Rolls in held direction or facing direction if neutral. Debug skip-level moved from R1 to L1.
3. **Bat spawn fix** — Bats now spawn from the opposite side when player is within 40px of a screen edge, preventing cheap unavoidable hits.
4. **Font clipping fix** — Added `FONT_PAD` constant (`{ top: 2, bottom: 2 }`) in sceneUtils.js. Applied to every text element across all scenes and systems so pixel fonts are no longer cut off.
5. **Hazard cleanup on level complete** — Bouncing skulls (HazardSystem) now destroyed at checkpoint and boss defeat, along with all other hazards. Player also made invincible after boss defeat.
6. **Ladder tint fix** — Ladder climbing/exit no longer resets player to blue when soulless. Now uses `_baseTint()` to respect soul state.
7. **Soul system refinement** — XP earned before death is stored in the soul orb. Player CAN still earn new XP and level up while soulless. Completing a level while soulless restores the soul but forfeits the pending XP. Picking up the soul restores the old XP.

### Files Modified
- src/entities/PlayerEntity.js (dodge tuning + remap, removed double-tap)
- src/systems/InputManager.js (dodge button: C key + R1, debug skip moved to L1)
- src/systems/FlyingHazardSystem.js (bat edge spawn logic, font padding)
- src/scenes/sceneUtils.js (FONT_PAD constant)
- src/ui/HUD.js (font padding)
- src/scenes/TitleScene.js, GameOverScene.js, InterludeScene.js, LoopCompleteScene.js, PreloadScene.js, HighScoreScene.js, PauseScene.js, GameScene.js (font padding, hazard cleanup, soul restore on level complete)
- src/systems/BreakableSystem.js, HazardSystem.js, PhantomSystem.js, LevelUpSystem.js (font padding)
- src/entities/enemies/HollowArcher.js (font padding)
- src/entities/EnemyEntity.js, src/entities/enemies/HollowKingBoss.js (reverted XP block)
- src/systems/LadderSystem.js (soulless tint fix)

## Current state
- Levels 1-3 playable, Level 4 boss fight unchanged
- Dodge roll feels tighter, mapped to dedicated button
- All text renders without clipping
- Soul system works: die → lose XP → earn new XP freely → recover soul or forfeit on level complete

## What's next
- Phase 7: UI & Screens (full pause/inventory, interludes, high score initials)
- More polish as needed

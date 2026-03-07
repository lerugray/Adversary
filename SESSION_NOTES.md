# ADVERSARY — Session Notes

## What we worked on
- Cross-phase items (before Phase 7) + playtesting bug fixes

## What got done

### Cross-Phase Features
1. **Level-Up System** (LevelUpSystem.js) — XP thresholds trigger a choice menu: +1 max HP, +1 attack power, +3 max mana, or speed boost
2. **Armor Damage Negation** — equipped armor has a chance (15% per defenseBonus) to block 1 damage
3. **Accessory System** — 6 rings with passive effects: Rusted Ring (speed), Hawk Ring (range), Chloranthy Ring (mana regen), Covetous Ring (drops), Hornet Ring (plunge crits), Ring of Fog (i-frames)
4. **Special Attack Pickup Cycling** — pink pickups cycle through knife/axe/holy water/cross/skull key/ember flask
5. **Special attacks now deal damage** — projectiles collide with enemies (knife=1, axe/cross/holy water=2, skull key=3, ember flask=4)

### Bug Fixes & Polish
- Fixed PreloadScene freeze (data URI blocked on file:// protocol, switched to generated texture)
- Fixed HUD crash (missing `H` variable for screen height)
- Fixed player sprite invisible (texture drawn at negative coordinates, rewritten)
- Fixed ducking not visible (sprite now squashes to half height)
- Added visible sword slash rectangle during attacks (white for normal, orange for plunge)
- Fixed ladder climbing — player can now pass through platforms while climbing
- Fixed player walking off screen edge (enabled world bounds collision)
- Reduced jump height to Donkey Kong levels (short hop only, ladders required for vertical travel)
- Added stepping-stone platforms to Level 1 for short-jump navigation
- Moved HollowKnights away from ladder exits
- GameState.player now tracks attackPowerBonus and speedBonus

### Files Changed
- **New:** src/systems/LevelUpSystem.js
- **Modified:** GameState.js, PlayerEntity.js, ItemSystem.js, GameScene.js, HUD.js, ChestSystem.js, LadderSystem.js, PreloadScene.js, Level1.js, HollowKnight.js, HollowKingBoss.js, Mimic.js, EnemyEntity.js, index.html

## Current state
- Everything through Phase 6 + all cross-phase items complete
- Playtested and fixed major issues
- All code uses colored-rectangle placeholders (no real art/audio yet)

## What's next
- Phase 7: UI & Screens
  - Pause/inventory screen (show equipped gear, accessory, stats)
  - Interlude scenes between levels
  - High score initials entry
- Phase 8: Real art/audio assets

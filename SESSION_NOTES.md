# ADVERSARY — Session Notes

## What we worked on
- DK-style skull ladder descent, wild skulls, bat sine wave, loop scaling, cleanup bug fix

## What got done

1. **Skull ladder descent (DK-style)** — Skulls can now descend ladders using a probability algorithm inspired by the original Donkey Kong arcade game:
   - Height check: skulls won't take a ladder if they're already at/below the player
   - Loop-gated random chance: 15% on loop 1, increasing ~12% per loop (cap 65%)
   - "Steering" mechanic: if the player is moving toward the skull, it's 35% more likely to take the ladder (mimics DK's joystick-steering)
   - Fallback 15% random chance (like DK's final 25% coin flip)
   - Skulls descend at 50 px/s, snap to ladder centre, then resume rolling at the bottom

2. **Wild skulls (loop 2+)** — A percentage of spawned skulls are now "wild" (reddish tint), bouncing diagonally across the screen instead of rolling. They loosely track the player's horizontal position on each bounce. Chance starts at 12% on loop 2, increasing ~8% per loop (cap 45%).

3. **Skull loop scaling** — Speed increases ~10%/loop, spawn interval decreases 300ms/loop (min 2s).

4. **Bat sine wave flight** — Bats now bob up and down in a sine wave as they fly, making them harder to dodge and hit. Base amplitude 6px, increasing 2px/loop (cap 14px).

5. **Bat timer tightened** — Base interval reduced from 6s to 4.5s. Decreases 500ms/loop (min 2.5s). Speed increases 8 px/s per loop.

6. **Cleanup bug fix** — Added `_stopped` flag to both HazardSystem and FlyingHazardSystem. After `destroyAll()` is called (checkpoint/boss defeat), no new skulls or bats can spawn during the transition delay.

### Files Modified
- src/systems/HazardSystem.js (ladder descent, wild skulls, loop scaling, cleanup fix)
- src/systems/FlyingHazardSystem.js (sine wave, loop scaling, cleanup fix)
- src/levels/Level2.js (bat interval 6000 → 4500)

## Current state
- Levels 1-3 playable, Level 4 boss fight unchanged
- Skulls now have DK-style ladder AI and wild bouncing variants
- Bats bob in sine waves and spawn more frequently
- All hazards properly stop spawning during level transitions
- Loop scaling active for both systems

## What's next
- Phase 7: UI & Screens (full pause/inventory, interludes, high score initials)
- Playtesting the new skull/bat behaviors for feel and balance
- More polish as needed

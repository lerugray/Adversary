# ADVERSARY — Session Notes

## What we worked on
- DK-style skull ladder descent, wild skulls, bat sine wave, loop scaling, cleanup bug fix
- Skull ladder exit direction fix, Castlevania-style special weapons

## What got done

1. **Skull ladder descent (DK-style)** — Skulls can descend ladders using a probability algorithm inspired by the original Donkey Kong arcade game (height check, loop-scaled random chance, player "steering", fallback random).

2. **Wild skulls (loop 2+)** — Reddish bouncing skulls that track the player's position. Chance scales with loop.

3. **Skull/bat loop scaling** — Speed, spawn rate, ladder aggression, wave amplitude all scale per loop.

4. **Bat sine wave flight** — Bats bob up and down in a sine wave. Amplitude and speed scale with loop.

5. **Bat timer tightened** — Base interval 6s → 4.5s, scales down per loop.

6. **Cleanup bug fix** — `_stopped` flag prevents spawns during scene transitions.

7. **Skull ladder exit fix** — Skulls now pick the direction with more platform space when exiting a ladder, preventing immediate walk-offs.

8. **Castlevania-style special weapons** — All 6 special attack types now have proper behaviour:
   - **Knife**: Fast straight throw (like CV dagger)
   - **Axe**: Arcs upward then falls with gravity, spins visually
   - **Holy water**: Short lob, creates damaging ground fire on impact (hits enemies in area for ~900ms)
   - **Cross**: Boomerang — flies forward, decelerates, returns to player
   - **Skull key**: Slow spiralling projectile that pierces through enemies
   - **Ember flask**: Arcs and explodes on ground impact, AoE burst damage + camera shake

### Files Modified
- src/systems/HazardSystem.js (ladder descent, wild skulls, loop scaling, cleanup fix, exit direction fix)
- src/systems/FlyingHazardSystem.js (sine wave, loop scaling, cleanup fix)
- src/levels/Level2.js (bat interval 6000 → 4500)
- src/entities/PlayerEntity.js (all 6 special weapons rewritten, projectile update loop)
- src/scenes/GameScene.js (piercing projectile support for skull key)

## Current state
- Levels 1-3 playable, Level 4 boss fight unchanged
- Skulls have DK-style ladder AI and wild bouncing variants
- Bats bob in sine waves and spawn more frequently
- All 6 special weapons work with proper Castlevania-style arcs
- Loop scaling active for hazard systems

## What's next
- Phase 7: UI & Screens (full pause/inventory, interludes, high score initials)
- Playtesting skull/bat/weapon behaviors for balance
- More polish as needed

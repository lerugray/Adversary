# ADVERSARY — Session Notes

## What we worked on
- Checkpoint safety (player getting hit after clearing a level)
- Level 3 pendulum speed tuning

## What got done

1. **Checkpoint invincibility** — when the player touches the bonfire/gate, they immediately become invincible and all enemies, traps, darts, flying hazards, and the phantom are destroyed. No more cheap hits during the victory animation.
2. **Pendulum speed reduction** — all 4 Level 3 pendulums slowed ~25% to give a clearer window to maneuver through:
   - Tier 2 pair: 1.8/1.6 → 1.3/1.2
   - Tier 4: 2.0 → 1.5
   - Tier 6: 2.4 → 1.8

### Files Modified
- src/scenes/GameScene.js (checkpoint clears enemies + invincibility)
- src/levels/Level3.js (pendulum speeds reduced)

## Current state
- Levels 1-3 playable, Level 4 boss fight unchanged
- Checkpoint transition is now safe on all levels
- Level 3 pendulums slower — needs playtesting to confirm feel
- Breakable containers and flying bats still need testing

## What's next
- Playtest Level 3 pendulums at new speeds
- Playtest breakable containers across all levels
- Phase 7: UI & Screens (pause/inventory, interludes, high score initials)
- More polish as needed from playtesting

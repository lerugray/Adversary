# ADVERSARY — Session Notes

## What we worked on
- Level 2 single-screen redesign (DK 75m elevator stage)

## What got done

1. **ElevatorSystem created** (`src/systems/ElevatorSystem.js`):
   - Velocity-based movement (not manual position) so Phaser Arcade collision actually works
   - One-way platforms (collide top only) — player can jump up through them
   - Downward elevator ride detection (manually nudges player since Arcade won't pull down)
   - Shaft blockers: static platforms placed inside elevator shafts that force the player off
   - Wrapping: platforms teleport from top→bottom or bottom→top when they leave the shaft

2. **Level 2 redesigned as DK 75m elevator stage**:
   - Two elevator shafts: left (x=80, UP), right (x=176, DOWN)
   - Mostly open pit — falling below y=222 = instant death (bypasses invincibility)
   - Small scattered platforms on left/right sides at different heights
   - Center stepping stone (y=120) for risky cross-shaft jumps
   - **Shaft blockers force zigzag traversal** — can't ride one elevator to the top:
     - Left shaft blocked at y=132 and y=55
     - Right shaft blocked at y=165 and y=90
   - Required path: left elev UP → jump to left-mid → cross to center/right → right side up → cross to left-upper → left elev to summit
   - NO LADDERS — elevators only
   - Bats every 3.5s as primary hazard while riding

3. **Death pit mechanic** (singlescreen override):
   - Levels with `deathPitY` disable bottom world bounds + player collideWorldBounds
   - Update check: if player.y > deathPitY, bypass invincibility and deal 999 damage
   - Dark visual strip at bottom as danger cue

### Key files changed
- `src/systems/ElevatorSystem.js` — rewritten: velocity-based movement + shaft blockers
- `src/scenes/GameScene.js` — elevator system hooks (create, update, cleanup)
- `singlescreen.html` — L2 data + death pit override

## Current state
- L2 single-screen is an elevator platforming challenge with death pits and forced traversal
- Other levels unchanged

## What's next
- Playtest L2: elevator feel, shaft blocker placement, difficulty
- May need tuning: elevator speed, blocker positions, platform sizes
- L3 pendulums need playtesting
- Plunge attack needs playtesting (Zelda 2 feel check)
- Phase 7: UI & Screens (pause/inventory, interludes, high score initials)

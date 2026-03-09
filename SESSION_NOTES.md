# ADVERSARY — Session Notes

## What we worked on
- Single-screen level design experiment (DK-style, no scrolling)

## What got done

1. **Single-screen variant (v2)** — Created `singlescreen.html`, a standalone experiment that overrides all 4 level layouts to fit 256x240 with no camera scrolling. Main game (`index.html`) is untouched.

   - **All levels**: 4 tiers (ground + 3 platforms), 56px gaps — close to the original 60px
   - **Level 1**: Soldier tier → Archer tier → Knight summit. Rolling skulls cascade from top.
   - **Level 2**: Broken Bridge (islands) → Archer's Alley (crossfire) → Knight's Watch (summit). Bats fly across.
   - **Level 3**: Pendulum Bridge → Dart Crossfire + Knight → Summit (pendulum + darts). Each tier has one clear hazard combo.
   - **Level 4**: Unchanged — was already nearly single-screen. Floor kept at y=210 for hardcoded boss spawn.
   - **HUD clearance**: Summit platforms at y=42, well below the 18px HUD bar. Game board starts cleanly under HUD like original DK.
   - **Enemy spacing**: Ground enemies placed far from player spawn point.
   - **Phantom override**: Reworked to simple fair timer — tracks any movement (not just vertical), 45s base timer, dismisses after sustained movement.

### Key files
- singlescreen.html (standalone experiment, all changes self-contained)

## Current state
- Main game fully intact and unchanged
- Single-screen experiment on v2 (spacious layout, HUD-cleared, fair phantom)
- Needs continued playtesting

## Discussion topics still open
- Enemy freezing behavior (need specifics: which enemies, which levels)
- Double-jump accessory ("Cat Ring")
- DK "waddle" feel (waiting for Phase 8 sprites, or prototype Y-bob now?)
- Checkpoints in levels 2-3 for main game (remove on loop 2+?)
- Single-screen: does 3 tiers per level feel right, or should some levels have 4?

## What's next
- Continue playtesting single-screen variant
- Decide: replace main layouts, keep as variant, or find middle ground
- Phase 7: UI & Screens (pause/inventory polish, interludes, high score initials)
- General polish and balance from playtesting

# ADVERSARY — Session Notes

## What we worked on
- Level-up resume timing fix
- Soul recovery balance discussion
- In-browser instruction manual

## What got done

1. **Level-up resume delay** — After confirming a level-up choice, the game now freezes for 800ms before resuming so the player can get their bearings. Also grants 1.5s of i-frames on resume to prevent cheap shots from nearby enemies.

2. **Soul recovery balance decision** — Decided no heal on soul recovery is correct. The soul's reward is XP restoration only. Hearts from enemies provide organic healing on the way back.

3. **Instruction manual panel** — NES-style instruction booklet built into index.html, viewable by clicking a "MANUAL" tab on the left side of the game screen. Covers story, controls, gameplay, special attacks, bestiary, traps, items, worlds, debug controls. Marked as work in progress.

4. **Manual sizing fixes** — Enlarged the manual panel (420px wide, 640px tall), bumped all font sizes, repositioned tab to sit right against game canvas.

5. **Game canvas sizing fix** — Adding the parent div caused the game to start small and grow. Fixed by giving game-container a fixed 768x720 size (3x NES resolution) and setting expandParent: false in Phaser config.

### Key files modified
- index.html (manual panel HTML/CSS, game-wrapper layout, fixed container size)
- src/main.js (parent: 'game-container', expandParent: false)
- src/systems/LevelUpSystem.js (resume delay + i-frames)

## Current state
- Levels 1-3 playable, Level 3 checkpoint reachable
- Level 4 boss fight retuned for fair-but-hard design
- XP/soul system working correctly, no heal on recovery (intentional)
- All special weapons have proportional trajectories
- Mimics activate on loop 2+
- Manual panel accessible from game screen

## What's next
- Playtest to verify game canvas sizing is correct after fix
- Boss fight playtesting with new tuning
- Phase 7: UI & Screens (pause/inventory, interludes, high score initials)
- General polish and balance from playtesting

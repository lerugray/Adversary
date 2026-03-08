# ADVERSARY — Session Notes

## What we worked on
- Level-up resume timing fix
- Soul recovery balance discussion
- In-browser instruction manual

## What got done

1. **Level-up resume delay** — After confirming a level-up choice, the game now freezes for 800ms before resuming so the player can get their bearings. Also grants 1.5s of i-frames on resume to prevent cheap shots from nearby enemies.

2. **Soul recovery balance decision** — Decided no heal on soul recovery is correct. The soul's reward is XP restoration only. Hearts from enemies provide organic healing on the way back.

3. **Instruction manual panel** — NES-style instruction booklet built into index.html, viewable by clicking a "MANUAL" tab on the left side of the game screen. Covers:
   - Story (dark Souls-influenced lore without being literal)
   - Keyboard + gamepad controls
   - How to play (attacking, climbing, dodge roll, jumping hazards)
   - Death & soul mechanic
   - All 6 special attacks with mana costs
   - Full bestiary (all enemy types + boss)
   - The Phantom warning
   - Traps & hazards (rolling skulls, pendulum blades, dart traps, breakables)
   - Items & equipment (pickups, weapons, armor, level-up choices)
   - The four worlds with correct names
   - Debug controls (G, L, gamepad L1)
   - "Work in progress" banner
   - Game canvas now renders inside a parent div (game-container) for layout

### Key files modified
- index.html (manual panel HTML/CSS, game-wrapper layout)
- src/main.js (added parent: 'game-container' to Phaser config)
- src/systems/LevelUpSystem.js (resume delay + i-frames)

## Current state
- Levels 1-3 playable, Level 3 checkpoint reachable
- Level 4 boss fight retuned for fair-but-hard design
- XP/soul system working correctly, no heal on recovery (intentional)
- All special weapons have proportional trajectories
- Mimics activate on loop 2+
- Manual panel accessible from game screen

## What's next
- Playtest to verify manual panel doesn't break game scaling/input
- Boss fight playtesting with new tuning
- Phase 7: UI & Screens (pause/inventory, interludes, high score initials)
- General polish and balance from playtesting

# ADVERSARY — Session Notes

## What we worked on
- Level-up resume timing fix
- Soul recovery balance discussion

## What got done

1. **Level-up resume delay** — After confirming a level-up choice, the game now freezes for 800ms before resuming so the player can get their bearings. Also grants 1.5s of i-frames on resume to prevent cheap shots from nearby enemies. Previously the game unpaused instantly.

2. **Soul recovery balance decision** — Discussed whether soul recovery should heal the player (full, half, or none). Decided **no heal** is correct: the soul's reward is XP restoration, and hearts from enemies provide organic healing on the way back. Keeps tension high and matches Dark Souls feel.

### Key files modified
- src/systems/LevelUpSystem.js (resume delay + i-frames after level-up)

## Current state
- Levels 1-3 playable, Level 3 checkpoint reachable
- Level 4 boss fight retuned for fair-but-hard design
- XP/soul system working correctly, no heal on recovery (intentional)
- All special weapons have proportional trajectories
- Mimics activate on loop 2+

## What's next
- Playtesting Level 4 boss fight with new tuning
- Boss may still need further balance tweaks after testing
- Phase 7: UI & Screens (pause/inventory, interludes, high score initials)
- General polish and balance from playtesting

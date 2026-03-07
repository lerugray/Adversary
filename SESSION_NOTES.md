# ADVERSARY — Session Notes

## What we worked on
- Phase 6: Chests & Mimics implementation

## What got done
- **ChestSystem.js** — Manages chest spawning after enemy kills (only active after Loop 1 / currentLoop >= 2). Features:
  - 15% base spawn chance per enemy kill, +10% bonus for multi-kills within 2 seconds
  - Normal chests give generous drops (30% weapon, 30% armor, 50% heart)
  - Chests flash and expire after 15 seconds, blink in last 3 seconds
  - Gold flash + 50 score bonus when opened
  - Mimic chance starts at 25% on loop 2, increases 8% per loop, capped at 65%
- **Mimic.js** — Disguised enemy extending EnemyEntity. Features:
  - Starts looking identical to a chest (same color/size), but has a subtle "breathing" scale pulse as a tell
  - If player attacks first: takes damage normally, wakes up as enemy
  - If player touches first: deals 3 heavy ambush damage, then transforms
  - Transformation: camera shake, red flash, grows larger, becomes fast aggressive chaser (70px/s)
  - 4 HP, aggressive melee AI when active
  - Guaranteed rare+ drops (45% weapon, 45% armor, always a heart)
- **GameScene.js** — Wired in ChestSystem creation, update loop, and enemy-kill notification
- **index.html** — Added script tags for Mimic.js and ChestSystem.js

## Current state
- Everything through Phase 6 is complete
- All code uses colored-rectangle placeholders (no real art/audio yet)
- DESIGN.txt is available as a readable text version of the master design doc

## What's next (do these first, before Phase 7)
1. Level-up system (pick one per level: max HP +1, attack power, max mana +3, speed boost)
2. Armor damage negation chance mechanic
3. Accessory system (rings with passive effects: speed, range, mana regen, drop rates, plunge crits, extended i-frames)
4. Special attack pickup cycling (swap current special on collect)

## Then after cross-phase items
- Phase 7: UI & Screens (pause/inventory, interludes, high score initials)
- Phase 8: Real art/audio assets

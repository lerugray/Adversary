# ADVERSARY — Session Notes

## What we worked on
- Bug fixes, polish, and Level 1 redesign with rolling hazards

## What got done

### Bug Fixes
1. **Enemy body-null crash** — added null guard in EnemyEntity.update() so dead enemies with destroyed sprites don't freeze the game
2. **Level-up freezes enemies** — LevelUpSystem now pauses/resumes physics.world so nothing moves during the menu
3. **Plunge attack too fast** — reduced from 240 to 160 px/s

### Polish
4. **HUD text readability** — bumped font sizes, added black stroke + drop shadow to all HUD text, boss label, and soul arrow
5. **Dark Souls-style level name overlay** — fade-in/hold/fade-out with decorative lines when entering any level
6. **Original level names** — The Ashen Hearth, Cresthollow, The Iron Passage, The Pale Spire (added `name` property to all level data)
7. **Phantom timer relaxed** — base 20s→35s, minimum 8s→15s (less brutal with rolling hazards in play)

### Level 1 Redesign (DK-style)
8. **New platform layout** — 6 wide platforms (224px) with alternating 32px gaps, zigzag ladder pattern (right/left/right/left/right)
9. **More vertical space** — 50-55px between tiers (was ~45px), world height now 350
10. **Rolling skull hazards** (HazardSystem.js) — stone head at top-left of tier 5 spawns skulls every 3.5s that roll right, fall off edges, reverse direction on landing, cascading all the way down
11. **Manual position tracking** — skulls don't use Arcade physics (which breaks off-camera), instead manually simulate gravity and check platform data directly
12. **Sweep-based landing** — checks if skull passed through any platform between frames to prevent fast-fall overshooting
13. **Jump-over bonus** — +100 score with floating gold popup when player jumps over a rolling skull (DK style)

### Files Changed/Created
- **New:** src/systems/HazardSystem.js
- **Rewritten:** src/levels/Level1.js (DK-style layout)
- **Modified:** EnemyEntity.js, PlayerEntity.js, GameScene.js, HUD.js, LevelUpSystem.js, PhantomSystem.js, Level2-4.js (names), index.html

## Current state
- Everything through Phase 6 + cross-phase items + Level 1 redesign complete
- Skull hazards spawning and cascading — may still need tuning (speed, interval, etc.)
- User wants more polish before Phase 7

## What's next
- User has additional polish ideas to test
- May need skull tuning after playtesting
- Phase 7: UI & Screens (pause/inventory, interludes, high score initials)

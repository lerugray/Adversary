# Adversary — Aesthetic & Level-Design Skill

> For level-design and graphical-refit sessions inside the
> `Adversary/` repo. Route all new level work through this
> document. If a proposed asset, palette, or mechanic
> contradicts anything below, stop and flag it before
> implementing.

**What Adversary is:** a single-screen platformer in the
lineage of *Donkey Kong* (1981), with the death-loop mechanics
of *Dark Souls* and the gothic atmosphere of *Castlevania 1*.
Four hand-built levels. Phaser 3 in the browser, Electron for
Steam.

**What Adversary is not:** a Metroidvania, a scrolling
platformer, a retro-*styled* game with modern effects, or a
16-bit-era piece. It is a **lost 1984–1986 NES cartridge**.
Every decision is filtered through that constraint.

---

## §1 — Core constraints (non-negotiable)

| Constraint | Value | Why |
|---|---|---|
| Internal resolution | **256 × 240** | Authentic NES framebuffer |
| Scaling | Integer, nearest-neighbor only | No sub-pixel smoothing |
| Colors per sprite | **2–3 solid** + transparent | NES PPU reality |
| Palette gamut | **NES 64-color only** | No off-gamut hex |
| Animation | **2–4 frames** per action | No tweens, no eased interpolation |
| Character sprite | **16×16** or **24×24** | Chunky, DK/Spelunker era |
| Rendering | Hard pixel edges | No AA, no dither, no alpha blend |
| Screen scope | **Single screen, no scroll** | DK lineage, not SMB |

**Grep-for-violations patterns** (Claude Code should catch these):
- `alpha:` `0.` — partial alpha anywhere on sprites
- `ease`, `tween`, `lerp` — any eased motion on gameplay objects
- `rgba(` with non-0/1 alpha — same problem
- `blur`, `gradient`, `shadow-blur` — disallowed effects
- Any hex code not in §3 palette table
- `scrollX`, `cameras.main.scroll` — no scrolling cameras
- Sprite dimensions outside `{8, 16, 24, 32}` multiples

---

## §2 — Tonal anchor

Three references in tension. Hold all three at once.

### 2.1 Donkey Kong (1981 / NES 1983)
Single-screen structural vocabulary: fixed camera, vertical
stacking of platforms, clear start-point and goal-point
readable in under 3 seconds. Ladders and girders, not
sidescrolling traversal. Platforms have **purpose** —
every platform is either a traversal path, a hazard-dodge
window, or a checkpoint. No decorative platforms.

### 2.2 Castlevania 1 (1986)
Atmosphere and negative space. Stonework, chained sconces,
moonlight arches, gargoyle silhouettes in the far background.
**Level backdrops do the emotional work; enemies are
punctuation, not wallpaper.** Reference the *Stone Corridor*,
*Clock Tower*, and *Haunted Maze* rooms specifically — not
later-game biomes. Symphony of the Night is out of scope.

### 2.3 Dark Souls 1 (2011) — thematic only
Four sacred-ruin spaces mapped to four levels. The Dark Souls
reference is **thematic, not visual** — we are not reproducing
FromSoftware art. We are asking: *what would Firelink look
like if it had to fit in 2KB of CHR-ROM in 1985?* The answer
is the level.

---

## §3 — NES palette (locked)

All color values are NES-index (`$XX`) first, hex second. Hex
is an approximation for web rendering; the NES index is the
source of truth.

### 3.1 Master palette (selected swatches)

| Index | Hex | Role |
|---|---|---|
| `$0F` | `#000000` | True black — background, silhouettes |
| `$00` | `#747474` | Mid grey — stonework mid-tone |
| `$10` | `#bcbcbc` | Light grey — stonework highlight |
| `$30` | `#fcfcfc` | Off-white — moonlight, glints, UI |
| `$06` | `#a40000` | Blood crimson — rare, hazard/boss only |
| `$16` | `#d82800` | Fire orange — bonfire core |
| `$17` | `#b84000` | Ember — bonfire mid |
| `$27` | `#fca044` | Amber — Ashen Hearth dominant |
| `$37` | `#fccc9c` | Pale amber — Ashen Hearth highlight |
| `$08` | `#503000` | Brown-black — dead grass, wood |
| `$18` | `#884000` | Rust — Iron Passage dominant |
| `$28` | `#cc6800` | Rust-highlight |
| `$01` | `#241488` | Deep indigo — night sky |
| `$11` | `#0058f8` | Cold blue — Cresthollow fog |
| `$21` | `#3cbcfc` | Ice blue — Pale Spire window light |
| `$31` | `#a4e4fc` | Pale ice — stained-glass highlight |
| `$0C` | `#007800` | Dead green — rare, lichen only |
| `$2C` | `#00e8d8` | Cyan — reserved, unused in levels 1–4 |

### 3.2 Per-level sub-palettes (4 colors each, NES sprite rule)

NES sprites run on 4-color sub-palettes where index 0 is
transparent. Each level gets **one dominant backdrop palette**
and **one character/hazard palette**.

#### Level 1 — The Ashen Hearth
- Backdrop: `$0F` · `$08` · `$17` · `$27`
- Foreground: `$0F` · `$27` · `$37` · `$30`
- Checkpoint (bonfire): `$0F` · `$16` · `$27` · `$30`

#### Level 2 — Cresthollow
- Backdrop: `$0F` · `$00` · `$10` · `$01`
- Fog layer: `$0F` · `$01` · `$11` · `$10`
- Foreground: `$0F` · `$10` · `$30` · `$11`
- Checkpoint (portcullis): `$0F` · `$08` · `$18` · `$30`

#### Level 3 — The Iron Passage
- Backdrop: `$0F` · `$00` · `$08` · `$18`
- Mechanical: `$0F` · `$08` · `$18` · `$28`
- Hazards: `$0F` · `$18` · `$06` · `$30`

#### Level 4 — The Pale Spire
- Backdrop: `$0F` · `$00` · `$10` · `$01`
- Stained glass: `$0F` · `$01` · `$21` · `$31`
- Boss palette: `$0F` · `$10` · `$06` · `$30`

**Rule:** No level mixes indices from two other levels'
dominant sub-palettes. A single tile may recur across levels
with a different palette attachment — that is the intentional
NES pattern-table swap and a core visual tool.

---

## §4 — Sprite & proportion rules

### 4.1 Player character (small, 16×16)
Proportions: **head 6px tall, torso 5px, legs 5px.** Big head,
stubby legs, clearly readable silhouette. Reference
*Spelunker* (1985) and *Donkey Kong* NES Mario. **Not**
*Super Mario Bros* Mario (too tall).

```
   ▓▓▓▓▓▓       <- helmet/head (6px)
   ▓░░░░▓
   ▓██░█▓
   ▓░░░░▓
   ▓▓░░▓▓
   ░▓▓▓▓░
   ░██░██░       <- torso/arms (5px)
   ░██░██░
   ░█████░
   ░█░░░█░       <- legs (5px)
   ░█░░░█░
```

Four animation frames max per action: idle (1), run (2), jump
(1), hit (1), death (2). That's it.

### 4.2 Enemy silhouettes
- **Archer (Cresthollow):** pure `$0F` silhouette, single
  `$30` glint pixel where the eye is. Draw bow only during
  telegraph frame (1 frame of windup, 1 frame of release).
- **Gargoyle (Pale Spire backdrop):** decorative only, not a
  hazard. Pure `$0F` against `$01`.
- **Hollow King (boss, Level 4):** 24×24, three colors —
  `$0F` body, `$10` armor plating, `$06` crown/eyes. Sits on
  throne until engaged.

### 4.3 Hazards
Hazards are **silhouette-first**. No texture, no noise, no
gradients. One highlight pixel maximum.

- **Pendulum blade (Iron Passage):** `$0F` body, single `$30`
  pixel on the leading edge. Readable at a glance.
- **Barrel (Ashen Hearth, DK homage):** 8×8, `$17` with `$0F`
  banding.
- **Crushing gear (Iron Passage):** `$08` body, `$28` teeth
  silhouette. 4 rotation frames.
- **Falling rubble (Cresthollow):** `$00`/`$10` chunk, no
  rotation — linear fall only.

### 4.4 Checkpoints (critical — always brightest on screen)
Each level's checkpoint is the **single brightest, most
saturated element on screen**. This is a hard rule. If a
level mockup has anything brighter than its checkpoint, the
mockup is wrong.

- **L1 Bonfire:** 16×16, animates on 3-frame loop. Core is
  `$30`, outer flame `$16`/`$17`, base `$08`.
- **L2 Portcullis (when lit):** iron frame `$08`/`$18`, lit
  torches flanking it in `$30`/`$16`.
- **L3 Iron fog gate:** solid `$30` rectangle fill against
  `$0F` — abstract, almost UI-like.
- **L4 Altar:** `$31` stained-glass shaft from above,
  `$30`/`$21` pooling on the ground.

---

## §5 — Platform language (consistent across all levels)

One-way vs solid vs moving must be **readable without
touching**. Every level uses the same platform grammar — only
the palette changes.

| Platform type | Visual | Collision |
|---|---|---|
| **Solid ground** | Filled tile, level-dominant color | Full collision |
| **One-way (ledge)** | 1-tile-thick, 1px `$0F` drop-shadow beneath | Top-only collision |
| **Elevator** | Level-dominant color + 1px `$30` outline | Full collision, moving |
| **Crumbling** | Dominant color + `$0F` cracks pattern | Full, breaks after 30 frames |
| **Hazard floor** | Dominant + `$06` highlight (L3 only) | Full + damage |

**Ladders** (DK lineage): 2px wide rails, 1px rungs every
3px. Always `$30` against a darker backdrop. Never
decorative — a ladder onscreen is always climbable.

---

## §6 — Level templates (256 × 240 grid)

Each level fits a single 256×240 screen. Coordinates are
**(x, y)** from top-left in pixels. The player starts at the
bottom, the checkpoint is at the top. Vertical traversal is
the core verb.

### 6.1 Level 1 — The Ashen Hearth (Firelink-referenced)

**Dominant palette:** Amber over black (`$27`/`$37`/`$08`/`$0F`)
**Mood:** Melancholy dawn after defeat. Warm, quiet, ruined.
**Challenge thesis:** *Teach the verbs.* Jump, climb, dodge
one hazard type. Nothing more.

```
(0,0)                              (256,0)
┌──────────────────────────────────┐
│  ☼  BONFIRE (128, 32)            │  ← checkpoint, top-center
│ ═══════════════                  │  ← shrine platform y=48
│                    ║             │  ← ladder at x=200
│        ────────────┤             │  ← ledge y=96
│  ║                                │  ← ladder at x=48
│  ├─────                           │  ← ledge y=128
│                                  │
│       ○ barrel spawn (x≈140)     │
│  ─────────────  ─────────        │  ← ground y=176, gap
│  ║                                │  ← ladder at x=48
│  ├──────                          │  ← ledge y=208
│  ▲  PLAYER START (24, 224)       │
└──────────────────────────────────┘
```

**Elements:**
- 4 platform tiers. Vertical spacing tuned for a single jump
  (48px arc peak).
- 2 ladders, staggered left/right.
- 1 hazard: rolling barrels from the shrine (DK homage), 1
  barrel every 2 seconds.
- 1 gap at y=176 requiring a running jump.
- Background: broken arches (decorative), dead grass tufts,
  scattered stone-sword markers.

**Why this works (already validated):** it is a faithful DK
layout with an Adversary skin. Do not experiment with L1.

### 6.2 Level 2 — Cresthollow (Undead Burg)

**Dominant palette:** Cold grey/indigo (`$00`/`$10`/`$01`/`$11`)
**Mood:** Abandoned city. Fog layer bisects the screen at
y=120.
**Challenge thesis:** *Introduce ranged threat.* Archers on
high ledges force the player to time approaches.

```
(0,0)                              (256,0)
┌──────────────────────────────────┐
│  ▮ ═══ PORTCULLIS (200,16) ◀     │  ← checkpoint top-right
│  ≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈        │  ← tenement roof y=40
│  ▲ archer (48, 56)                │
│ ════     ════════════════         │  ← ledge y=72
│                                  │
│. . . FOG LAYER y=112–128 . . . . │  ← partial occlusion band
│                                  │
│          ════════                 │  ← ledge y=152
│                    ▲ archer       │     (x=216, 160)
│  ════════     ══════              │  ← ledge y=184
│                                  │
│  ║                   ║            │  ← two ladders
│  ▲  PLAYER START (24, 224)       │
└──────────────────────────────────┘
```

**Elements:**
- 4 platform tiers, slight asymmetry (urban decay).
- Fog band at y=112–128 rendered as a `$11`-tinted 8px-tall
  strip with 50%-probability `$0F` specks. Does NOT occlude
  collision — only readability. Player must commit through.
- 2 archers on upper ledges. Each has a 30-frame telegraph
  (windup) and a single `$30` arrow projectile.
- Archers cannot be killed in L2 — must be avoided.
- Checkpoint (portcullis) is top-right, breaking the
  symmetry of L1 intentionally.

**Design warning:** Do not add a third archer. Two is the
tension ceiling for a single screen; three becomes chaos.

### 6.3 Level 3 — The Iron Passage (Sen's Fortress)

**Dominant palette:** Rust over gunmetal (`$18`/`$28`/`$08`/`$00`)
**Mood:** Industrial hostility. Everything clicks and grinds.
**Challenge thesis:** *Timing.* The level itself is the
enemy — no archers, no barrels. Moving parts on fixed timers.

```
(0,0)                              (256,0)
┌──────────────────────────────────┐
│       ▣ IRON GATE (128, 24)      │  ← checkpoint top-center
│  ══════════  ══════════           │  ← ledge y=48
│         ↕                         │  ← pendulum (128, 56–96)
│  ══════      ══════════           │  ← ledge y=104
│                                  │
│    ◉◉ gear (x=80, y=128, rotates)│
│  ══════        ══════             │  ← ledge y=144
│         ↕                         │  ← pendulum (176, 152–192)
│  ║                  [▬▬]          │  ← elevator x=200, y=176–208
│  ══════   ══════                  │  ← ledge y=200
│  ▲  PLAYER START (24, 224)       │
└──────────────────────────────────┘
```

**Elements:**
- 2 pendulums on offset timers (2s, 3s periods). Swing arc
  40px. Leading-edge `$30` highlight pixel.
- 1 gear rotating at 4fps, 16×16, contact = death.
- 1 vertical elevator (`[▬▬]`) on 4-second cycle, travels
  y=176 to y=104.
- No enemies. The level is the enemy.
- All timings expressed in **frames at 60fps** in Phaser
  scene code. Never use real-time seconds.

**Design warning:** Resist adding more hazards. Three timed
threats is the ceiling. If the screen feels empty, that is
correct — oppressive quiet is the Castlevania inheritance.

### 6.4 Level 4 — The Pale Spire (Anor Londo)

**Dominant palette:** Cold grey on indigo, with ice-blue
accents (`$00`/`$10`/`$01`/`$21`)
**Mood:** Cathedral silence until the boss wakes. Quietest
level until it isn't.
**Challenge thesis:** *Stillness, then storm.* Platforming
portion is trivial. The fight is the level.

```
(0,0)                              (256,0)
┌──────────────────────────────────┐
│                                  │
│   │▓▓│    STAINED GLASS (112,16) │  ← decorative, non-collide
│   │▓▓│         │▓▓│               │
│  ═══════════════════════          │  ← balcony y=72
│                                  │
│           ▓ HOLLOW KING (120,128)│  ← boss, enthroned
│  ═══════════════════════          │  ← arena floor y=160
│                                  │
│   ▒ altar glow (128, 180)         │  ← checkpoint (post-boss)
│  ══════════════════════════       │  ← ground y=208
│  ▲  PLAYER START (24, 224)       │
└──────────────────────────────────┘
```

**Elements:**
- Two platform tiers only. Traversal is trivial — this is
  intentional.
- 2–3 columns rendered as `$00` silhouettes against `$01`
  backdrop, non-collidable, purely decorative depth.
- Stained-glass windows: 2-color silhouettes (`$21`/`$31`),
  no detail. A cross shape, an arch, nothing more.
- The boss: Hollow King. 24×24, 3 attack patterns, 6 hits to
  defeat. Boss design is out of scope for this document —
  see `BOSS.md`.
- Checkpoint (altar) activates only after boss defeat.

**Design warning:** Do not add mid-fight platforms or
environmental hazards. The arena is flat. The challenge is
the boss, nothing else.

---

## §7 — Challenge design principles

The most important section for level-authoring. Read before
every level-design session.

### 7.1 One idea per level
Each level teaches or tests **one** mechanical idea.
- L1: jumping and climbing against a rhythmic hazard
- L2: committing through impaired visibility past ranged
  enemies
- L3: reading and obeying level timers
- L4: boss pattern recognition

If a proposed mechanic doesn't fit the level's one idea,
**it belongs in a different level or it belongs cut**.

### 7.2 Every platform justifies itself
For every platform placed, answer in the scene-class comment:
```
// Platform at (x, y): [traversal | hazard-dodge | rest | bait]
```
If none of those four apply, delete the platform.

### 7.3 The 3-second readability test
A player glancing at the screen for 3 seconds must identify:
1. Where they start
2. Where they need to go
3. What will hurt them
4. The path between 1 and 2

If a mockup fails this test, the composition is wrong — not
the palette, not the sprites, the **composition**.

### 7.4 Checkpoints are promises
The checkpoint at the top of the screen is the brightest
thing on screen and represents *safety earned through
effort*. Do not place checkpoints mid-level. Do not place
decorative elements as bright as the checkpoint. The player's
eye should be drawn up and forward, always.

### 7.5 Single-screen discipline
If a level idea requires scrolling, screen transitions, or
off-screen state, it is a different game. Cut it, or reshape
the idea to fit 256×240.

### 7.6 Frame-count all timings
Phaser scene code expresses timers as **frame counts at 60fps**:
```js
// Pendulum period: 2 seconds = 120 frames
this.pendulumPeriod = 120;
```
Not `2000` milliseconds, not `2.0` seconds. This keeps
gameplay feel locked to a pre-emulator-era cadence.

### 7.7 Enemies are punctuation
A screen with four enemies is noisy. A screen with one enemy
in the right place is a sentence. Target **0–2 enemies per
level**. Hazards are not enemies — those are level features.

---

## §8 — Do / Avoid (grep-ready)

Each row includes a pattern Claude Code can search for.

| Do | Avoid | Grep pattern for violations |
|---|---|---|
| Hard pixel edges | Anti-aliasing | `antialias: true`, `smooth`, `imageSmoothing` |
| 2–3 colors per sprite | Gradients | `linearGradient`, `gradient`, `fillGradient` |
| Nearest-neighbor scaling | Bilinear | `FILTER_LINEAR`, `smoothPixelArt: true` |
| NES palette hex only | Off-gamut color | any hex not in §3.1 |
| 2–4 animation frames | Tweened motion | `tween`, `ease`, `lerp`, `Phaser.Tweens` on gameplay |
| Single screen | Scrolling camera | `startFollow`, `scrollX`, `setBounds` larger than 256×240 |
| Solid alpha | Partial transparency | `setAlpha(0.` followed by digit |
| Integer positions | Sub-pixel | `Math.round` absent near `setPosition` |
| Frame-count timers | Real-time timers | `setTimeout`, `Phaser.Time.Delay` with ms |
| Silhouette hazards | Textured hazards | hazard sprite PNGs with >3 unique colors |

### 8.1 Anachronism catalog (what NOT to ship)

- **Parallax scrolling backgrounds.** NES had this via MMC
  chips but it reads as post-1988. Avoid.
- **Rotation or scaling of sprites at runtime.** No NES game
  of 1984–1986 did this. Flipping is fine.
- **More than 8 sprites per scanline.** Easy to violate with
  many enemies; design around it.
- **Drop shadows with alpha.** Use `$0F` pixel-offset
  shadows or nothing.
- **Rounded corners on anything.** 1px at most.
- **Ambient particle effects.** Smoke, dust, embers — all
  period-inappropriate at this fidelity. One exception: the
  L1 bonfire's 3-frame flicker loop.
- **Music reverb, stereo panning.** 2A03 mono square waves
  plus triangle plus noise. No echo.
- **Variable-width fonts.** Monospace 8×8 only.

### 8.2 Architecture smells

If you see any of these in a Phaser scene class, stop and
reconsider:

```js
this.cameras.main.startFollow(player)       // scrolling
scene.add.image(...).setScale(1.5)          // sub-integer scale
sprite.setTint(0x...)                       // use palette swap, not tint
this.physics.world.setBounds(0, 0, 512, 480) // oversized world
sprite.anims.create({ duration: 1000 })     // ms, not frames
```

---

## §9 — Level-construction workflow

When starting a new level or reworking one:

1. **Name the level's one idea** (§7.1). Write it in the
   scene file's top comment.
2. **Pick the sub-palette** from §3.2. Do not invent one.
3. **Sketch the 256×240 grid** matching the template in §6.
   Pencil on paper is fine; ASCII in the scene comment is
   better.
4. **Place the checkpoint first** (top of screen, brightest).
5. **Place the player start** (bottom, usually x=24).
6. **Draw the critical path** between them. Every platform
   on that path is justified (§7.2).
7. **Add the one hazard/enemy type.** Tune counts to the
   ceiling stated in §6 per level.
8. **Run the 3-second readability test** (§7.3).
9. **Implement in Phaser** with frame-count timers (§7.6).
10. **Grep for §8 violations.** Fix before committing.

---

## §10 — When in doubt

- If a decision conflicts with the brief, the brief wins.
- If Dark Souls reference conflicts with NES fidelity, **NES
  fidelity wins**. Always.
- If a level feels empty, that is probably correct (§2.2,
  §7.7). Add nothing until you've played it.
- If a sprite looks too detailed, it is. Halve the colors.
- If a level's challenge isn't clear in 3 seconds, the
  composition is wrong — do not paper over it with more
  elements.

The target is a cartridge Nintendo rejected in 1985 for being
too sad. Not a modern game in retro clothing. Every decision
serves that fiction.

---

*Last synced with `claude-design-brief.md`. If the brief
changes, update this file before next level-design session.*

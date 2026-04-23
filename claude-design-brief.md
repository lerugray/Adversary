# Adversary — Claude Design Brief

For upload to **claude.ai/design**. Purpose: generate a
`SKILL.md` that anchors the game's visual and level-design
direction, then drop that SKILL into `Adversary/.claude/skills/`
for every subsequent design + level-construction session.

---

## What this is

**Adversary** is a single-screen platformer in the tradition of
*Donkey Kong*, filtered through the death mechanics of *Dark
Souls* and the gothic atmosphere of early *Castlevania*. Built
in Phaser 3 for browser play, targeted for Steam via Electron.
Four levels with explicit Dark Souls thematic references.

The goal is the aesthetic, feel, and sound of a **lost
1984-1986 NES cartridge** — something that could plausibly have
shipped alongside *Donkey Kong 3*, *Ice Climber*, *Wrecking
Crew*, or *Castlevania 1*, but didn't.

This brief focuses on **level-design aesthetic** and **graphical
refit** direction. The SKILL.md output should guide both.

---

## Core aesthetic constraints (never violate)

- **Resolution:** 256×240 (authentic NES framebuffer), scaled up
  cleanly with nearest-neighbor. No sub-pixel rendering.
- **Color depth:** 2-3 solid colors per sprite plus transparency.
  No gradients, no anti-aliasing, no dithering, no alpha blending.
  Hard pixel edges everywhere.
- **Sprite proportions:** Early NES chunky — big heads, stubby
  legs, ~16×16 or 24×24 character sprites. *Donkey Kong* Mario
  is the reference, not *Super Mario Bros*. Wrecking Crew's
  Mario, not SMB3's.
- **Animation:** 2-4 frames per action, clear silhouette-first
  readability. No tweened motion.
- **Palette:** Pull from the 64-color NES palette only. No RGB
  hex codes outside that gamut. Period-authentic contrast —
  deep blacks, saturated primaries, occasional ochre/mustard.

## Castlevania tonal anchor

- **Gothic atmosphere.** Stonework, chained sconces, gargoyle
  silhouettes, moonlight window arches. Level 1 Castlevania, not
  Level 3.
- **Oppressive quiet.** Level backdrops do most of the emotional
  work; enemies are punctuation, not noise.
- **Reference stills:** Castlevania 1 Clock Tower, Haunted Maze,
  Stone Corridor. Look at these, not *Symphony of the Night*.

## Dark Souls thematic remix

Each level carries a Dark Souls referent — the ruin of a sacred
space, the architecture of a specific landmark. Level designs
should echo their referent's visual language without literal
copying.

### Level 1 — "The Ashen Hearth" (Firelink Shrine)
- Warm amber tones. Dusk lighting.
- Ruined bonfire shrine as the vertical destination (top of the
  screen).
- Broken arches, dead grass, scattered swords (stone markers).
- Checkpoint at top: a lit bonfire — single brightest point on
  the screen.
- **Mood:** melancholy dawn after defeat.

### Level 2 — "Cresthollow" (Undead Burg)
- Winding urban ruin. Vertical stacking of platforms suggests
  collapsed multi-story tenements.
- Fog layer at mid-height — partial visibility.
- Archers silhouetted on upper ledges (enemy type, not decor).
- Checkpoint at tower gate: iron-banded portcullis.
- **Mood:** abandoned city waiting to be reclaimed.

### Level 3 — "The Iron Passage" (Sen's Fortress)
- Gears, traps, pendulum blades, iron architecture.
- Mechanical movement is the level's signature — platforms shift
  on timers.
- Rust-orange and gunmetal-grey palette dominant.
- Checkpoint at iron fog gate.
- **Mood:** industrial hostility, timing-puzzle tension.

### Level 4 — "The Pale Spire" (Anor Londo)
- Cathedral interior. Grand hall. Boss arena.
- Columns, stained glass (rendered as 2-color silhouettes), high
  ceilings.
- Boss: the Hollow King, enthroned.
- **Mood:** solemn culmination. The quietest level until the
  boss engages.

---

## Level-design principles (mechanical + visual)

**Single-screen construction.** No scrolling. Entire level
visible at once. This is Donkey Kong lineage, not Super Mario.
Verticality is the primary structural tool.

**Readable in 3 seconds.** A player glancing at the level should
immediately understand: start position, goal position, primary
hazards, traversal path. Visual hierarchy supports this.

**Palette per level.** Each level has a dominant palette. The
same tile can reappear across levels tinted differently — that's
intentional (NES pattern table swap). The SKILL.md should name
the palette for each level.

**Hazards are silhouettes, not textures.** Pendulum blade: pure
black silhouette with 1px white highlight edge. Archer: pure
silhouette with glint-of-eye white pixel. No texture noise on
hazards — they must read instantly.

**Checkpoints are visual anchors.** Each level's checkpoint is
the brightest, most saturated element on screen. Unmistakable.

**Platform language.** Solid platforms = ground color. One-way
(jump-through) platforms = 1-tile-thick with rendered shadow
beneath suggesting they're shelves/ledges. Elevator platforms =
distinct color + 1px outline border. These conventions stay
consistent across all 4 levels.

---

## Graphical refit — oryx integration

The repo has `oryx_8-bit_remaster/` and `oryx_roguelike_2.0/`
already purchased. The SKILL.md should guide which oryx packs
match which level:

- **Ashen Hearth** — 8-bit remaster bonfire/shrine tiles,
  ruined-stone variants
- **Cresthollow** — urban-ruin tileset (walls, arches, rubble),
  archer sprites from roguelike 2.0
- **Iron Passage** — mechanical tiles, gear/pendulum sprites,
  fortress-wall variants
- **Pale Spire** — cathedral tileset, column/arch variants,
  boss sprite candidates

Where oryx coverage is insufficient, identify the gap as a
custom-sprite TODO (following the existing
SPRITE_GENERATION_GUIDE.txt workflow via pixellab.ai).

---

## What the SKILL.md should produce

Per session, when I open Claude Code inside the Adversary
directory, the SKILL should let me:

1. **Reference the aesthetic anchor** without re-reading the
   full DESIGN.txt every time. "This is Ashen Hearth,
   Firelink-referenced, warm amber, ruined shrine, bonfire at
   top" — that line should let me generate consistent level
   content.
2. **Pick the right oryx variant** for any new tile/sprite need
   without guessing.
3. **Flag deviation.** If I draft something that contradicts the
   brief (dithering, anti-aliasing, wrong proportions, anachronistic
   palette), the SKILL should give me the pattern to catch it.
4. **Generate level-design templates** — structural layouts for
   each of the 4 levels that the Claude session can build against
   in src/ as concrete Phaser scene classes.

---

## Reference anchors

Visual: Donkey Kong (1981, 1983 NES), Wrecking Crew (1985),
Ice Climber (1985), Castlevania 1 (1986), Spelunker (1985 NES).

Thematic: Dark Souls 1 (2011) — Firelink Shrine, Undead Burg,
Sen's Fortress, Anor Londo specifically. Not the whole game —
these four spaces.

Not in scope: pixel art from 1990+ (NES mature era), 16-bit
aesthetics, anything with scaling/rotation, anything using
MMC3-era graphics tricks.

---

## Constraints on the SKILL output

- Target 200-400 lines of Markdown.
- Markdown headings structured for scannable-at-session-start
  reading.
- No external image embeds (SKILL.md is text-only by
  convention).
- Include a "Do not" / "Avoid" section listing the specific
  anachronisms to catch.
- Include per-level palette callouts with NES-palette indices or
  equivalents.

Once the zip comes back from claude.ai/design, extract
`SKILL.md` to `Adversary/.claude/skills/adversary-aesthetic.md`.
All subsequent level-design work routes through it.

# Fable direction memo — adversary (2026-06-12, final-night blitz)

Adversary is a Phaser 3 NES-style platformer (256x240, single-screen camera, no bundler,
global-scope JS) carrying a Dark Souls register: four levels (Ashen Hearth, Cresthollow,
Iron Passage, The Pale Spire), Hollow King boss, bonfire checkpoints. The April 25 sprint
landed the Oryx sprite refit and single-screen level rebuild; all four levels are nominally
playable. Dormant since then (May 7 commit is gitignore-only), tree clean. The critical fact:
no full-loop browser playtest has ever run — SESSION_NOTES says so explicitly (line 35) —
so every balance claim about L2/L3/L4 is unverified. Backlog is one deferred task; the GS
picker has nothing to pick. Mode B (cursor-as-coder); Ray does not touch code.

## The calls

1. **LOCK — first action is the full 4-level playtest from `index.html`.** SESSION_NOTES
   names it as the explicit next step; it costs zero code changes; and every downstream
   call (gear, altar, archer tuning, boss balance) is sequenced behind what it reveals.
   Nothing ships ahead of it.
2. **LOCK — undefer adv-003.** Its gate (adv-001, Claude Design pass) is done; the
   deferred status is stale bookkeeping. Re-status to pending in
   `generalstaff-private/state/adversary/tasks.json`.
3. **LOCK — refill the backlog from SESSION_NOTES "Next steps" in the same session.**
   Convert the listed items (playtest, L2 archer pressure, gear decision, altar decision,
   timing refactor) into adv-004+ entries. An empty backlog is how this project went
   silently dormant for six weeks; don't repeat it.
4. **LOCK — sequencing on the L3 crushing gear: playtest first, then build.** Don't
   stand up a new hazard system on speculation. **[RAY] my lean: build it** — the level
   is named Iron Passage and the design brief calls for the gear; without its signature
   hazard L3 is decoration, and features ship on behavior.
5. **[RAY] L4 post-boss altar — my lean: boss balance first, altar second.** The boss
   fight is the loop; the altar is the closure beat. Tune what the playtest exposes,
   then add the altar interaction as the victory-state polish.
6. **LOCK — fold the ms→frame-count trap-timing refactor into the first task that
   touches `TrapSystem` (likely the gear).** Frame-count timing is the right call for
   the NES register, but a behavior-neutral refactor doesn't jump the queue on its own.
7. **[RAY] Oryx vs. custom NES-locked sprites — my lean: Oryx is the art direction, not
   a placeholder.** The refit is done, grounded, and reads well at 256x240. Custom
   sprites only become a question if Adversary graduates to a commercial push; block
   nothing on them.
8. **LOCK — routing stays Mode B.** Bounded single-deliverable JS edits are ideal
   Cursor-auto work; the successor session orchestrates, relays diffs in plain English,
   and never makes Ray run anything.

## Risks to respect

- **"Playable" is not "fair."** All smoke tests were partial; treat L2 archer pressure,
  L3 trap fairness, and the boss fight as unknown until the playtest says otherwise.
- **Global-scope, no-bundler JS has invisible coupling.** Keep Cursor batches to one
  narrow deliverable; a wide refactor here breaks things no test will catch (there are
  no tests — verification is playing the game).
- **Root artifacts are load-bearing.** `adversary.zip` is the preserved Claude Design
  output (adv-001) and `DESIGN.docx`/`DESIGN.txt` are the source brief; a tidy-up pass
  that deletes them loses the design record.

## Fable-era note

The project's identity is a deliberate collision: Dark Souls solemnity expressed entirely
in NES vocabulary. Both halves are pillars. The NES constraints (256x240, single-screen
locked camera, frame-count aspiration, chunky sprites) are design decisions, not tech
debt — never "modernize" them. The Souls half lives in the naming register (Ashen Hearth,
Cresthollow, Iron Passage, The Pale Spire, the Hollow King, bonfires) — new content must
hold that register, and player-facing text stays terse and grave, no em-dashes, no quips.
For CD bundles this is an HTML/JS project: the CSS/JS in the bundle IS the implementation;
no theme-translation cycle applies. Successor: read SESSION_NOTES.md before touching
anything — it is thorough, current, and the closest thing this repo has to a handoff.

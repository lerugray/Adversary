This is ADVERSARY — a Phaser 3 NES-style platformer.
See ADVERSARY Master Design & Development docx for the full game design document.
All game logic is in src/. No bundler — plain JS loaded via index.html script tags.
Physics: Phaser Arcade. Resolution: 256x240 scaled up.
When adding files, always add the script tag to index.html in the correct load order.
Do not use ES modules or import/export — everything is global scope loaded via script tags.

The user is not a programmer — explain technical decisions plainly and avoid jargon.

Always read SESSION_NOTES.md at the start of a new conversation to pick up where we left off.
Always rewrite SESSION_NOTES.md before ending a session with a clear summary of:
- What we were working on
- What got done
- What's next

If context usage reaches ~80%, STOP working immediately, warn the user, and update SESSION_NOTES.md before doing anything else.
This is ADVERSARY — a Phaser 3 NES-style platformer. 
See ADVERSARY Master Design & Development docx for the full game design document.
All game logic is in src/. No bundler — plain JS loaded via index.html script tags.
Physics: Phaser Arcade. Resolution: 256x240 scaled up.
When adding files, always add the script tag to index.html in the correct load order.
Do not use ES modules or import/export — everything is global scope loaded via script tags.
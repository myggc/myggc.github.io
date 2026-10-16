# Game art

- `<game-id>.jpg` — card art. Desktop/Steam: 920×430 (the 460×215 the cards draw, at 2×). Mobile: square or portrait (shown uncropped).
- `<game-id>-hero.jpg` — wide banner for the game detail view (about 1920×620).
- Game ids are the `id` fields in `data/games.json`.
- A hand-uploaded file goes in `localArt`. A store that only serves expiring image links (Meta Quest) gets its art saved here instead, with `art.capsule` / `art.hero` pointing at the files; see `data/schema.md`, Art rules.

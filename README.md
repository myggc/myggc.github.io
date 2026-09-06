# GGC website

Static site, no build step. Every page is a plain HTML file; the catalogue
lives in two JSON files in this repo. Open `index.html` in a browser or serve
the folder from any static host (it is built for GitHub Pages).

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `hub.html` | Hub — four directions (`#community`, `#publishing`, `#acceleration`, `#report`) |
| `companies.html` | Studio catalogue (`#companies`, `#teams`, `#solo`, or `#<studio-id>`) |
| `games.html` | Game catalogue (`#<game-id>` opens a game) |
| `submit.html` | Submit / correct data |
| `about.html` | About GGC |
| `donate.html` | Donate (kisa.ge) |
| `admin.html` | Admin panel — not linked from the public nav |
| `wireframes.html` | Sitemap + wireframes, reference only |

## How the data flows

```
visitor fills submit.html and presses send
                    │
                    ▼
        POST to config.submitEndpoint      ← the relay in worker/ (required)
                    │
        GitHub issue labelled "submission"
                    │
        admin.html reads the queue, shows now-vs-new
                    │
        approve ──► data/*.json committed, issue closed
                    │
        every page reads data/*.json on load
```

Nothing is stored anywhere except this repository, so every change to the
catalogue is a normal, reviewable commit.

- **[`data/schema.md`](data/schema.md)** — what a company and a game record hold.
- **[`worker/README.md`](worker/README.md)** — the submission relay. **Deploy one
  before launch**: a page on GitHub Pages cannot create an issue without a
  secret to sign it, so until `config.submitEndpoint` is set the form has
  nowhere to send to. The Apps Script option takes about three minutes in a
  browser with nothing installed. The admin panel's settings tab shows whether
  the receiver is configured and can ping it.

## Admin panel

`admin.html` signs in with a GitHub fine-grained personal access token scoped to
this repository (**Contents: read+write**, **Issues: read+write**). The token is
kept in that browser's `localStorage` and only ever sent to `api.github.com`.

What it does:

- **Queue** — every open submission issue, with a field-by-field *now → new*
  diff for edits and a plain field list for new entries. GitHub drops the label
  from a prefilled issue opened by someone without write access, so the queue
  recognises submissions by their payload marker and title too, not only by the
  `submission` label.
- **Approve / reject** — changes collect in a working copy; **GitHub-ზე ატვირთვა**
  writes `companies.json` and `games.json` in a single commit, then comments on
  and closes each issue it handled.
- **Lists** — companies, teams, solo developers and games, searchable, sortable
  (games by year by default), each row showing status, game count and validation
  date.
- **Editor** — every field of a record, its attached games, social and store
  links, per-game store sync, and image upload.
- **JSON ექსპორტი** — a full snapshot, no sign-in needed.

Uploaded images are centre-cropped and re-encoded in the browser before they
are committed — 512×512 for a logo, 920×430 for a capsule, 600×900 for a phone
title — so every card in a row lines up, nothing overflows its frame and no
blank edge shows. The admin sees the exact framing before confirming.

Without a token the panel still opens in read-only mode ("მხოლოდ დათვალიერება").

## Store parsing

A game with a store link keeps itself up to date:

- **In the browser** — `submit.html` and the admin panel read the store live
  through a CORS proxy for an instant preview. Public proxies are unreliable, so
  a failure just falls back to filling the form by hand.
- **In the repo** — `scripts/refresh-stores.mjs` does the same reads server side
  with no proxy, and `.github/workflows/refresh-stores.yml` runs it twice a day
  and commits whatever changed. This is the path that actually keeps the site
  current.

Steam uses the storefront API; itch.io, App Store, Google Play and the console
stores are read from their Open Graph tags.

## Folders

```
assets/brand/   logo SVGs
assets/js/      ggc-core.js    data, store parsing, submission delivery
                ggc-github.js  admin ↔ GitHub (admin.html only)
                support.js     page runtime
                i18n.js        Georgian → English dictionary
data/           companies.json, games.json, schema.md
scripts/        refresh-stores.mjs
worker/         optional submission relay
images/games/   game art          images/logos/     studio logos
images/events/  past-event photos images/team/      team photos
images/partners/partner logos     images/qr/        kisa.ge QR codes
```

## Editing by hand

- **Catalogue** — the admin panel, or edit `data/*.json` directly.
- **Photos** — drop files into the `images/` subfolders using the names in each
  folder's README. Placeholders disappear as soon as a file exists.
- **Copy and numbers** — the hero counters come from the data; other copy lives
  in each page's `<script data-dc-script>` block near the bottom.
- **English** — `assets/js/i18n.js`. Add `"ქართული ტექსტი": "English text",` and
  the GE/EN switch picks it up. Untranslated text stays Georgian.
- **Repository / Telegram / submit endpoint** — the `config` object at the top of
  `assets/js/ggc-core.js`.

Pages load Google Fonts and React from a CDN, so they need a connection.

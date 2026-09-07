# Catalogue data

Two files hold everything the site shows. They are plain JSON in this repo, so
the whole catalogue is public, diffable and reviewable like any other change.

```
data/companies.json   studios, teams and solo developers
data/games.json       games, each one linked to a company by id
```

Both look like `{ "version": 1, "updated": "YYYY-MM-DD", "items": [ … ] }`.

A game can only exist under a company — `studioId` must match a company `id`.
That is what makes a studio profile able to list its games and a game card able
to link back to its studio.

## Company

| field | meaning |
| --- | --- |
| `id` | url slug, used in `companies.html#<id>` and by `studioId` |
| `kind` | `company` (registered), `team` (unregistered), `solo` |
| `legal` | **the real identifier** — a company's registered name, a team's name, or a person's full name |
| `regId` | state registration number (companies only) |
| `name` | public / brand name |
| `city`, `size` | shown only when filled; `size` is not asked of a solo developer |
| `founded` | a year (`2019`) or a full date (`2019-05-14`); for a solo developer this is the birth year |
| `roles` | `developer`, `publisher`, `art`, `audio`, `porting`, `outsourcing`, `codev` |
| `website`, `email`, `about`, `aboutEn` | `website` is a portfolio for a solo developer |
| `phone`, `contact` | never shown publicly; `contact` is not asked of a solo developer, who is their own contact |
| `logo` | path under `images/logos/`, shown in a circle |
| `links` | `{ telegram, facebook, instagram, linkedin, youtube, x, steam, itch, … }` |
| `verified` | shows the ✔ badge |
| `active` | `false` hides it from the catalogue unless "არააქტიურებიც" is on |
| `validated` | GGC validation date, `YYYY-MM-DD` |
| `created`, `updated` | bookkeeping |

Any empty field simply does not appear on the profile.

## Game

| field | meaning |
| --- | --- |
| `id` | url slug, used in `games.html#<id>` |
| `name` | title |
| `studioId` | **required**, the company that made it |
| `publisherId` | optional, when someone else publishes it |
| `status` | `upcoming` or `released` — upcoming sorts first everywhere |
| `releaseDate`, `year` | empty date = TBD |
| `mobile` | portrait art instead of a 460×215 capsule; set automatically when the only stores are App Store / Google Play |
| `genres`, `platforms`, `engine`, `price`, `langs` | shown when filled |
| `stores` | `{ steam, itch, appstore, googleplay, switch, xbox, playstation, epic, gog }` — full page URLs |
| `art` | `{ capsule, hero, portrait }` — remote store images |
| `localArt` | hand-uploaded image, used **only** while `art` is empty |
| `locked` | field names the store refresh must not overwrite, e.g. `["name"]` |
| `source`, `parsedAt` | which store the data came from and when |
| `verified`, `validated` | same meaning as on a company |

### Art rules

`art.*` always wins over `localArt`. When the store refresh finds a capsule it
clears `localArt`, so a studio that opens a Steam page later stops using its
hand-uploaded image and no stale file is left behind.

Images uploaded through the admin panel are centre-cropped and compressed in
the browser first, to fixed sizes — logo 512×512, capsule 920×430, phone title
600×900 — so a row of cards always lines up and no image shows a blank edge.

### Where Steam art comes from

Only from URLs the Steam API actually returns. The guessable
`cdn.*.steamstatic.com/steam/apps/<id>/capsule_616x353.jpg` path still resolves,
but it can serve artwork a studio replaced long ago — Dumbriel's did — and that
staleness is at the origin, so no cache-busting query gets around it.

| field | Steam source | note |
| --- | --- | --- |
| `art.capsule` | `header_image` | 460×215, the aspect the cards draw |
| `art.hero` | `background_raw` | wide page art for the detail banner |
| `art.portrait` | — | left empty; Steam returns none |
| `art.shots` | `screenshots` | first three |

Every one of those carries a `?t=` stamp that changes when the store page is
updated, so a refreshed run picks up new art on its own.

### Keeping it fresh

`scripts/refresh-stores.mjs` re-reads every game that has a store link and
writes the result back. `.github/workflows/refresh-stores.yml` runs it twice a
day; the admin panel can also run it per game or for everything at once.

```bash
node scripts/refresh-stores.mjs            # all games
node scripts/refresh-stores.mjs --id dumbriel --dry
```

## Site content — `data/site.json`

Everything on the site that is neither a studio nor a game. Edited in the panel
under **საიტის შიგთავსი** and published in the same commit as the catalogue.

| field | meaning |
| --- | --- |
| `events[]` | `{ id, title, date, image, link }` — the hub's community page; newest first, and the section is empty rather than invented when the list is |
| `spending[]` | `{ label, amount }` in lari — the donate page's breakdown; the whole section is hidden while this is empty |

Both used to be written into the HTML, which is why they went stale: keeping
them current meant editing a page.

## Wording — `data/i18n.json`

Both languages of the site, as far as either can be corrected without a commit.
`assets/js/i18n.js` ships a dictionary of Georgian → English pairs; this file is
the layer on top of it, edited in the panel under **ლოკალიზაცია** and published
on its own.

| field | meaning |
| --- | --- |
| `strings` | `{ "<Georgian, exactly as the page says it>": "<English>" }` |
| `ka` | `{ "<Georgian, as the page says it>": "<Georgian, as it should say it>" }` |

A key in `strings` overrides the shipped pair of the same name; a key the
shipped dictionary has never seen is simply added. Nothing is required — a
string with no entry in either place stays in Georgian, which is the honest
failure.

`ka` corrects the Georgian itself, which is otherwise authored in the pages and
could only be changed by editing one. It applies in both languages, because a
string with no English is Georgian on the English page too. Both maps are keyed
by the original text as the markup says it, so correcting a string twice does
not create a second entry for it, and a correction whose result is itself a key
is ignored rather than chained.

The scan opens every page in turn and lists what it finds, so the list of what
is still untranslated comes from the pages themselves rather than from memory.

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
| `legal` | **official registered name — the real identifier** |
| `regId` | state registration number (companies only) |
| `name` | public / brand name |
| `city`, `founded`, `size` | shown only when filled |
| `roles` | `developer`, `publisher`, `art`, `audio`, `porting`, `outsourcing`, `codev` |
| `website`, `email`, `about`, `aboutEn` | optional |
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

### Keeping it fresh

`scripts/refresh-stores.mjs` re-reads every game that has a store link and
writes the result back. `.github/workflows/refresh-stores.yml` runs it twice a
day; the admin panel can also run it per game or for everything at once.

```bash
node scripts/refresh-stores.mjs            # all games
node scripts/refresh-stores.mjs --id dumbriel --dry
```

#!/usr/bin/env node
/* Re-reads every game that has a store link and writes the fresh values back
   into data/games.json. Runs on a schedule from .github/workflows so the
   catalogue keeps up with the stores without anyone touching the admin panel.
   No dependencies — Node 20+ (built-in fetch).

   Usage:  node scripts/refresh-stores.mjs [--dry] [--id <game-id>]
*/

import { readFile, writeFile } from "node:fs/promises";

const GAMES = new URL("../data/games.json", import.meta.url);
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const ONLY = args.includes("--id") ? args[args.indexOf("--id") + 1] : "";

const STORE_LABEL = {
  steam: "Steam", itch: "itch.io", appstore: "App Store", googleplay: "Google Play",
  switch: "Switch", xbox: "Xbox", playstation: "PlayStation", epic: "Epic Games", gog: "GOG"
};
const UA = "Mozilla/5.0 (compatible; GGCBot/1.0; +https://myggc.github.io)";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, asJson) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en", "Accept": asJson ? "application/json" : "text/html" },
    redirect: "follow"
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return asJson ? res.json() : res.text();
}

function meta(html, prop) {
  const a = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)`, "i").exec(html);
  if (a) return a[1];
  const b = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i").exec(html);
  return b ? b[1] : "";
}
const strip = (s) => String(s || "").replace(/<[^>]+>/g, "").trim();

/* Only ever use URLs the store API itself returned.
   The guessable path — cdn.*.steamstatic.com/steam/apps/<id>/capsule_616x353.jpg
   — still resolves, but for Dumbriel it serves artwork the studio replaced long
   ago. That staleness is at the origin, not the edge: the same bytes come back
   with or without a cache-busting query, so it cannot be worked around. The
   hashed store_item_assets URLs in the API response are the current art, and
   they carry a ?t= stamp that changes whenever the store page is updated.

   header_image is 460x215 — exactly the aspect the cards draw — so it serves as
   the capsule. background_raw is the wide page art, which suits the detail
   banner. Portrait is left empty: Steam does not return one, and a guessed
   library_600x900.jpg has the same staleness problem.
   Mirrors steamArt() in assets/js/ggc-core.js — keep the two in step. */
function steamArt(d) {
  const header = d.header_image || '';
  return {
    capsule: header,
    hero: d.background_raw || header,
    portrait: '',
    shots: (d.screenshots || []).slice(0, 3).map((s) => s.path_thumbnail || s.path_full).filter(Boolean)
  };
}

/* Mirrors GGC.stores.steamFromJson in assets/js/ggc-core.js — keep in step. */
async function readSteam(appid, url) {
  const json = await get(`https://store.steampowered.com/api/appdetails?appids=${appid}&l=english&cc=us`, true);
  const entry = json?.[appid];
  if (!entry?.success || !entry.data) throw new Error(`steam ${appid}: no data`);
  const d = entry.data;
  const rel = d.release_date || {};
  const date = rel.date || "";
  const year = Number(/(\d{4})/.exec(date)?.[1]) || 0;
  return {
    name: d.name || "",
    about: strip(d.short_description),
    genres: (d.genres || []).map((g) => String(g.description).toLowerCase()),
    status: rel.coming_soon ? "upcoming" : "released",
    releaseDate: date,
    year,
    price: d.is_free ? "უფასო" : (d.price_overview?.final_formatted || ""),
    langs: strip(d.supported_languages).replace(/\*/g, "").trim(),
    art: steamArt(d),
    platforms: ["Steam"],
    mobile: false,
    source: "steam"
  };
}

async function readOG(url, extra) {
  const html = await get(url, false);
  const title = meta(html, "og:title") || /<title[^>]*>([^<]+)/i.exec(html)?.[1] || "";
  if (!title.trim()) throw new Error(`no metadata at ${url}`);
  const img = meta(html, "og:image");
  return {
    // Every store appends its own name to the title; none of that is the game's.
    name: title
      .replace(/\s*[-–—|]\s*(Apps|Games) on Google Play\s*$/i, "")
      .replace(/\s+on (Steam|the App Store)\s*$/i, "")
      .replace(/\s*[-–—|]\s*itch\.io\s*$/i, "")
      .replace(/\s+by\s+[^|]*$/i, "")
      .trim(),
    about: meta(html, "og:description") || meta(html, "description") || "",
    art: { capsule: img, hero: img, portrait: "" },
    genres: [], platforms: [], mobile: false, source: "og",
    ...extra
  };
}

/* Apple publishes an app's whole record as JSON, which is both richer than the
   og tags — screenshots, genres, languages, the exact release date — and stable
   in a way a rendered page is not. Same endpoint the site's importer uses, so a
   refreshed record matches the one the import produced. */
async function readApple(id) {
  const j = await get(`https://itunes.apple.com/lookup?id=${id}&country=us`, true);
  const r = (j.results || [])[0];
  if (!r) throw new Error(`apple: no record for ${id}`);
  const date = String(r.releaseDate || "").slice(0, 10);
  const art = r.artworkUrl512 || r.artworkUrl100 || "";
  const shots = (r.screenshotUrls || []).concat(r.ipadScreenshotUrls || []).slice(0, 6);
  return {
    name: String(r.trackName || "").trim(),
    about: strip(r.description),
    genres: (r.genres || []).filter((g) => !/^games$/i.test(g)).map((g) => String(g).toLowerCase()),
    status: date && date > new Date().toISOString().slice(0, 10) ? "upcoming" : "released",
    releaseDate: date,
    year: Number(date.slice(0, 4)) || 0,
    price: r.formattedPrice || "",
    langs: (r.languageCodesISO2A || []).join(", "),
    art: { capsule: art, hero: shots[0] || art, portrait: art, shots },
    platforms: ["App Store"],
    mobile: true,
    source: "appstore"
  };
}

function detect(url) {
  const u = String(url || "").trim();
  if (!u) return null;
  const bare = u.replace(/^https?:\/\//, "");
  let m;
  if ((m = /store\.steampowered\.com\/app\/(\d+)/i.exec(u))) return { kind: "steam", id: m[1], url: u };
  if ((m = /^([\w-]+)\.itch\.io\/([\w-]+)/i.exec(bare))) return { kind: "itch", id: `${m[1]}/${m[2]}`, url: u };
  if ((m = /apps\.apple\.com\/[^?]*\/id(\d+)/i.exec(u))) return { kind: "appstore", id: m[1], url: u };
  if ((m = /play\.google\.com\/store\/apps\/details\?id=([\w.]+)/i.exec(u))) return { kind: "googleplay", id: m[1], url: u };
  if (/nintendo\.com/i.test(u)) return { kind: "switch", id: "", url: u };
  if (/xbox\.com/i.test(u)) return { kind: "xbox", id: "", url: u };
  if (/playstation\.com/i.test(u)) return { kind: "playstation", id: "", url: u };
  if (/epicgames\.com/i.test(u)) return { kind: "epic", id: "", url: u };
  if (/gog\.com/i.test(u)) return { kind: "gog", id: "", url: u };
  return null;
}

async function readStore(url) {
  const d = detect(url);
  if (!d) throw new Error(`unrecognised store url: ${url}`);
  if (d.kind === "steam") return readSteam(d.id, d.url);
  if (d.kind === "itch") return readOG(d.url, { platforms: ["itch.io"], source: "itch" });
  if (d.kind === "appstore") return readApple(d.id).catch(() => readOG(d.url, { platforms: ["App Store"], mobile: true, source: "appstore" }));
  if (d.kind === "googleplay") return readOG(d.url, { platforms: ["Google Play"], mobile: true, source: "googleplay" });
  return readOG(d.url, { platforms: [STORE_LABEL[d.kind] || "Web"], source: d.kind });
}

/* The store owns these fields; anything listed in a game's `locked` array is
   left exactly as the admin set it. */
const OWNED = ["name", "about", "genres", "status", "releaseDate", "year", "price", "langs", "art"];

function merge(game, parsed) {
  const locked = new Set(game.locked || []);
  const next = { ...game };
  let changed = false;
  const set = (key, value) => {
    if (locked.has(key)) return;
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value) && !value.length) return;
    if (JSON.stringify(next[key]) === JSON.stringify(value)) return;
    next[key] = value;
    changed = true;
  };
  for (const key of OWNED) {
    if (key === "art") set("art", { ...(game.art || {}), ...(parsed.art || {}) });
    else set(key, parsed[key]);
  }
  // Platforms the store proves are real get added; hand-entered ones stay.
  const plats = new Set([...(game.platforms || []), ...(parsed.platforms || [])]);
  if (plats.size !== (game.platforms || []).length) {
    next.platforms = [...plats];
    changed = true;
  }
  // Once the store supplies art, the hand-uploaded file is dead weight.
  if (next.art?.capsule && next.localArt) {
    next.localArt = "";
    changed = true;
  }
  if (parsed.mobile && !game.mobile) { next.mobile = true; changed = true; }
  if (changed) {
    next.source = parsed.source;
    next.parsedAt = new Date().toISOString();
    next.updated = new Date().toISOString().slice(0, 10);
  }
  return { next, changed };
}

const STORE_KEYS = ["steam", "itch", "appstore", "googleplay", "switch", "xbox", "playstation", "epic", "gog"];

async function main() {
  const doc = JSON.parse(await readFile(GAMES, "utf8"));
  const items = doc.items || [];
  let updated = 0, failed = 0, skipped = 0;

  for (let i = 0; i < items.length; i++) {
    const game = items[i];
    if (ONLY && game.id !== ONLY) continue;
    const url = STORE_KEYS.map((k) => game.stores?.[k]).find(Boolean);
    if (!url) { skipped++; continue; }
    try {
      const parsed = await readStore(url);
      const { next, changed } = merge(game, parsed);
      if (changed) {
        items[i] = next;
        updated++;
        console.log(`updated  ${game.id}  <- ${parsed.source}`);
      } else {
        console.log(`same     ${game.id}`);
      }
    } catch (err) {
      failed++;
      console.warn(`FAILED   ${game.id}: ${err.message}`);
    }
    await sleep(1200); // stay polite with the storefronts
  }

  console.log(`\n${updated} updated, ${failed} failed, ${skipped} without a store link`);
  if (!updated) return;
  doc.updated = new Date().toISOString().slice(0, 10);
  if (DRY) { console.log("--dry: not writing"); return; }
  await writeFile(GAMES, JSON.stringify(doc, null, 2) + "\n", "utf8");
}

main().catch((err) => { console.error(err); process.exit(1); });

/* GGC core — configuration, data access, store parsing, submission delivery.
   Plain script, no build step. Loads before every page's own logic.
   window.GGC = { config, util, data, stores, submit } */
(function () {
  "use strict";

  // The page runtime evaluates <helmet> scripts more than once. Rebuilding the
  // module would hand later callers a fresh, empty cache while the data an
  // earlier caller already fetched sat in the discarded copy — so bail out.
  if (window.GGC && window.GGC.__ggc) return;

  /* ------------------------------------------------------------------ config */

  var config = {
    // GitHub repository that holds the data files and the submission issues.
    owner: "myggc",
    repo: "myggc.github.io",
    branch: "main",
    // Label carried by every submission issue.
    label: "submission",
    // REQUIRED before launch. Where submit.html POSTs a submission; the relay
    // behind it holds the GitHub token and opens the issue. Deploy one from
    // worker/ (the Apps Script option needs nothing installed) and paste its
    // URL here. While this is empty the form has nowhere to send and nothing
    // reaches the admin queue.
    submitEndpoint: "https://script.google.com/macros/s/AKfycbycnJ6mfGDvH_ZXWMKXWKeyGRYu7KP-2n6tkN9hhOFla5KokwLGA7cjVO8XpJkw1V_x/exec",
    telegram: "https://t.me/ggcgeorgia",
    // CORS proxies used for live (browser side) store reads, tried in order.
    // "{url}" gets the encoded target, "{raw}" the target as-is. The scheduled
    // GitHub Action does the same work server side without a proxy, so a proxy
    // outage only affects the instant preview, never the published data.
    proxies: [
      "https://api.allorigins.win/raw?url={url}",
      "https://api.codetabs.com/v1/proxy?quest={url}",
      "https://r.jina.ai/{raw}",
      "https://corsproxy.io/?url={url}"
    ],
    paths: { companies: "data/companies.json", games: "data/games.json" }
  };
  config.raw = "https://raw.githubusercontent.com/" + config.owner + "/" + config.repo + "/" + config.branch + "/";
  config.issueNew = "https://github.com/" + config.owner + "/" + config.repo + "/issues/new";

  /* -------------------------------------------------------------------- util */

  var KIND_LABEL = { company: "რეგისტრირებული კომპანია", team: "გუნდი", solo: "სოლო დეველოპერი" };
  var ACCENT = { company: "#1d96d3", team: "#83c341", solo: "#fdb813" };
  var SOC = {
    telegram: "Telegram", facebook: "Facebook", instagram: "Instagram", linkedin: "LinkedIn",
    youtube: "YouTube", x: "X", steam: "Steam", itch: "itch.io", discord: "Discord",
    tiktok: "TikTok", twitch: "Twitch", website: "ვებსაიტი"
  };
  var STORE_LABEL = {
    steam: "Steam", itch: "itch.io", appstore: "App Store", googleplay: "Google Play",
    "switch": "Switch", xbox: "Xbox", playstation: "PlayStation", epic: "Epic Games",
    gog: "GOG", web: "Web"
  };
  var PLATFORM_HOME = {
    "Steam": "https://store.steampowered.com", "itch.io": "https://itch.io",
    "App Store": "https://apps.apple.com", "Google Play": "https://play.google.com",
    "Switch": "https://www.nintendo.com", "Xbox": "https://www.xbox.com",
    "PlayStation": "https://store.playstation.com", "Epic Games": "https://store.epicgames.com",
    "GOG": "https://www.gog.com", "Web": ""
  };

  /* Official brand marks, by the service's own icon rather than its name.
     Served from Simple Icons, which keeps the current official glyph for each
     brand and takes the fill colour in the path — so one URL covers a dark pill
     and a light one. The label stays next to the icon, which also means a
     blocked or failed image never leaves an unlabelled button. */
  var ICON_SLUG = {
    telegram: "telegram", facebook: "facebook", instagram: "instagram",
    linkedin: "linkedin", youtube: "youtube", x: "x", steam: "steam",
    itch: "itchdotio", discord: "discord", tiktok: "tiktok", twitch: "twitch",
    bluesky: "bluesky", artstation: "artstation", github: "github"
  };
  var PLATFORM_SLUG = {
    "Steam": "steam", "itch.io": "itchdotio", "App Store": "appstore",
    "Google Play": "googleplay", "Switch": "nintendoswitch", "Xbox": "xbox",
    "PlayStation": "playstation", "Epic Games": "epicgames", "GOG": "gogdotcom"
  };
  /* LinkedIn, Xbox and Nintendo asked Simple Icons to drop their marks, so the
     CDN answers 404 for those three — and a plain website has no brand mark at
     all. Those are drawn here instead, as data URIs so the same <img> works
     either way. COLOR is substituted per use. */
  var LOCAL_ICON = {
    website:
      '<circle cx="12" cy="12" r="9" fill="none" stroke="COLOR" stroke-width="2"/>' +
      '<path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18" fill="none" stroke="COLOR" stroke-width="2"/>',
    linkedin:
      '<path fill="COLOR" d="M22.2 0H1.8C.8 0 0 .8 0 1.7v20.6C0 23.2.8 24 1.8 24h20.4c1 0 1.8-.8 1.8-1.7V1.7C24 .8 23.2 0 22.2 0zM7.1 20.5H3.5V9h3.6v11.5zM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zm15.1 13.1h-3.6v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9v5.7H9.4V9h3.4v1.6h.1c.5-.9 1.6-1.9 3.4-1.9 3.6 0 4.3 2.4 4.3 5.5v6.3z"/>',
    Xbox:
      '<circle cx="12" cy="12" r="10" fill="none" stroke="COLOR" stroke-width="2"/>' +
      '<path d="M6.2 4.9C8.6 7.6 12 11.9 12 11.9s3.4-4.3 5.8-7M6.2 19.1C8.6 16.4 12 12.1 12 12.1s3.4 4.3 5.8 7" fill="none" stroke="COLOR" stroke-width="2" stroke-linecap="round"/>',
    "Switch":
      '<path fill="COLOR" fill-rule="evenodd" d="M7 2.2h1.2A3.8 3.8 0 0 1 12 6v12a3.8 3.8 0 0 1-3.8 3.8H7A3.8 3.8 0 0 1 3.2 18V6A3.8 3.8 0 0 1 7 2.2zm.1 1.9A1.9 1.9 0 0 0 5.2 6v12c0 1 .8 1.9 1.9 1.9h1a1.9 1.9 0 0 0 1.9-1.9V6a1.9 1.9 0 0 0-1.9-1.9h-1zm.4 1.9a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4z"/>' +
      '<path fill="COLOR" fill-rule="evenodd" d="M15.8 2.2H17A3.8 3.8 0 0 1 20.8 6v12A3.8 3.8 0 0 1 17 21.8h-1.2A3.8 3.8 0 0 1 12 18V6a3.8 3.8 0 0 1 3.8-3.8zm.7 12a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4z"/>'
  };

  function dataIcon(shapes, color) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
      shapes.split("COLOR").join("#" + color) + "</svg>"
    );
  }

  function iconUrl(key, hex) {
    var color = (hex || "ffffff").replace("#", "");
    if (LOCAL_ICON[key]) return dataIcon(LOCAL_ICON[key], color);
    var slug = ICON_SLUG[key] || PLATFORM_SLUG[key];
    if (!slug) return dataIcon(LOCAL_ICON.website, color);
    return "https://cdn.simpleicons.org/" + slug + "/" + color;
  }

  function slug(s) {
    return String(s || "").toLowerCase().trim()
      .replace(/['".,()]/g, "")
      .replace(/[^a-z0-9Ⴀ-ჿ]+/g, "-")
      .replace(/^-+|-+$/g, "").slice(0, 48) || "entry";
  }
  function initials(s) {
    return String(s || "").trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ""; }).join("");
  }
  /* "2025-03-12" -> "12.03.2025"; anything else passes through untouched. */
  function fmtDate(iso) {
    if (!iso) return "";
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso));
    return m ? m[3] + "." + m[2] + "." + m[1] : String(iso);
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function yearOf(g) {
    if (g.year) return Number(g.year);
    var m = /(\d{4})/.exec(g.releaseDate || "");
    return m ? Number(m[1]) : 0;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* Target sizes for hand-uploaded art, so every card in a row lines up.
     Logos are square (shown in a circle), store-style capsules are 460×215 at
     2×, phone titles keep the tall store shape. */
  var IMAGE_SIZES = {
    logo: { w: 512, h: 512 },
    capsule: { w: 920, h: 430 },
    portrait: { w: 600, h: 900 }
  };

  /* Centre-crops to the target aspect and re-encodes as JPEG, so an upload can
     never overflow its frame or leave a blank band at the edges — and a 6 MB
     phone screenshot does not end up committed as-is. */
  function prepareImage(file, kind, quality) {
    var size = IMAGE_SIZES[kind] || IMAGE_SIZES.capsule;
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(new Error("ეს სურათი არ არის"));
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error("ფაილი ვერ წაიკითხა")); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error("სურათი ვერ გაიხსნა")); };
        img.onload = function () {
          var canvas = document.createElement("canvas");
          canvas.width = size.w;
          canvas.height = size.h;
          var ctx = canvas.getContext("2d");
          // Cover: scale to fill, then centre what does not fit.
          var scale = Math.max(size.w / img.width, size.h / img.height);
          var dw = img.width * scale, dh = img.height * scale;
          ctx.fillStyle = "#e8eaec";
          ctx.fillRect(0, 0, size.w, size.h);
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, (size.w - dw) / 2, (size.h - dh) / 2, dw, dh);
          var dataUrl = canvas.toDataURL("image/jpeg", quality || 0.82);
          resolve({
            dataUrl: dataUrl,
            base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
            width: size.w,
            height: size.h,
            bytes: Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75)
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* -------------------------------------------------------------------- data */

  var cache = { companies: null, games: null, promise: null, raw: null };

  function fetchJSON(path) {
    var local = path + (path.indexOf("?") < 0 ? "?t=" : "&t=") + Date.now();
    var remote = config.raw + path;
    // file:// cannot read sibling JSON, so try the published copy first there.
    var order = location.protocol === "file:" ? [remote, local] : [local, remote];
    return order.reduce(function (chain, url) {
      return chain.catch(function () {
        return fetch(url, { cache: "no-store" }).then(function (r) {
          if (!r.ok) throw new Error(url + " -> " + r.status);
          return r.json();
        });
      });
    }, Promise.reject(new Error("start")));
  }

  function normCompany(c) {
    c = c || {};
    return {
      id: c.id || slug(c.legal || c.name),
      kind: c.kind === "team" || c.kind === "solo" ? c.kind : "company",
      name: c.name || c.legal || "",
      legal: c.legal || "",
      regId: c.regId || "",
      city: c.city || "",
      founded: Number(c.founded) || 0,
      size: c.size || "",
      roles: Array.isArray(c.roles) ? c.roles : [],
      website: c.website || "",
      email: c.email || "",
      about: c.about || "",
      aboutEn: c.aboutEn || "",
      logo: c.logo || "",
      links: c.links || {},
      verified: !!c.verified,
      active: c.active !== false,
      validated: c.validated || "",
      created: c.created || "",
      updated: c.updated || ""
    };
  }

  function normGame(g) {
    g = g || {};
    var stores = g.stores || {};
    var plats = Array.isArray(g.platforms) && g.platforms.length
      ? g.platforms
      : Object.keys(stores).filter(function (k) { return stores[k]; })
        .map(function (k) { return STORE_LABEL[k] || k; });
    var out = {
      id: g.id || slug(g.name),
      name: g.name || "",
      studioId: g.studioId || "",
      publisherId: g.publisherId || "",
      status: g.status === "released" ? "released" : "upcoming",
      releaseDate: g.releaseDate || "",
      year: Number(g.year) || 0,
      mobile: !!g.mobile,
      genres: Array.isArray(g.genres) ? g.genres : [],
      platforms: plats,
      engine: g.engine || "",
      price: g.price || "",
      langs: g.langs || "",
      about: g.about || "",
      aboutEn: g.aboutEn || "",
      stores: stores,
      art: g.art || {},
      localArt: g.localArt || "",
      source: g.source || "manual",
      parsedAt: g.parsedAt || "",
      verified: !!g.verified,
      active: g.active !== false,
      validated: g.validated || "",
      created: g.created || "",
      updated: g.updated || ""
    };
    out.year = yearOf(out);
    // A title sold only on phone stores uses portrait art; the rest use a capsule.
    out.mobile = out.mobile || (plats.length > 0 && plats.every(function (p) {
      return p === "App Store" || p === "Google Play";
    }));
    return out;
  }

  function load(force) {
    if (cache.promise && !force) return cache.promise;
    cache.promise = Promise.all([
      fetchJSON(config.paths.companies).catch(function () { return { items: [] }; }),
      fetchJSON(config.paths.games).catch(function () { return { items: [] }; })
    ]).then(function (r) {
      cache.raw = { companies: r[0], games: r[1] };
      cache.companies = (r[0].items || r[0] || []).map(normCompany);
      cache.games = (r[1].items || r[1] || []).map(normGame);
      return { companies: cache.companies, games: cache.games };
    });
    return cache.promise;
  }

  function companies() { return cache.companies || []; }
  function games() { return cache.games || []; }
  function company(id) {
    var all = companies();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }
  function game(id) {
    var all = games();
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }
  function gamesOf(companyId) {
    return games().filter(function (g) {
      return g.studioId === companyId || g.publisherId === companyId;
    });
  }
  function studioName(g) {
    var c = company(g.studioId);
    return c ? c.name : "";
  }
  /* Upcoming first (soonest first), then released newest first. */
  function sortGames(list) {
    return list.slice().sort(function (a, b) {
      if (a.status !== b.status) return a.status === "upcoming" ? -1 : 1;
      if (a.status === "upcoming") return (a.year || 9999) - (b.year || 9999);
      return b.year - a.year;
    });
  }
  function stats() {
    var cs = companies().filter(function (c) { return c.active; });
    var gs = games();
    return {
      companies: cs.filter(function (c) { return c.kind === "company"; }).length,
      teams: cs.filter(function (c) { return c.kind === "team"; }).length,
      solo: cs.filter(function (c) { return c.kind === "solo"; }).length,
      studios: cs.length,
      games: gs.length,
      upcoming: gs.filter(function (g) { return g.status === "upcoming"; }).length,
      released: gs.filter(function (g) { return g.status === "released"; }).length
    };
  }
  /* Store art wins over a hand-uploaded file, so a studio that later opens a
     Steam page automatically stops using the local image. */
  function gameArt(g) {
    return (g.art && (g.art.capsule || g.art.portrait || g.art.hero)) || g.localArt || "";
  }
  function gameHero(g) {
    return (g.art && (g.art.hero || g.art.capsule)) || g.localArt || "";
  }
  function platformLinks(g) {
    var stores = g.stores || {};
    var byLabel = {};
    Object.keys(stores).forEach(function (k) {
      if (stores[k]) byLabel[STORE_LABEL[k] || k] = stores[k];
    });
    return (g.platforms || []).map(function (p) {
      return {
        name: p,
        url: byLabel[p] || PLATFORM_HOME[p] || "",
        external: !!byLabel[p],
        // Two fills, because the same list is drawn on a dark pill in the game
        // page and on a light chip in the card.
        icon: iconUrl(p, "ffffff"),
        iconDark: iconUrl(p, "41464c")
      };
    });
  }
  function releaseLabel(g) {
    if (g.status === "released") return g.year ? String(g.year) : "გამოსული";
    if (g.releaseDate && g.releaseDate.length > 4) return g.releaseDate;
    return g.year ? String(g.year) : "TBD";
  }

  /* ------------------------------------------------------------------ stores */

  function detect(url) {
    var u = String(url || "").trim();
    if (!u) return null;
    var bare = u.replace(/^https?:\/\//, "");
    var m;
    if ((m = /store\.steampowered\.com\/app\/(\d+)/i.exec(u))) return { kind: "steam", id: m[1], url: u };
    if ((m = /^([\w-]+)\.itch\.io\/([\w-]+)/i.exec(bare))) return { kind: "itch", id: m[1] + "/" + m[2], url: u };
    if ((m = /apps\.apple\.com\/[^?]*\/id(\d+)/i.exec(u))) return { kind: "appstore", id: m[1], url: u };
    if ((m = /play\.google\.com\/store\/apps\/details\?id=([\w.]+)/i.exec(u))) return { kind: "googleplay", id: m[1], url: u };
    if (/nintendo\.com/i.test(u)) return { kind: "switch", id: "", url: u };
    if (/xbox\.com/i.test(u)) return { kind: "xbox", id: "", url: u };
    if (/playstation\.com/i.test(u)) return { kind: "playstation", id: "", url: u };
    if (/epicgames\.com/i.test(u)) return { kind: "epic", id: "", url: u };
    if (/gog\.com/i.test(u)) return { kind: "gog", id: "", url: u };
    return { kind: "web", id: "", url: u };
  }

  /* Tries each proxy until one returns something `read` can actually make sense
     of — a proxy that answers 200 with a useless body is a failure too, so the
     read runs inside the retry rather than after it. */
  function fetchVia(target, read) {
    return config.proxies.reduce(function (chain, tpl) {
      return chain.catch(function () {
        var url = tpl.replace("{url}", encodeURIComponent(target)).replace("{raw}", target);
        return fetch(url, { cache: "no-store" })
          .then(function (r) {
            if (!r.ok) throw new Error("proxy " + r.status);
            return r.text();
          })
          .then(read);
      });
    }, Promise.reject(new Error("start")));
  }
  function viaProxy(target) { return fetchVia(target, function (t) { return t; }); }

  /* Some proxies wrap the payload in their own preamble; dig the object out. */
  function jsonFrom(txt) {
    try { return JSON.parse(txt); } catch (e) {}
    var i = txt.indexOf("{"), j = txt.lastIndexOf("}");
    if (i >= 0 && j > i) {
      try { return JSON.parse(txt.slice(i, j + 1)); } catch (e2) {}
    }
    throw new Error("პასუხი JSON არ არის");
  }

  /* Only ever use URLs the store API itself returned.
     The guessable path — cdn.*.steamstatic.com/steam/apps/<id>/capsule_616x353.jpg
     — still resolves, but for Dumbriel it serves artwork the studio replaced long
     ago. That staleness is at the origin, not the edge: the same bytes come back
     with or without a cache-busting query, so it cannot be worked around. The
     hashed store_item_assets URLs in the API response are the current art, and
     they carry a ?t= stamp that changes whenever the store page is updated.

     header_image is 460x215 — exactly the aspect the cards draw — so it serves
     as the capsule. background_raw is the wide page art, which suits the detail
     banner. Portrait is left empty: Steam does not return one, and a guessed
     library_600x900.jpg has the same staleness problem. */
  function steamArt(d) {
    var header = d.header_image || "";
    return {
      capsule: header,
      hero: d.background_raw || header,
      portrait: "",
      shots: (d.screenshots || []).slice(0, 3)
        .map(function (s) { return s.path_thumbnail || s.path_full; })
        .filter(Boolean)
    };
  }

  /* Shared shape with scripts/refresh-stores.mjs — keep the two in step. */
  function steamFromJson(json, appid, url) {
    var entry = json && json[appid];
    var d = entry && entry.success && entry.data;
    if (!d) throw new Error("Steam: appid " + appid + " returned no data");
    var rel = d.release_date || {};
    var date = rel.date || "";
    var year = (/(\d{4})/.exec(date) || [])[1];
    return {
      name: d.name || "",
      about: (d.short_description || "").replace(/<[^>]+>/g, "").trim(),
      genres: (d.genres || []).map(function (g) { return String(g.description).toLowerCase(); }),
      status: rel.coming_soon ? "upcoming" : "released",
      releaseDate: date,
      year: Number(year) || 0,
      price: d.is_free ? "უფასო" : ((d.price_overview && d.price_overview.final_formatted) || ""),
      langs: (d.supported_languages || "").replace(/<[^>]+>/g, "").replace(/\*/g, "").trim(),
      developers: d.developers || [],
      publishers: d.publishers || [],
      art: steamArt(d),
      platforms: ["Steam"],
      stores: { steam: url || ("https://store.steampowered.com/app/" + appid + "/") },
      mobile: false,
      source: "steam"
    };
  }

  function parseSteam(appid, url) {
    var api = "https://store.steampowered.com/api/appdetails?appids=" + appid + "&l=english";
    return fetchVia(api, function (txt) { return steamFromJson(jsonFrom(txt), appid, url); });
  }

  /* Open Graph scrape — for stores without a public JSON endpoint. */
  function parseOG(url, extra) {
    return fetchVia(url, function (html) {
      function meta(prop) {
        var re = new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]*content=["\']([^"\']+)', "i");
        var m = re.exec(html);
        if (m) return m[1];
        re = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]*(?:property|name)=["\']' + prop + '["\']', "i");
        m = re.exec(html);
        return m ? m[1] : "";
      }
      var title = meta("og:title") || (/<title[^>]*>([^<]+)/i.exec(html) || [])[1] || "";
      // A proxy that strips the markup back to prose is no use here — fail so
      // the next one in the list gets a turn.
      if (!title.trim()) throw new Error("ამ გვერდიდან მონაცემები ვერ წაიკითხა");
      var img = meta("og:image");
      var out = {
        name: title.replace(/\s+by\s+[^|]*$/i, "").trim(),
        about: meta("og:description") || meta("description") || "",
        art: { capsule: img, hero: img, portrait: "" },
        genres: [], platforms: [], stores: {}, source: "og"
      };
      Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
      return out;
    });
  }

  function parseStore(url) {
    var d = detect(url);
    if (!d) return Promise.reject(new Error("ცარიელი ბმული"));
    if (d.kind === "steam") return parseSteam(d.id, d.url);
    if (d.kind === "itch") return parseOG(d.url, { platforms: ["itch.io"], stores: { itch: d.url }, source: "itch" });
    if (d.kind === "appstore") return parseOG(d.url, { platforms: ["App Store"], stores: { appstore: d.url }, mobile: true, source: "appstore" });
    if (d.kind === "googleplay") return parseOG(d.url, { platforms: ["Google Play"], stores: { googleplay: d.url }, mobile: true, source: "googleplay" });
    var label = STORE_LABEL[d.kind] || "Web";
    var st = {};
    st[d.kind] = d.url;
    return parseOG(d.url, { platforms: [label], stores: st, source: d.kind });
  }

  /* ------------------------------------------------------------------ submit */

  /* Renders a field for a human reading the queue, not for a machine: a list
     becomes "a, b", a links object becomes "telegram: @x", a kind becomes its
     Georgian label. Anything unrecognised still falls back to its text. */
  function fmtVal(v) {
    if (v === undefined || v === null) return "";
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "boolean") return v ? "კი" : "არა";
    if (typeof v === "object") {
      return Object.keys(v)
        .filter(function (k) { return v[k]; })
        .map(function (k) { return (SOC[k] || STORE_LABEL[k] || k) + ": " + v[k]; })
        .join(", ");
    }
    return KIND_LABEL[v] || String(v);
  }

  /* Field-by-field comparison against the published record, so the admin queue
     can show "now" vs "new" instead of a wall of values. */
  function diff(current, next, labels) {
    var out = [];
    Object.keys(next || {}).forEach(function (k) {
      var b = next[k];
      if (b === undefined || b === null || b === "") return;
      var sa = fmtVal(current ? current[k] : "");
      var sb = fmtVal(b);
      if (sa === sb || sb === "") return;
      out.push({ key: k, k: (labels && labels[k]) || k, old: sa || "—", "new": sb });
    });
    return out;
  }

  function payloadToIssue(p) {
    var title = "[" + p.action + "] " + (p.subject || "");
    var body = [
      "**ტიპი:** " + p.action,
      "**სუბიექტი:** " + (p.subject || ""),
      p.contact ? "**კონტაქტი:** " + p.contact : "",
      p.note ? "\n" + p.note : "",
      "",
      "<!-- ggc:payload -->",
      "```json",
      JSON.stringify(p, null, 2),
      "```"
    ].filter(Boolean).join("\n");
    return { title: title, body: body };
  }

  function issueUrl(p) {
    var i = payloadToIssue(p);
    return config.issueNew + "?labels=" + encodeURIComponent(config.label) +
      "&title=" + encodeURIComponent(i.title) +
      "&body=" + encodeURIComponent(i.body);
  }

  /* Delivery ladder: the configured endpoint first — that is the path where the
     visitor needs no account of any kind — and only if it is missing or down do
     we fall back to something they have to finish by hand.

     The POST deliberately uses text/plain. That keeps it a "simple" CORS
     request, so the browser sends no preflight, which is what lets a Google
     Apps Script web app work as the endpoint without any extra plumbing. Both
     recipes in worker/ read the raw body, so the header costs nothing. */
  /* Send means sent. Pressing the button is the last thing the visitor does —
     there is no "now finish it yourself" step, because asking someone to relay
     our own form is not a submission flow.

     That means config.submitEndpoint has to be set; a page served from GitHub
     Pages cannot create an issue on its own without a secret to sign it. If it
     is missing or the POST fails, that is our fault, not the visitor's: report
     the failure so the form can offer a retry, and say plainly in the console
     what the site owner needs to do. See worker/README.md. */
  function deliver(p) {
    p.submittedAt = new Date().toISOString();
    if (!config.submitEndpoint) {
      console.error(
        "GGC: config.submitEndpoint is empty, so submissions cannot be delivered.\n" +
        "Deploy worker/apps-script.gs (about 3 minutes, browser only) or\n" +
        "worker/submit-worker.js, then put its URL in assets/js/ggc-core.js."
      );
      return Promise.resolve({ ok: false, error: "endpoint-missing" });
    }
    return fetch(config.submitEndpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(p)
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json().catch(function () { return {}; });
    }).then(function (j) {
      if (j && j.error) throw new Error(j.error);
      return { ok: true, url: (j && j.url) || "" };
    }).catch(function (e) {
      return { ok: false, error: (e && e.message) || "unreachable" };
    });
  }

  window.GGC = {
    __ggc: 1,
    config: config,
    util: {
      slug: slug, initials: initials, fmtDate: fmtDate, today: today, clone: clone,
      prepareImage: prepareImage, IMAGE_SIZES: IMAGE_SIZES, iconUrl: iconUrl,
      KIND_LABEL: KIND_LABEL, ACCENT: ACCENT, SOC: SOC, STORE_LABEL: STORE_LABEL,
      PLATFORM_HOME: PLATFORM_HOME
    },
    data: {
      load: load, companies: companies, games: games, company: company, game: game,
      gamesOf: gamesOf, studioName: studioName, sortGames: sortGames, stats: stats,
      gameArt: gameArt, gameHero: gameHero, platformLinks: platformLinks,
      releaseLabel: releaseLabel, normCompany: normCompany, normGame: normGame,
      raw: function () { return cache.raw || {}; }
    },
    stores: { detect: detect, parse: parseStore, steamFromJson: steamFromJson, viaProxy: viaProxy, fetchVia: fetchVia, jsonFrom: jsonFrom },
    submit: { diff: diff, deliver: deliver, issueUrl: issueUrl, payloadToIssue: payloadToIssue, fmtVal: fmtVal }
  };
})();

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
    // Optional POST endpoint that accepts a submission without the visitor
    // needing a GitHub account (see worker/README.md). Empty = disabled, and
    // the submit page falls back to a prefilled GitHub issue + copy/Telegram.
    submitEndpoint: "",
    telegram: "https://t.me/gamedevgeorgia",
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
      return { name: p, url: byLabel[p] || PLATFORM_HOME[p] || "", external: !!byLabel[p] };
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

  /* Shared shape with scripts/refresh-stores.mjs — keep the two in step. */
  function steamFromJson(json, appid, url) {
    var entry = json && json[appid];
    var d = entry && entry.success && entry.data;
    if (!d) throw new Error("Steam: appid " + appid + " returned no data");
    var rel = d.release_date || {};
    var date = rel.date || "";
    var year = (/(\d{4})/.exec(date) || [])[1];
    var cdn = "https://cdn.cloudflare.steamstatic.com/steam/apps/" + appid + "/";
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
      art: {
        capsule: cdn + "capsule_616x353.jpg",
        hero: d.header_image || (cdn + "header.jpg"),
        portrait: cdn + "library_600x900.jpg"
      },
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

  /* Field-by-field comparison against the published record, so the admin queue
     can show "now" vs "new" instead of a wall of values. */
  function diff(current, next, labels) {
    var out = [];
    Object.keys(next || {}).forEach(function (k) {
      var b = next[k];
      if (b === undefined || b === null || b === "") return;
      var a = current ? current[k] : "";
      var sa = Array.isArray(a) ? a.join(", ")
        : (a && typeof a === "object" ? JSON.stringify(a) : String(a == null ? "" : a));
      var sb = Array.isArray(b) ? b.join(", ")
        : (b && typeof b === "object" ? JSON.stringify(b) : String(b));
      if (sa === sb) return;
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

  /* Delivery ladder: the configured endpoint first (no GitHub account needed
     on the visitor's side), otherwise a prefilled issue plus copy/Telegram. */
  function deliver(p) {
    p.submittedAt = new Date().toISOString();
    var manual = function () {
      return { via: "manual", url: issueUrl(p), json: JSON.stringify(p, null, 2) };
    };
    if (!config.submitEndpoint) return Promise.resolve(manual());
    return fetch(config.submitEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p)
    }).then(function (r) {
      if (!r.ok) throw new Error("endpoint " + r.status);
      return { via: "endpoint" };
    }).catch(manual);
  }

  window.GGC = {
    __ggc: 1,
    config: config,
    util: {
      slug: slug, initials: initials, fmtDate: fmtDate, today: today, clone: clone,
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
    submit: { diff: diff, deliver: deliver, issueUrl: issueUrl, payloadToIssue: payloadToIssue }
  };
})();

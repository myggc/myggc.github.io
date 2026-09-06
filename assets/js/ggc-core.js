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
    /* Measured from myggc.github.io itself, not from a laptop — the difference
       matters. Seventeen public proxies were tried; exactly one answered.
       corsproxy.io wants an API key, allorigins and codetabs have stopped
       answering, and corsfix serves localhost but replies 403
       "domain_not_registered" to the real site, which is the sort of thing that
       only shows up when you test where the visitors are.

       So r.jina.ai carries the public path alone, and it rate-limits. That is
       the case for the relay above: it is ours, it is not shared with the
       internet, and it makes this list a fallback rather than the plan. The
       last two are kept because they may come back — sticky-last-good ordering
       will find them again on its own if they do. */
    proxies: [
      "https://r.jina.ai/{raw}",
      "https://api.allorigins.win/get?url={url}",
      "https://api.codetabs.com/v1/proxy?quest={url}"
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
          var base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
          /* The preview goes into an inline style, and a data URL carries a
             semicolon in "image/jpeg;base64" — which the template's style
             parser treats as the end of the declaration, leaving an empty box.
             A blob URL has no semicolon, so preview and upload use different
             forms of the same bytes. */
          var blob = null;
          try {
            var bin = atob(base64);
            var buf = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
            blob = new Blob([buf], { type: "image/jpeg" });
          } catch (e) { blob = null; }
          resolve({
            url: blob ? URL.createObjectURL(blob) : dataUrl,
            dataUrl: dataUrl,
            base64: base64,
            width: size.w,
            height: size.h,
            bytes: Math.round(base64.length * 0.75)
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
    /* Derived from the platforms rather than stored: a title on the App Store
       and on Steam is not a phone title, and asking someone to keep a separate
       switch in agreement with the platform list only creates disagreements.
       "mobile" here means "shows portrait art", which is true only when every
       platform it ships on is a phone store. */
    var PHONE = { "App Store": 1, "Google Play": 1 };
    out.mobile = plats.length > 0 && plats.every(function (p) { return PHONE[p]; });
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
  /* Whichever proxy answered last is tried first next time. Without this every
     single request re-walked the dead ones from the top, which is what made
     importing a studio's whole catalogue look like it had hung — the work was
     happening, buried under twenty seconds of timeouts per game. */
  var lastGoodProxy = null;
  /* Long enough for a slow public proxy to answer — one measured at just over
     nine seconds for a wrapped page — and short enough that the two dead ones
     measured above cost twenty seconds between them rather than a minute. */
  var PROXY_TIMEOUT = 11000;

  /* The submission relay can read a store page as well as it can open an issue,
     and unlike the public proxies it is ours, so it goes first whenever one is
     configured. The public list stays behind it: if the relay is not deployed
     yet, or its daily quota runs out, the import still works. */
  function proxyOrder() {
    var list = config.proxies;
    if (config.submitEndpoint) {
      list = [config.submitEndpoint + "?action=fetch&url={url}"].concat(list);
    }
    if (!lastGoodProxy) return list;
    return [lastGoodProxy].concat(list.filter(function (p) { return p !== lastGoodProxy; }));
  }

  /* One of the proxies — r.jina.ai, and for a while the only one still up —
     does not return the page. It returns the page rewritten as Markdown, with a
     short header of its own. Every reader below expects HTML, so a page that
     arrived this way used to read as empty: no title, no og:image, no hrefs,
     and an import that found the games but knew nothing about them.

     Rather than teach four readers a second syntax, the Markdown is turned back
     into the handful of tags they look for. The signature is specific enough
     that a JSON body — Steam's appdetails comes through the same path — can
     never be mistaken for it. */
  /* allorigins' /get endpoint answers with the page wrapped in a JSON envelope
     rather than as itself. Unwrap it before anything downstream looks at it. A
     store's own JSON — Steam's appdetails comes through the same path — has no
     `contents` string, so it passes through untouched. */
  function unwrap(text) {
    if (text.charAt(0) !== "{" || text.indexOf('"contents"') < 0) return text;
    try {
      var o = JSON.parse(text);
      if (o && typeof o.contents === "string") return o.contents;
    } catch (e) {}
    return text;
  }

  function unmarkdown(text) {
    if (!/^\s*Title:[^\n]*\r?\n+URL Source:\s*http/i.test(text)) return text;
    var title = (/^\s*Title:[ \t]*(.+)$/im.exec(text) || [])[1] || "";
    var body = text.split(/Markdown Content:\s*/i)[1] || text;
    /* The same header is put in front of a JSON endpoint's response, and what
       follows it is not Markdown at all — it is the payload, verbatim. Rewriting
       that as if it were prose turned Steam's appdetails into a title tag and
       three links, and every game in a studio import failed to read. */
    if (/^\s*[{[]/.test(body)) return body;
    var image = (/!\[[^\]]*\]\((https?:\/\/[^)\s]+)/.exec(body) || [])[1] || "";
    /* The first run of prose that is not a link, an image, a price or a heading
       — which on every storefront tested is the short description. */
    var about = "";
    body.split(/\n{2,}/).some(function (block) {
      var t = block.replace(/\s+/g, " ").trim();
      if (t.length < 40) return false;
      if (/^[#>*\-|]/.test(t) || /^!?\[/.test(t) || /^\$?\d/.test(t)) return false;
      about = t.slice(0, 600);
      return true;
    });
    var links = [], seen = {}, re = /\]\((https?:\/\/[^)\s]+)\)/g, m;
    while ((m = re.exec(body))) {
      if (seen[m[1]]) continue;
      seen[m[1]] = 1;
      links.push('<a href="' + m[1] + '"></a>');
    }
    var esc = function (s) { return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;"); };
    return '<title>' + esc(title) + '</title>' +
      '<meta property="og:title" content="' + esc(title) + '">' +
      (about ? '<meta property="og:description" content="' + esc(about) + '">' : "") +
      (image ? '<meta property="og:image" content="' + esc(image) + '">' : "") +
      links.join("");
  }

  /* Pages already read in this tab. An import re-reads the same studio page for
     its profile, a retry re-reads the title that failed, and someone comparing
     two studios reads the first one again — every one of those is a request the
     shared public proxy does not have to spend on us. Cleared with the tab. */
  var pageCache = {};

  /* Whether the relay has actually answered a page request. Set the first time
     it does, and it decides how hard the importer is allowed to push: through
     our own relay six titles at once is nothing, while against a public proxy
     that allows about twenty requests a minute for everyone at once, a burst of
     six is most of the budget — and the rate limit reads, from the outside,
     exactly like the studio having no games. */
  var relayWorks = false;

  function fetchOnce(tpl, target, read) {
    var url = tpl.replace("{url}", encodeURIComponent(target)).replace("{raw}", target);
    var attempt = function (retryOn429) {
      // A hanging proxy is worse than a failing one; cut it off and move on.
      var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, PROXY_TIMEOUT) : null;
      /* r.jina.ai rewrites pages as Markdown unless asked otherwise, and the
         rewrite throws away exactly what the parsers need — og tags, image
         URLs, the studio's own links. One header gets the real markup back.
         It costs a preflight, which jina answers; unmarkdown below still
         covers the case where it does not honour the header. */
      var opts = { cache: "no-store", signal: ctl ? ctl.signal : undefined };
      /* …but not for an endpoint that answers with JSON. Asked for HTML, the
         proxy renders the JSON the way a browser would — wrapped in a page
         with the payload inside a <pre> — and Steam's appdetails came back
         unreadable. Left alone it returns the JSON as itself. */
      if (/^https:\/\/r\.jina\.ai\//.test(url) && !/\/api\/|appdetails|\.json/i.test(target)) {
        opts.headers = { "x-return-format": "html" };
      }
      return fetch(url, opts)
        .then(function (r) {
          /* 429 is the one status worth waiting out rather than walking past:
             it means this proxy works and is simply busy, and the alternatives
             are a relay that may not be deployed and two that answer nothing. */
          if (r.status === 429 && retryOn429) {
            if (timer) clearTimeout(timer);
            return new Promise(function (res) { setTimeout(res, 2500); })
              .then(function () { return attempt(false); });
          }
          if (!r.ok) throw new Error("proxy " + r.status);
          return r.text().then(function (text) {
            var out = read(unmarkdown(unwrap(text)));
            lastGoodProxy = tpl;
            if (config.submitEndpoint && tpl.indexOf(config.submitEndpoint) === 0) relayWorks = true;
            pageCache[target] = text;
            return out;
          });
        })
        .then(function (v) { if (timer) clearTimeout(timer); return v; }, function (e) {
          if (timer) clearTimeout(timer);
          throw e;
        });
    };
    return attempt(true);
  }

  function fetchVia(target, read) {
    /* A page read once is read again from here, but still through `read`: the
       same bytes can be wanted as a game one moment and as a studio profile the
       next, and only the caller knows which. */
    if (pageCache[target]) {
      try { return Promise.resolve(read(unmarkdown(unwrap(pageCache[target])))); } catch (e) {}
    }
    return proxyOrder().reduce(function (chain, tpl) {
      return chain.catch(function () { return fetchOnce(tpl, target, read); });
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
    /* A proxy can hand back the JSON dressed as a web page — the browser's own
       JSON viewer, markup and entities and all. The payload is still in there;
       undress it and try once more. */
    if (/^\s*</.test(txt)) {
      var bare = txt
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&quot;/g, '"').replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(n); })
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      var a = bare.indexOf("{"), b = bare.lastIndexOf("}");
      if (a >= 0 && b > a) {
        try { return JSON.parse(bare.slice(a, b + 1)); } catch (e3) {}
      }
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
      website: d.website || "",
      developers: d.developers || [],
      publishers: d.publishers || [],
      art: steamArt(d),
      platforms: ["Steam"],
      stores: { steam: url || ("https://store.steampowered.com/app/" + appid + "/") },
      mobile: false,
      type: d.type || "game",
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
        /* Every store appends its own name to the title — "X - Apps on Google
           Play", "X on Steam", "X by studio" on itch. None of that is the
           game's name, and left in it becomes the name in the catalogue. */
        name: title
          .replace(/\s*[-–—|]\s*(Apps|Games) on Google Play\s*$/i, "")
          .replace(/\s+on (Steam|the App Store)\s*$/i, "")
          .replace(/\s*[-–—|]\s*itch\.io\s*$/i, "")
          .replace(/\s+by\s+[^|]*$/i, "")
          .trim(),
        about: meta("og:description") || meta("description") || "",
        art: { capsule: img, hero: img, portrait: "" },
        genres: [], platforms: [], stores: {}, source: "og"
      };
      Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
      return out;
    });
  }

  /* ------------------------------------------------------------- app store */

  /* The App Store is the exception to scraping. A developer page —
     apps.apple.com/…/developer/…/id123 — is served as a two-kilobyte JavaScript
     shell with no apps in it, so no proxy and no parser can find a catalogue
     there. Apple publishes the same data as JSON through the iTunes lookup
     endpoint, which answers cross-origin requests directly: no proxy chain, and
     records richer than the og tags ever were — screenshots, genres, languages,
     release dates and the developer's own site. */
  function appleJson(query) {
    var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, PROXY_TIMEOUT) : null;
    return fetch("https://itunes.apple.com/" + query, {
      cache: "no-store", signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      if (timer) clearTimeout(timer);
      if (!r.ok) throw new Error("apple " + r.status);
      return r.json();
    }, function (e) {
      if (timer) clearTimeout(timer);
      throw e;
    }).then(function (j) { return (j && j.results) || []; });
  }

  /* One App Store record in the shape the rest of the site speaks. */
  function appleGame(r) {
    var date = String(r.releaseDate || "").slice(0, 10);
    var art = r.artworkUrl512 || r.artworkUrl100 || "";
    var shots = (r.screenshotUrls || []).concat(r.ipadScreenshotUrls || []).slice(0, 6);
    return {
      name: String(r.trackName || "").trim(),
      about: String(r.description || "").replace(/<[^>]+>/g, "").trim(),
      genres: (r.genres || [])
        .filter(function (g) { return !/^games$/i.test(g); })
        .map(function (g) { return String(g).toLowerCase(); }),
      status: date && date > new Date().toISOString().slice(0, 10) ? "upcoming" : "released",
      releaseDate: date,
      year: Number(date.slice(0, 4)) || 0,
      price: r.formattedPrice || "",
      langs: (r.languageCodesISO2A || []).join(", "),
      website: r.sellerUrl || "",
      developers: r.artistName ? [r.artistName] : [],
      publishers: [],
      art: { capsule: art, hero: shots[0] || art, portrait: art, shots: shots },
      platforms: ["App Store"],
      stores: { appstore: String(r.trackViewUrl || "").split("?")[0] },
      mobile: true,
      /* Apple files everything under "software"; only the games category tells
         a game from a utility, and the catalogue has no room for utilities. */
      type: /game/i.test(r.primaryGenreName || "") || (r.genreIds || []).indexOf("6014") >= 0
        ? "game" : "app",
      source: "appstore"
    };
  }

  /* Every title by one developer, plus the developer's own details, from a
     single lookup. Returns the same shape as parseStudio's other branches so
     the wizard and the admin panel cannot tell the two apart. */
  function appleStudio(d, onProgress) {
    return appleJson("lookup?id=" + d.id + "&entity=software&limit=200&country=us")
      .then(function (rows) {
        var apps = rows.filter(function (r) { return r.wrapperType === "software" || r.trackId; });
        var games = [], skipped = 0, name = "", website = "";
        apps.forEach(function (r) {
          if (!name && r.artistName) name = r.artistName;
          if (!website && r.sellerUrl) website = r.sellerUrl;
          var g = appleGame(r);
          if (g.type !== "game") { skipped++; return; }
          games.push(g);
          if (onProgress) onProgress(games.length + skipped, apps.length, g.name);
        });
        /* The lookup's first row is the artist itself when Apple has one, and
           it carries the name even for a developer whose apps are all filtered
           out. Worth reading before falling back to the app credits. */
        rows.forEach(function (r) {
          if (r.wrapperType === "artist" && r.artistName) name = r.artistName;
        });
        return {
          source: "appstore",
          found: apps.length,
          skipped: skipped,
          games: games,
          profile: {
            name: name,
            website: website,
            /* An App Store developer has no picture of its own — Apple never
               publishes one — so nothing is guessed here. The uploader in the
               form is the honest answer. */
            logo: "",
            links: { appstore: d.url }
          },
          reason: games.length ? "" : (apps.length
            ? "ამ დეველოპერს App Store-ზე თამაშები არ აქვს — მხოლოდ აპლიკაციები."
            : "ამ დეველოპერის გვერდზე არაფერი მოიძებნა.")
        };
      });
  }

  /* ------------------------------------------------- whole-studio discovery */

  /* A studio page rather than a game page: Steam publisher/developer/curator
     pages, an itch.io profile, an App Store developer page, a Google Play
     developer listing. Recognised separately from parseStore, which expects a
     single title. */
  function detectStudio(url) {
    var u = String(url || "").trim();
    if (!u) return null;
    var bare = u.replace(/^https?:\/\//, "");
    var m;
    if ((m = /store\.steampowered\.com\/(publisher|developer|curator|franchise)\/([^/?#]+)/i.exec(u))) {
      /* A Steam publisher page renders its catalogue with JavaScript, so the
         HTML we can fetch lists only part of it — MadMoa's showed one of two
         games. The store search for the same name returns the whole set in
         plain markup, so ask that first and keep the original as a fallback. */
      /* A studio is usually both the developer and the publisher of its titles,
         but the store indexes those separately and each list can be partial —
         MadMoa's developer search returned only the demo while the publisher
         search had both games. Ask all three and merge. */
      /* Three quirks, each of which alone loses titles:
         - the studio page renders its catalogue in JavaScript and exposes only
           part of it (MadMoa's showed the demo and not the game);
         - store search applies the visitor's content preferences by default,
           which hide unreleased titles — "&ndl=1" turns that off, and without
           it an upcoming game is simply missing;
         - publisher= and developer= match the name case-sensitively, so a
           lowercase URL slug finds nothing, while term= does not care.
         So: free-text search for the slug, both exact-role searches in case the
         slug happens to be correctly cased, and the page itself. Merged. */
      var slug = decodeURIComponent(m[2]);
      /* A curator page is addressed by a number, not a name. Searching the store
         for "45881856" finds nothing, and matching titles against it as if it
         were a studio name rejects every one of them — which is what made a
         curator page report "only demos found" for a real game. So when the id
         is not name-like, read the page itself and trust what is on it. */
      var byName = /[a-z]/i.test(slug);
      if (!byName) return { kind: "steam", id: "", url: u, listUrls: [u] };
      var pretty = encodeURIComponent(slug.replace(/[-_]+/g, " "));
      var q = "&ndl=1&ignore_preferences=1";
      return {
        kind: "steam", id: slug, url: u,
        listUrls: [
          "https://store.steampowered.com/search/?term=" + encodeURIComponent(slug) + q,
          "https://store.steampowered.com/search/?publisher=" + pretty + q,
          "https://store.steampowered.com/search/?developer=" + pretty + q,
          u
        ]
      };
    }
    if (/store\.steampowered\.com\/search\/?\?.*(publisher|developer)=/i.test(u)) {
      return { kind: "steam", id: "", url: u, listUrls: [u] };
    }
    if ((m = /^([\w-]+)\.itch\.io\/?$/i.exec(bare.split("?")[0]))) {
      return { kind: "itch", id: m[1], url: "https://" + m[1] + ".itch.io" };
    }
    if ((m = /apps\.apple\.com\/[^"'\s]*?\/developer\/[^/]*\/id(\d+)/i.exec(u))) {
      return { kind: "appstore", id: m[1], url: u };
    }
    if (/play\.google\.com\/store\/apps\/dev(eloper)?\?/i.test(u)) return { kind: "googleplay", id: "", url: u };
    return null;
  }

  /* A studio page also carries the studio's own details — its name, its site and
     whichever socials it links. Worth harvesting in the same pass: it is the
     difference between an import that fills the games and one that fills the
     profile too. Only keys the page actually links are returned. */
  function studioProfile(html, kind) {
    var out = { links: {} };
    /* Steam's studio pages are a JavaScript shell — no og:title, no og:image,
       not even a <title> in the HTML that can be fetched. The partner avatar is
       one of the few real things in it; the studio's name and site come from
       its games instead, which parseStudio fills in afterwards. */
    var avatar = /https?:\/\/avatars[^"'\s]*?_full\.(?:jpg|png)/i.exec(html);
    var og = function (prop) {
      var re = new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]*content=["\']([^"\']+)', "i");
      var hit = re.exec(html);
      return hit ? hit[1] : "";
    };
    /* Google Play's developer page carries the studio's own mark as og:image.
       Nowhere else does: on an itch profile the same tag is the first game's
       cover, and filing that as the studio's logo is worse than filing none —
       so only Play is trusted for it, and Steam's partner avatar wins outright.
       itch and the App Store publish no studio picture at all; the uploader in
       the form is the honest answer there. */
    if (avatar) out.logo = avatar[0];
    else if (kind === "googleplay" && og("og:image")) out.logo = og("og:image");
    var m = og("og:title") || (/<title[^>]*>([^<]+)/i.exec(html) || [])[1] || "";
    if (m) {
      /* Each store wraps the studio's name in its own furniture: "Android Apps
         by X on Google Play", "X - itch.io", "Games by X". Strip the wrapper
         and what is left is the name — otherwise the profile arrives called
         "Mtatsminda Studio - itch.io". */
      out.name = m
        .replace(/^\s*(Android\s+)?(Apps|Games)\s+by\s+/i, "")
        .replace(/^\s*Steam\s+(Curator|Publisher|Developer|Franchise):\s*/i, "")
        .replace(/\s*(on Steam|on Google Play|on the App Store|Steam Search|itch\.io|·.*)\s*$/i, "")
        .replace(/[\s·|,\-–—]+$/, "")
        .trim();
    }
    var patterns = [
      ["facebook", /https?:\/\/(?:www\.)?facebook\.com\/[\w.\-/]+/i],
      ["instagram", /https?:\/\/(?:www\.)?instagram\.com\/[\w.\-]+/i],
      ["x", /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/[\w.\-]+/i],
      ["youtube", /https?:\/\/(?:www\.)?youtube\.com\/(?:@|c\/|channel\/|user\/)[\w.\-]+/i],
      ["linkedin", /https?:\/\/(?:www\.)?linkedin\.com\/company\/[\w.\-]+/i],
      ["discord", /https?:\/\/discord\.(?:gg|com\/invite)\/[\w.\-]+/i],
      ["tiktok", /https?:\/\/(?:www\.)?tiktok\.com\/@[\w.\-]+/i],
      ["twitch", /https?:\/\/(?:www\.)?twitch\.tv\/[\w.\-]+/i],
      ["itch", /https?:\/\/[\w-]+\.itch\.io\/?/i]
    ];
    /* A storefront page links the storefront's own accounts in its chrome —
       scraping naively wrote facebook.com/steam onto a Georgian studio. Anything
       whose handle belongs to the store itself is not the studio's. */
    var STORE_OWNED = /\/@?(steam|steamgames|steamdb|valve|steamworks|nintendo|nintendoamerica|xbox|playstation|itchio|itchdotio|googleplay|appstore|apple|epicgames|google|googleworkspace|android|youtube|chrome)\/?$/i;
    // itch's own asset hosts wear the same shape as a studio's itch page.
    var ITCH_OWN = /^https?:\/\/(static|img|www|help|blog|api)\.itch\.io/i;
    /* Only Steam and itch let a studio put its own links on its page. A Google
       Play developer page has no such section — every social link in it belongs
       to Google's own footer, and scraping them filed facebook.com/googleworkspace
       as the studio's Facebook. Better no link than someone else's. */
    if (kind === "googleplay" || kind === "appstore") patterns = [];
    patterns.forEach(function (p) {
      var hit = p[1].exec(html);
      if (!hit) return;
      var link = hit[0].replace(/[)"'<].*$/, "");
      if (STORE_OWNED.test(link) || ITCH_OWN.test(link)) return;
      out.links[p[0]] = link;
    });
    /* A plain site link. Every store page is full of hrefs that are not the
       studio's site — the store's own domains, its CDNs, the stylesheet in the
       head — and taking the first one wrote static.itch.io/user.css into the
       website field. Walk them and keep the first that is neither the store's
       nor a file. */
    var NOT_MINE = [
      "steampowered.com", "steamcommunity.com", "steamstatic.com", "valvesoftware.com",
      "akamaized.net", "akamai.net", "itch.io", "itch.zone", "google.com", "googleusercontent.com",
      "android.com", "googleblog.com", "chrome.com", "gstatic.com", "goo.gl",
      "apple.com", "mzstatic.com", "facebook.com", "fbcdn.net",
      "instagram.com", "twitter.com", "x.com", "t.co", "youtube.com", "youtu.be",
      "linkedin.com", "discord.com", "discord.gg", "tiktok.com", "twitch.tv", "bsky.app",
      "bsky.social", "reddit.com", "patreon.com", "kickstarter.com", "paypal.com",
      "amazon.com", "microsoft.com", "xbox.com", "playstation.com", "nintendo.com",
      "epicgames.com", "unrealengine.com", "unity.com", "w3.org", "schema.org",
      "creativecommons.org", "gnu.org"
    ];
    var ASSET = /\.(css|js|json|png|jpe?g|gif|svg|webp|ico|xml|rss|pdf|mp4|woff2?)(\?|$)/i;
    var href = /href=["'](https?:\/\/[^"'\s]+)["']/gi, h;
    while ((h = href.exec(html))) {
      var link = h[1];
      var host = (/^https?:\/\/([^/:?#]+)/i.exec(link) || [])[1];
      if (!host) continue;
      host = host.toLowerCase();
      var theirs = NOT_MINE.some(function (dom) {
        return host === dom || host.slice(-(dom.length + 1)) === "." + dom;
      });
      if (theirs || ASSET.test(link)) continue;
      out.website = link;
      break;
    }
    /* A proxy that hands back prose instead of a page leaves this with nothing
       at all. Saying so lets the next proxy have a turn — returning an empty
       profile would instead be accepted as the truth, and the studio would end
       up imported with no name, no site and no socials. */
    if (!out.name && !out.logo && !out.website && !Object.keys(out.links).length) {
      throw new Error("ამ გვერდიდან სტუდიის მონაცემები ვერ წაიკითხა");
    }
    return out;
  }

  /* Pulls every title's own page URL out of a studio page. Each one is then read
     by the normal single-game parser, so a bulk import and a hand-pasted link
     produce exactly the same record. */
  function studioGameUrls(html, d) {
    var kind = typeof d === "string" ? d : d.kind;
    var owner = typeof d === "string" ? "" : String(d.id || "");
    var urls = [], seen = {}, m, re;
    if (kind === "steam") {
      // Search results carry the appid in an attribute rather than a link.
      var push = function (id) {
        if (!id || seen[id]) return;
        seen[id] = 1;
        urls.push("https://store.steampowered.com/app/" + id + "/");
      };
      re = /data-ds-appid="([\d,]+)"/gi;
      while ((m = re.exec(html))) m[1].split(",").forEach(push);
      re = /store\.steampowered\.com\/app\/(\d+)/gi;
      while ((m = re.exec(html))) push(m[1]);
    } else if (kind === "itch") {
      /* Every itch page links itch's own asset hosts — static.itch.io/lib,
         static.itch.io/react — in the same shape a game link has, and a profile
         also links games by other people it has collaborated with. Only pages
         under this studio's own subdomain are this studio's games. */
      re = /https?:\/\/([\w-]+)\.itch\.io\/([\w-]+)/gi;
      while ((m = re.exec(html))) {
        if (owner ? m[1].toLowerCase() !== owner.toLowerCase()
          : /^(static|img|itch|www|help|blog|api)$/i.test(m[1])) continue;
        var u = "https://" + m[1] + ".itch.io/" + m[2];
        if (seen[u]) continue;
        seen[u] = 1;
        urls.push(u);
      }
    } else if (kind === "appstore") {
      re = /apps\.apple\.com\/[^"'\s]*?\/id(\d+)/gi;
      while ((m = re.exec(html))) {
        if (seen[m[1]]) continue;
        seen[m[1]] = 1;
        urls.push("https://apps.apple.com/us/app/id" + m[1]);
      }
    } else if (kind === "googleplay") {
      re = /\/store\/apps\/details\?id=([\w.]+)/gi;
      while ((m = re.exec(html))) {
        if (seen[m[1]]) continue;
        seen[m[1]] = 1;
        urls.push("https://play.google.com/store/apps/details?id=" + m[1]);
      }
    }
    return urls;
  }

  /* Reads a studio page and then every game on it. `onProgress(done, total,
     name)` is called as each title lands, because this is slow enough that a
     silent wait reads as a hang. */
  function parseStudio(url, onProgress) {
    var d = detectStudio(url);
    if (!d) return Promise.reject(new Error("ეს სტუდიის გვერდი არ არის"));
    /* An App Store developer page has no catalogue in its HTML at all, so the
       usual read-the-page-then-read-each-game route cannot work. One lookup
       returns the developer and every title at once — which also makes this the
       fastest of the four imports rather than the only broken one. */
    if (d.kind === "appstore" && d.id) return appleStudio(d, onProgress);
    var candidates = d.listUrls || [d.url];
    var profile = null;
    /* Steam indexes a studio four ways — a name search, a publisher search, a
       developer search, and the page itself — and each can be partial, so all
       four used to be asked at once and merged. That was affordable when there
       were four proxies. With one, and it rate-limited, firing four requests
       for a studio whose first answer was already complete is what turned a
       three second import into nearly two minutes.

       So they are asked in order, and the asking stops as soon as one returns
       a catalogue. The name search comes first because it is the one that has
       never come back empty; the rest are still there for when it does. */
    var lists = [];
    var askNext = function (i) {
      if (i >= candidates.length || lists.length) return Promise.resolve();
      return ask(candidates[i]).then(function (found) {
        if (found.length) lists.push(found);
        return askNext(i + 1);
      });
    };
    function ask(listUrl) {
      return fetchVia(listUrl, function (html) {
        var found = studioGameUrls(html, d);
        // A search-results page is the storefront's own chrome, not the
        // studio's page — only the studio's own page describes the studio.
        if (!profile && found.length && !/\/search\/?\?/i.test(listUrl)) {
          // Games in hand are worth more than the profile: if the page cannot
          // describe the studio, keep the list and ask for the profile again
          // separately rather than discarding both.
          try { profile = studioProfile(html, d.kind); } catch (e) {}
        }
        /* An answer with no games in it is not an answer. A proxy that is up
           but hands back its own error page, or a status note, reads as a page
           with an empty catalogue — and being accepted, it ended the search
           before the proxies that would have returned the real page were
           tried. A genuinely empty studio page costs one extra round of
           attempts and still lands on the empty list below. */
        if (!found.length) throw new Error("ამ გვერდზე თამაშები ვერ მოიძებნა");
        return found;
      }).catch(function () { return []; });
    }
    return askNext(0).then(function () {
      var seen = {}, urls = [];
      lists.forEach(function (l) {
        l.forEach(function (u) {
          if (seen[u]) return;
          seen[u] = 1;
          urls.push(u);
        });
      });
      /* The studio's own page is what describes the studio, and it is worth a
         request of its own: the listings that find the games are often store
         searches, which describe the store. Without this the profile was only
         picked up by accident, when the studio page happened to be the listing
         that worked. */
      if (profile) return urls;
      return fetchVia(d.url, function (html) { return studioProfile(html, d.kind); })
        .then(function (p) { profile = p; return urls; }, function () { return urls; });
    }).then(function (urls) {
      if (!urls.length && !profile) throw new Error("ამ გვერდზე არაფერი მოიძებნა");
      var out = [], done = 0;
      var list = urls.slice(0, 40);
      /* Read several titles at once. One at a time made the import cost the sum
         of every proxy round trip — minutes for a studio with a handful of
         games — when it only ever needed the slowest of each batch. Four lanes
         collapse that without hammering the storefront. */
      var next = 0;
      function worker() {
        if (next >= list.length) return Promise.resolve();
        var u = list[next++];
        // One retry: a single proxy hiccup should not drop a title from the
        // catalogue and leave the whole import looking like it failed.
        return parseStore(u)
          .catch(function () { return parseStore(u); })
          .then(function (g) { out.push(g); }, function () {})
          .then(function () {
            done++;
            if (onProgress) onProgress(done, list.length, out.length ? out[out.length - 1].name : "");
            return worker();
          });
      }
      /* How many lanes depends on who is answering. Through our own relay six
         is nothing. Against the one public proxy still standing — about twenty
         requests a minute, shared with everyone else using it — a burst of six
         spends the budget and comes back rate-limited, which looks from here
         like a studio with no games. Two lanes is slower and finishes. */
      var lanes = [];
      var width = Math.min(relayWorks ? 6 : 2, list.length);
      for (var i = 0; i < width; i++) lanes.push(worker());
      return Promise.all(lanes).then(function () {
        // A studio page also lists demos, soundtracks and DLC. Those are not
        // catalogue entries — importing them would file "… Demo" as its own game.
        /* A free-text search can surface titles by other studios, so keep only
           those the store itself credits to this one. Compared with everything
           but letters and digits stripped, since "team-cherry" in a URL is
           "Team Cherry" on the page. */
        var want = String(d.id || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        var byThisStudio = function (g) {
          if (!want) return true;
          var credits = (g.developers || []).concat(g.publishers || []).join(" ")
            .toLowerCase().replace(/[^a-z0-9]/g, "");
          // No credits at all means a non-Steam source, which was not searched.
          return !credits || credits.indexOf(want) >= 0;
        };
        var games = out.filter(function (g) {
          if (g.type && g.type !== "game") return false;
          if (!byThisStudio(g)) return false;
          return !/\bdemo\b|\bplaytest\b|soundtrack|\bost\b/i.test(g.name || "");
        });
        /* Never throw for an empty game list. The studio's own details were read
           from the same page and are worth keeping even when no title could be:
           losing the name, site and socials because a storefront request failed
           is the wrong trade. The caller is told why the list is empty. */
        var reason = "";
        if (!games.length) {
          reason = !out.length
            ? ("გვერდზე " + list.length + " თამაში მოიძებნა, მაგრამ ვერცერთი ვერ წაიკითხა — " +
               "მაღაზია ახლა დაკავებულია, სცადე ერთ წუთში.")
            : "მხოლოდ დემო/DLC მოიძებნა — სრული თამაში ამ გვერდზე არ არის.";
        }
        /* The page that was pasted is itself the studio's store link — worth
           keeping on the record rather than making someone paste it twice. */
        var prof = profile || { links: {} };
        prof.links = prof.links || {};
        if (!prof.links[d.kind]) prof.links[d.kind] = d.url;

        /* The studio page could not tell us its own name, but every game it
           published names it. Take the credit that appears on the most titles,
           and the first official site any of them lists. */
        if (!prof.name) {
          var tally = {};
          games.forEach(function (g) {
            (g.developers || []).concat(g.publishers || []).forEach(function (n) {
              if (n) tally[n] = (tally[n] || 0) + 1;
            });
          });
          var best = "";
          Object.keys(tally).forEach(function (n) {
            if (!best || tally[n] > tally[best]) best = n;
          });
          if (best) prof.name = best;
        }
        if (!prof.website) {
          for (var i = 0; i < games.length; i++) {
            if (games[i].website) { prof.website = games[i].website; break; }
          }
        }
        return {
          source: d.kind, found: list.length, skipped: out.length - games.length,
          games: games, profile: prof, reason: reason
        };
      });
    });
  }

  function parseStore(url) {
    var d = detect(url);
    if (!d) return Promise.reject(new Error("ცარიელი ბმული"));
    if (d.kind === "steam") return parseSteam(d.id, d.url);
    if (d.kind === "itch") return parseOG(d.url, { platforms: ["itch.io"], stores: { itch: d.url }, source: "itch" });
    if (d.kind === "appstore") {
      return appleJson("lookup?id=" + d.id + "&country=us").then(function (rows) {
        if (!rows.length) throw new Error("empty");
        return appleGame(rows[0]);
      }).catch(function () {
        return parseOG(d.url, { platforms: ["App Store"], stores: { appstore: d.url }, mobile: true, source: "appstore" });
      });
    }
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
      var a = current ? current[k] : undefined;
      var label = (labels && labels[k]) || k;

      /* Social links and store URLs arrive as a whole object every time. Compared
         as one blob they always look different — a reordered key or a single
         added link reported all of them as changed. Compare entry by entry so
         only what actually moved is shown. */
      if (b && typeof b === "object" && !Array.isArray(b)) {
        var cur = (a && typeof a === "object") ? a : {};
        Object.keys(b).forEach(function (kk) {
          var bv = b[kk];
          if (bv === undefined || bv === null || bv === "") return;
          var sa2 = fmtVal(cur[kk]);
          var sb2 = fmtVal(bv);
          if (sa2 === sb2) return;
          out.push({
            key: k + "." + kk,
            k: label + " · " + (SOC[kk] || STORE_LABEL[kk] || kk),
            old: sa2 || "—",
            "new": sb2
          });
        });
        return;
      }

      var sa = fmtVal(a);
      var sb = fmtVal(b);
      if (sa === sb || sb === "") return;
      out.push({ key: k, k: label, old: sa || "—", "new": sb });
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
    stores: {
      detect: detect, parse: parseStore, steamFromJson: steamFromJson,
      viaProxy: viaProxy, fetchVia: fetchVia, jsonFrom: jsonFrom,
      detectStudio: detectStudio, parseStudio: parseStudio, studioGameUrls: studioGameUrls
    },
    submit: { diff: diff, deliver: deliver, issueUrl: issueUrl, payloadToIssue: payloadToIssue, fmtVal: fmtVal }
  };
})();

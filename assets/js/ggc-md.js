/* GGC markdown — a post's text, turned into the page.
   Loaded by news.html and by admin.html for the editor's live preview, so what
   an admin sees while writing is exactly what a reader gets. Plain script, no
   build step. window.GGCMarkdown = { render, plain, excerpt, words, minutes, video }

   The output is React elements, never an HTML string: every piece of text is
   escaped by React itself and every address is checked before it becomes an
   href or a src. However a post is written, it cannot put a script on the
   public site.

   It reads ordinary markdown — what a README on GitHub renders — plus the few
   things a news post keeps needing, each written so that the file still reads
   sensibly on GitHub:

     ![caption](images/news/x.jpg)          a picture with its caption;
                                            several in one paragraph, a gallery
     https://youtu.be/…      (own line)     a video
     <iframe src="…">        (own line)     embed code as the service gives it:
                                            a video, or a widget from FRAMES
     [Name](games.html#id)   (own line)     a card for a game in the catalogue
     [Name](companies.html#id) (own line)   …or for a studio
     [Register](https://… "button")         a button
     > [!NOTE] · [!TIP] · [!WARNING] · [!CAUTION]
                                            a coloured box — GitHub's own syntax
     ---                                    the four-colour divider             */
(function () {
  "use strict";

  // The page runtime can evaluate a script twice; the first build stands.
  if (window.GGCMarkdown) return;

  // React arrives after this file has run, so it is looked up when used.
  function h() { var R = window.React; return R.createElement.apply(R, arguments); }
  function frag(key, kids) { return h(window.React.Fragment, { key: key }, kids); }

  /* ------------------------------------------------------------- addresses */

  /* Web, mail and phone links, and anything relative to the site. Every other
     scheme — javascript:, data:, vbscript: — is refused, including when it has
     been broken up with spaces or control characters the browser would strip. */
  function safeHref(u) {
    var s = String(u || "").trim();
    var probe = s.replace(/[\u0000-\u0020\u007f-\u009f]+/g, "").toLowerCase();
    if (!probe) return "";
    if (/^(https?:|mailto:|tel:)/.test(probe)) return s;
    if (/^[a-z][a-z0-9+.\-]*:/.test(probe)) return "";
    return s;
  }
  function safeSrc(u) {
    var s = safeHref(u);
    return s && !/^(mailto:|tel:)/i.test(s) ? s : "";
  }
  function siteHost() {
    try { return new URL(window.GGC.config.site).host.toLowerCase(); } catch (e) { return ""; }
  }
  function ours(u) {
    var m = /^https?:\/\/([^/?#]+)/i.exec(u);
    if (!m) return true;
    var host = m[1].toLowerCase();
    return host === location.host.toLowerCase() || host === siteHost();
  }
  function cssUrl(u) { return 'url("' + String(u).replace(/["\\]/g, "\\$&") + '")'; }

  /* ---------------------------------------------------------------- blocks */

  var FENCE = /^\s{0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/;
  var HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
  var HR = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
  var QUOTE = /^\s{0,3}>\s?/;
  var LIST = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
  var TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
  var ALERT = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i;
  // Embed code as YouTube, Steam, itch.io and the rest hand it out.
  var IFRAME = /^\s{0,3}<iframe\b/i;

  function parse(src) {
    return blocksOf(String(src || "").replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n"));
  }

  function isTableAt(lines, i) {
    return lines[i].indexOf("|") >= 0 && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1]);
  }

  function blocksOf(lines) {
    var out = [], i = 0, n = lines.length, m;
    while (i < n) {
      var line = lines[i];
      if (!line.trim()) { i++; continue; }

      if ((m = FENCE.exec(line))) {
        var close = new RegExp("^\\s{0,3}" + (m[1][0] === "`" ? "`" : "~") + "{" + m[1].length + ",}\\s*$");
        var code = [];
        for (i++; i < n && !close.test(lines[i]); i++) code.push(lines[i]);
        i++;
        out.push({ t: "code", lang: m[2], text: code.join("\n") });
        continue;
      }
      if ((m = HEADING.exec(line))) {
        // The post's title is the page's h1, so a heading in the text starts at h2.
        out.push({ t: "h", level: Math.max(2, Math.min(4, m[1].length)), text: m[2] });
        i++;
        continue;
      }
      if (HR.test(line)) { out.push({ t: "hr" }); i++; continue; }
      /* Pasted embed code stands on its own whatever is around it. A post
         copied in from a document has no blank lines, so the code sat between
         two lines of text — read as part of that paragraph, it was printed on
         the page as code. Most services write it on one line; when one breaks
         the opening tag over several, they are gathered up first. */
      if (IFRAME.test(line)) {
        var code = line;
        while (!/<iframe\b[^>]*>/i.test(code) && i + 1 < n && lines[i + 1].trim() && code.length < 8000) code += " " + lines[++i];
        if (!/<\/iframe\s*>/i.test(code) && i + 1 < n && /^\s*<\/iframe\s*>\s*$/i.test(lines[i + 1])) i++;
        i++;
        out.push(embedBlock(code));
        continue;
      }
      if (QUOTE.test(line)) {
        var q = [];
        while (i < n && lines[i].trim() && QUOTE.test(lines[i])) q.push(lines[i++].replace(QUOTE, ""));
        var am = ALERT.exec(q[0] || "");
        if (am) {
          var body = q.slice(1);
          if (am[2]) body.unshift(am[2]);
          out.push({ t: "callout", kind: am[1].toLowerCase(), children: blocksOf(body) });
        } else {
          out.push({ t: "quote", children: blocksOf(q) });
        }
        continue;
      }
      if (isTableAt(lines, i)) {
        var head = cells(line);
        var aligns = cells(lines[i + 1]).map(function (c) {
          return /^:-+:$/.test(c) ? "center" : /-:$/.test(c) ? "right" : /^:-/.test(c) ? "left" : "";
        });
        var rows = [];
        for (i += 2; i < n && lines[i].trim() && lines[i].indexOf("|") >= 0; i++) rows.push(cells(lines[i]));
        out.push({ t: "table", head: head, aligns: aligns, rows: rows });
        continue;
      }
      if ((m = LIST.exec(line))) {
        var res = list(lines, i, m[1].length);
        out.push(res.block);
        i = res.next;
        continue;
      }

      var para = [line];
      for (i++; i < n && lines[i].trim(); i++) {
        var l = lines[i];
        if (FENCE.test(l) || HEADING.test(l) || HR.test(l) || QUOTE.test(l) || IFRAME.test(l) || isTableAt(lines, i)) break;
        /* A list may start straight under a line of text, but only with a
           bullet or a "1." — otherwise a sentence that happens to begin
           "2019. …" on a new line would turn into a numbered list. */
        var lm = LIST.exec(l);
        if (lm && (/^[-*+]$/.test(lm[2]) || /^1[.)]$/.test(lm[2]))) break;
        para.push(l);
      }
      out.push(paragraph(para));
    }
    return out;
  }

  function cells(line) {
    var s = line.trim().replace(/^\|/, "").replace(/\|$/, "");
    var out = [], cur = "", code = false;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (c === "\\" && s.charAt(i + 1) === "|") { cur += "|"; i++; continue; }
      if (c === "`") code = !code;
      if (c === "|" && !code) { out.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    out.push(cur.trim());
    return out;
  }

  /* Items at one indent; a deeper marker opens a list inside the last item, a
     shallower one hands back to the list that contains this one. A blank line
     ends the list unless the list carries on after it. */
  function list(lines, i, indent) {
    var first = LIST.exec(lines[i]);
    var ordered = /\d/.test(first[2]);
    var block = { t: "list", ordered: ordered, start: ordered ? parseInt(first[2], 10) : 1, items: [] };
    var items = block.items, n = lines.length;
    while (i < n) {
      var line = lines[i];
      if (!line.trim()) {
        var j = i + 1;
        while (j < n && !lines[j].trim()) j++;
        var nm = j < n ? LIST.exec(lines[j]) : null;
        if (nm && nm[1].length > indent) { i = j; continue; }
        if (nm && nm[1].length === indent && /\d/.test(nm[2]) === ordered) { i = j; continue; }
        // An indented paragraph after the gap still belongs to the item above it.
        if (j < n && items.length && !nm && /^\s+/.exec(lines[j]) && /^\s+/.exec(lines[j])[0].length > indent) {
          items[items.length - 1].lines.push("");
          i = j;
          continue;
        }
        break;
      }
      var m = LIST.exec(line);
      if (m) {
        var ind = m[1].length;
        if (ind < indent) break;
        if (ind > indent && items.length) {
          var sub = list(lines, i, ind);
          items[items.length - 1].sub.push(sub.block);
          i = sub.next;
          continue;
        }
        if (/\d/.test(m[2]) !== ordered) break;
        items.push({ lines: [m[3]], sub: [] });
        i++;
        continue;
      }
      // Embed code under a numbered item ends the list, so the video gets the whole width.
      if (!items.length || FENCE.test(line) || HEADING.test(line) || HR.test(line) || QUOTE.test(line) || IFRAME.test(line)) break;
      items[items.length - 1].lines.push(line.trim());
      i++;
    }
    return { block: block, next: i };
  }

  /* A paragraph that is nothing but pictures is a figure, or a gallery when
     there are several. A paragraph that is nothing but one link may be a video,
     a catalogue card or a button. Anything else is text. */
  function paragraph(lines) {
    var imgs = imagesOnly(lines);
    if (imgs) return imgs.length === 1 ? { t: "figure", img: imgs[0] } : { t: "gallery", imgs: imgs };
    if (lines.length === 1) {
      var only = soleLink(lines[0]);
      if (only) {
        var v = video(only.href);
        if (v) return { t: "video", video: v, title: only.text ? plainInline(only.text) : "" };
        var cat = catalogue(only.href);
        if (cat) return { t: "card", kind: cat.kind, id: cat.id, text: only.text, href: only.href };
        if (/^button$/i.test(only.title)) return { t: "button", text: only.text || only.href, href: only.href };
      }
    }
    return { t: "p", text: lines.join("\n").trim() };
  }

  function imagesOnly(lines) {
    var imgs = [];
    for (var li = 0; li < lines.length; li++) {
      var s = lines[li], i = 0;
      while (i < s.length) {
        if (/\s/.test(s.charAt(i))) { i++; continue; }
        if (s.charAt(i) !== "!" || s.charAt(i + 1) !== "[") return null;
        var m = linkAt(s, i + 1);
        if (!m) return null;
        imgs.push({ alt: plainInline(m.text), src: m.href, title: m.title });
        i = m.end;
      }
    }
    return imgs.length ? imgs : null;
  }

  function soleLink(s) {
    s = s.trim();
    if (/^<?https?:\/\/[^\s<>]+>?$/i.test(s)) return { href: s.replace(/^<|>$/g, ""), text: "", title: "" };
    if (s.charAt(0) === "[") {
      var m = linkAt(s, 0);
      if (m && m.end === s.length) return m;
    }
    return null;
  }

  /* YouTube in any of the shapes people paste it in — watch, youtu.be, shorts,
     live, embed — with its start time kept; and Vimeo. */
  function video(u) {
    u = String(u || "").trim();
    var m = /^(?:https?:)?\/\/(?:www\.|m\.|music\.)?(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i.exec(u);
    if (m) {
      var t = /[?&#](?:t|start)=([\dhms]+)/.exec(u), start = 0;
      if (t) {
        if (/^\d+$/.test(t[1])) start = Number(t[1]);
        else {
          var hh = /(\d+)h/.exec(t[1]), mm = /(\d+)m/.exec(t[1]), ss = /(\d+)s/.exec(t[1]);
          start = (hh ? hh[1] * 3600 : 0) + (mm ? mm[1] * 60 : 0) + (ss ? Number(ss[1]) : 0);
        }
      }
      return { kind: "youtube", id: m[1], start: start, vertical: /\/shorts\//i.test(u) };
    }
    /* An unlisted Vimeo video plays only with its hash — vimeo.com/<id>/<hash>,
       or ?h=<hash> in embed code — so it is kept along with the id. */
    var vm = /^(?:https?:)?\/\/(?:www\.)?(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]{6,}))?/i.exec(u);
    if (!vm) return null;
    var hash = vm[2] || ((/[?&]h=([0-9a-f]{6,})/i.exec(u) || [])[1]) || "";
    return { kind: "vimeo", id: vm[1], hash: hash, start: 0, vertical: false };
  }

  // A link to a game or a studio on this site, relative or absolute.
  function catalogue(u) {
    var m = /^(?:(?:https?:)?\/\/([^/?#]+))?\/?(?:\.\/)?(games|companies)\.html#([^\s#?]+)$/i.exec(String(u || "").trim());
    if (!m) return null;
    if (m[1] && m[1].toLowerCase() !== location.host.toLowerCase() && m[1].toLowerCase() !== siteHost()) return null;
    var id;
    try { id = decodeURIComponent(m[3]); } catch (e) { id = m[3]; }
    return { kind: m[2].toLowerCase() === "games" ? "game" : "studio", id: id };
  }

  /* ----------------------------------------------------------------- embeds */

  /* Services whose embed code is framed as it is: a host, the path its embeds
     live under — so a Google form can be framed but not any page Google serves
     — and how it is drawn. A player keeps the shape of its picture; a widget
     keeps the size its code asked for. YouTube and Vimeo are not here: they get
     the site's own lighter player instead. */
  var FRAMES = [
    ["player.twitch.tv", /^\//, "player"],
    ["clips.twitch.tv", /^\/embed/, "player"],
    ["www.facebook.com", /^\/plugins\/video\.php/, "player"],
    ["store.steampowered.com", /^\/widget\//, "widget"],
    ["itch.io", /^\/embed(-upload)?\//, "widget"],
    ["open.spotify.com", /^\/embed\//, "widget"],
    ["w.soundcloud.com", /^\/player\//, "widget"],
    ["bandcamp.com", /^\/EmbeddedPlayer\//, "widget"],
    ["discord.com", /^\/widget/, "widget"],
    ["docs.google.com", /^\/(forms|presentation|document|spreadsheets)\//, "widget"],
    ["www.google.com", /^\/maps\/embed/, "widget"]
  ];

  function framed(src) {
    var u;
    try { u = new URL(String(src || "").trim(), "https://invalid.invalid/"); } catch (e) { return null; }
    if (u.protocol !== "https:") return null;
    var host = u.hostname.toLowerCase();
    for (var i = 0; i < FRAMES.length; i++) {
      if (host === FRAMES[i][0] && FRAMES[i][1].test(u.pathname)) return { src: u.href, kind: FRAMES[i][2] };
    }
    return null;
  }

  // An embed's attribute values arrive HTML-escaped — "Saba &amp; Shele".
  function entities(s) {
    return String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, function (all, e) {
      e = e.toLowerCase();
      if (e.charAt(0) === "#") {
        var cp = e.charAt(1) === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : all;
      }
      return { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " }[e];
    });
  }
  function attrs(s) {
    var out = {}, re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g, m;
    while ((m = re.exec(s))) {
      out[m[1].toLowerCase()] = entities(m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : "");
    }
    return out;
  }
  // A size in pixels, or 0 when the code gives a percentage or nothing usable.
  function pixels(v) {
    var s = String(v || "").trim(), n = parseInt(s, 10);
    return /%/.test(s) || !(n > 0) ? 0 : Math.min(n, 3000);
  }

  /* Embed code — the <iframe> YouTube, Vimeo, Steam, itch.io and the rest hand
     out — pasted straight into a post. Nothing is taken from it but the
     address, the title and the size: a video becomes the site's own player, a
     service from the list above is framed at the size it asked for, and
     anything else becomes a plain link to where it points rather than a frame
     onto a page nobody has looked at. */
  function embedBlock(code) {
    var m = /<iframe\b([^>]*)>/i.exec(code);
    var a = m ? attrs(m[1]) : {};
    var src = String(a.src || "").trim(), title = String(a.title || "").trim();
    var v = video(src);
    if (v) return { t: "video", video: v, title: title };
    var f = framed(src);
    if (f) return { t: "frame", src: f.src, kind: f.kind, title: title, w: pixels(a.width), h: pixels(a.height) };
    if (/^https:\/\//i.test(src)) return { t: "elink", href: src, title: title };
    return { t: "p", text: String(code).trim() };
  }

  // The plain address of a video, for the editor to write in place of its code.
  function videoUrl(v) {
    if (v.kind === "vimeo") return "https://vimeo.com/" + v.id + (v.hash ? "/" + v.hash : "");
    if (v.vertical) return "https://www.youtube.com/shorts/" + v.id;
    return "https://www.youtube.com/watch?v=" + v.id + (v.start ? "&t=" + v.start + "s" : "");
  }

  /* What a piece of pasted text is, when it is embed code: a video (with the
     address it can be written as), a framed widget, or a link to somewhere
     that is not on the list. Null for anything that is not an <iframe>. */
  function embedOf(text) {
    var s = String(text || "").trim();
    if (!IFRAME.test(s) || !/<iframe\b[^>]*>/i.test(s)) return null;
    var b = embedBlock(s.replace(/\s*\n\s*/g, " "));
    if (b.t === "video") return { kind: "video", title: b.title, url: videoUrl(b.video) };
    if (b.t === "frame") return { kind: "frame", title: b.title, src: b.src, code: s.replace(/\s*\n\s*/g, " ") };
    if (b.t === "elink") return { kind: "link", title: b.title, src: b.href, code: s.replace(/\s*\n\s*/g, " ") };
    return null;
  }

  /* ---------------------------------------------------------------- inline */

  var ESCAPABLE = /[\\`*_{}\[\]()#+\-.!~|<>]/;
  var WORD = /[\p{L}\p{N}]/u;
  function isWord(c) { return !!c && WORD.test(c); }

  /* [text](href "title") starting at s[i] === "[". Brackets and parentheses
     nest, so "[a [b]](x)" and an address with "(game)" in it both read. Null
     when it turns out not to be a link. */
  function linkAt(s, i) {
    var depth = 0, j = i;
    for (; j < s.length; j++) {
      var c = s.charAt(j);
      if (c === "\\") { j++; continue; }
      if (c === "[") depth++;
      else if (c === "]" && --depth === 0) break;
    }
    if (j >= s.length || s.charAt(j + 1) !== "(") return null;
    var k = j + 2, pd = 1;
    for (; k < s.length; k++) {
      var d = s.charAt(k);
      if (d === "\\") { k++; continue; }
      if (d === "(") pd++;
      else if (d === ")" && --pd === 0) break;
    }
    if (k >= s.length) return null;
    var m = /^\s*<?([^\s>]*)>?(?:\s+(?:"([^"]*)"|'([^']*)'))?\s*$/.exec(s.slice(j + 2, k));
    if (!m) return null;
    return { text: s.slice(i + 1, j), href: m[1], title: m[2] || m[3] || "", end: k + 1 };
  }

  /* Where emphasis opened just before `from` closes: the next `mark` that
     follows something other than a space. Code spans are skipped whole, and
     inside a single * a ** belongs to a nested bold rather than to this. */
  function closer(s, from, mark) {
    if (!s.charAt(from) || /\s/.test(s.charAt(from))) return -1;
    for (var j = from + 1; j < s.length; j++) {
      var c = s.charAt(j);
      if (c === "\\") { j++; continue; }
      if (c === "`") {
        var e = s.indexOf("`", j + 1);
        if (e > j) { j = e; continue; }
      }
      if (s.substr(j, mark.length) !== mark) continue;
      // Checked before the space test, or the second star of a " **" would pass for a closer.
      if (mark.length === 1 && s.charAt(j + 1) === mark) { j++; continue; }
      if (/\s/.test(s.charAt(j - 1))) continue;
      if (mark.charAt(0) === "_" && isWord(s.charAt(j + mark.length))) continue;
      return j;
    }
    return -1;
  }

  function trimUrl(u) {
    u = u.replace(/[.,;:!?'"»…]+$/, "");
    while (u.charAt(u.length - 1) === ")" && u.split("(").length < u.split(")").length) u = u.slice(0, -1);
    return u.replace(/[.,;:!?'"»…]+$/, "");
  }

  function anchor(href, kids, title, key, cls) {
    var safe = safeHref(href);
    if (!safe) return frag(key, kids);
    var away = /^https?:\/\//i.test(safe) && !ours(safe);
    return h("a", {
      key: key, href: safe, className: cls, title: title || undefined,
      target: away ? "_blank" : undefined, rel: away ? "noopener" : undefined
    }, kids);
  }

  function inline(s, ctx, noLinks) {
    var out = [], buf = "", i = 0, n = 0, m, end;
    var flush = function () { if (buf) { out.push(buf); buf = ""; } };
    var put = function (el) { flush(); out.push(el); };
    var key = function (p) { return p + (n++); };
    s = String(s || "");
    while (i < s.length) {
      var c = s.charAt(i);
      if (c === "\\" && ESCAPABLE.test(s.charAt(i + 1))) { buf += s.charAt(i + 1); i += 2; continue; }
      // A line break inside a paragraph is kept: people write the way they want it to look.
      if (c === "\n") { put(h("br", { key: key("br") })); i++; continue; }
      if (c === "`" && (m = /^(`+)([\s\S]*?[^`])\1(?!`)/.exec(s.slice(i)))) {
        put(h("code", { key: key("c") }, m[2].replace(/^ ([\s\S]*) $/, "$1")));
        i += m[0].length;
        continue;
      }
      if (c === "!" && s.charAt(i + 1) === "[" && (m = linkAt(s, i + 1))) {
        var src = safeSrc(m.href);
        if (src) {
          put(h("img", {
            key: key("img"), className: "gp-inline-img", src: ctx.resolve(src),
            alt: plainInline(m.text), title: m.title || undefined, loading: "lazy"
          }));
        }
        i = m.end;
        continue;
      }
      if (c === "[" && !noLinks && (m = linkAt(s, i))) {
        put(anchor(m.href, inline(m.text, ctx, true), m.title, key("a")));
        i = m.end;
        continue;
      }
      if (c === "*" && s.substr(i, 3) === "***" && (end = closer(s, i + 3, "***")) > 0) {
        put(h("strong", { key: key("s") }, h("em", null, inline(s.slice(i + 3, end), ctx, noLinks))));
        i = end + 3;
        continue;
      }
      // An underscore inside a word — snake_case, a file name — is not emphasis.
      var opens = c === "*" || (c === "_" && !isWord(s.charAt(i - 1)));
      if (opens && s.charAt(i + 1) === c && (end = closer(s, i + 2, c + c)) > 0) {
        put(h("strong", { key: key("s") }, inline(s.slice(i + 2, end), ctx, noLinks)));
        i = end + 2;
        continue;
      }
      if (opens && (end = closer(s, i + 1, c)) > 0) {
        put(h("em", { key: key("e") }, inline(s.slice(i + 1, end), ctx, noLinks)));
        i = end + 1;
        continue;
      }
      if (c === "~" && s.charAt(i + 1) === "~" && (end = closer(s, i + 2, "~~")) > 0) {
        put(h("del", { key: key("d") }, inline(s.slice(i + 2, end), ctx, noLinks)));
        i = end + 2;
        continue;
      }
      if (!noLinks && (c === "h" || c === "H") && !isWord(s.charAt(i - 1)) &&
          (m = /^https?:\/\/[^\s<>"]+/i.exec(s.slice(i)))) {
        var url = trimUrl(m[0]);
        put(anchor(url, [url], "", key("u")));
        i += url.length;
        continue;
      }
      buf += c;
      i++;
    }
    flush();
    return out;
  }

  /* -------------------------------------------------------------- rendering */

  var CALLOUT = {
    note: ["შენიშვნა", "Note"], tip: ["რჩევა", "Tip"], important: ["მნიშვნელოვანი", "Important"],
    warning: ["ყურადღება", "Warning"], caution: ["გაფრთხილება", "Caution"]
  };
  var KIND_EN = { company: "Company", team: "Team", solo: "Solo developer" };

  function block(b, ctx, key) {
    var kids = function (list) { return list.map(function (c, i) { return block(c, ctx, key + "." + i); }); };
    switch (b.t) {
      case "h": return h("h" + b.level, { key: key }, inline(b.text, ctx));
      case "p": return h("p", { key: key }, inline(b.text, ctx));
      case "hr": return h("div", { key: key, className: "gp-hr", role: "separator" }, h("i"), h("i"), h("i"), h("i"));
      case "code": return h("pre", { key: key }, h("code", null, b.text));
      case "quote": return h("blockquote", { key: key }, kids(b.children));
      case "callout":
        return h("aside", { key: key, className: "gp-callout gp-" + b.kind },
          h("div", { className: "gp-callout-title" }, CALLOUT[b.kind][ctx.lang === "en" ? 1 : 0]),
          kids(b.children));
      case "list": return listEl(b, ctx, key);
      case "table": return tableEl(b, ctx, key);
      case "figure": return picture(b.img, ctx, key);
      case "gallery":
        return h("div", { key: key, className: "gp-gallery" + (b.imgs.length === 3 || b.imgs.length > 4 ? " gp-n3" : "") },
          b.imgs.map(function (img, i) { return picture(img, ctx, key + "." + i); }));
      case "video": return h(Video, { key: key, video: b.video, title: b.title, lang: ctx.lang });
      case "frame": return frameEl(b, ctx, key);
      case "elink":
        return h("p", { key: key, className: "gp-elink" },
          anchor(b.href, [b.title || hostOf(b.href), h("span", { key: "go", "aria-hidden": "true" }, " ↗")], "", "a"));
      case "card": return card(b, ctx, key);
      case "button":
        return h("div", { key: key, className: "gp-cta" },
          anchor(b.href, inline(b.text, ctx, true).concat([h("span", { key: "arrow", "aria-hidden": "true" }, "→")]), "", "a", "gp-btn"));
    }
    return null;
  }

  function listEl(b, ctx, key) {
    return h(b.ordered ? "ol" : "ul", { key: key, start: b.ordered && b.start !== 1 ? b.start : undefined },
      b.items.map(function (it, j) {
        var paras = it.lines.join("\n").split(/\n\s*\n/);
        return h("li", { key: j },
          paras.length > 1
            ? paras.map(function (p, pi) { return h("p", { key: pi }, inline(p, ctx)); })
            : inline(paras[0], ctx),
          it.sub.map(function (s, si) { return listEl(s, ctx, key + "." + j + "." + si); }));
      }));
  }

  function tableEl(b, ctx, key) {
    var align = function (j) { return b.aligns[j] ? { textAlign: b.aligns[j] } : undefined; };
    return h("div", { key: key, className: "gp-table" }, h("table", null,
      h("thead", null, h("tr", null, b.head.map(function (c, j) {
        return h("th", { key: j, style: align(j) }, inline(c, ctx));
      }))),
      h("tbody", null, b.rows.map(function (r, ri) {
        return h("tr", { key: ri }, b.head.map(function (_, j) {
          return h("td", { key: j, style: align(j) }, inline(r[j] || "", ctx));
        }));
      }))));
  }

  function picture(img, ctx, key) {
    var src = safeSrc(img.src);
    if (!src) return null;
    var url = ctx.resolve(src);
    var el = h("img", { src: url, alt: img.alt || "", title: img.title || undefined, loading: "lazy", decoding: "async" });
    if (ctx.onImage) {
      el = h("button", {
        type: "button", className: "gp-zoom",
        "aria-label": img.alt || (ctx.lang === "en" ? "Open the image" : "სურათის გახსნა"),
        onClick: function () { ctx.onImage(url, img.alt || ""); }
      }, el);
    }
    return h("figure", { key: key }, el, img.alt ? h("figcaption", null, img.alt) : null);
  }

  function hostOf(u) {
    var m = /^https?:\/\/(?:www\.)?([^/?#]+)/i.exec(u);
    return m ? m[1] : u;
  }

  /* A widget from one of the services in FRAMES. It may run its own scripts and
     open windows — a Steam widget's buy button, a form's submit — but the
     sandbox stops it from taking the page it sits in somewhere else. */
  function frameEl(b, ctx, key) {
    var player = b.kind === "player";
    var style = player
      ? { aspectRatio: b.w && b.h ? b.w + " / " + b.h : "16 / 9" }
      : { maxWidth: b.w ? b.w + "px" : undefined, height: (b.h || 380) + "px" };
    return h("div", { key: key, className: "gp-frame" + (player ? " gp-player" : ""), style: style },
      h("iframe", {
        src: b.src,
        title: b.title || (ctx.lang === "en" ? "Embedded content" : "ჩაშენებული მასალა"),
        loading: "lazy", allowFullScreen: true, referrerPolicy: "strict-origin-when-cross-origin",
        allow: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture; web-share",
        sandbox: "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms allow-presentation"
      }));
  }

  /* A still and a play button until someone asks for the video. A YouTube
     player is about a megabyte of script, and a post with three trailers in it
     should not cost three of them before anyone presses play. */
  function Video(props) {
    var R = window.React;
    var st = R.useState(false), on = st[0], setOn = st[1];
    var v = props.video, en = props.lang === "en";
    var cls = "gp-video" + (v.vertical ? " gp-vertical" : "");
    if (v.kind === "vimeo") {
      return h("div", { className: cls }, h("iframe", {
        src: "https://player.vimeo.com/video/" + v.id + "?dnt=1" + (v.hash ? "&h=" + v.hash : ""), title: props.title || "Vimeo",
        loading: "lazy", allow: "autoplay; fullscreen; picture-in-picture", allowFullScreen: true
      }));
    }
    if (on) {
      return h("div", { className: cls }, h("iframe", {
        src: "https://www.youtube-nocookie.com/embed/" + v.id + "?autoplay=1&rel=0" + (v.start ? "&start=" + v.start : ""),
        title: props.title || "YouTube",
        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
        referrerPolicy: "strict-origin-when-cross-origin", allowFullScreen: true
      }));
    }
    return h("button", {
      type: "button", className: cls + " gp-facade", onClick: function () { setOn(true); },
      "aria-label": props.title || (en ? "Play the video" : "ვიდეოს ჩართვა")
    },
      h("img", { src: "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg", alt: "", loading: "lazy" }),
      h("span", { className: "gp-play", "aria-hidden": "true" },
        h("svg", { viewBox: "0 0 24 24", width: 30, height: 30 }, h("path", { d: "M8.5 5.5v13l10.5-6.5z", fill: "#fff" }))),
      props.title ? h("span", { className: "gp-video-title" }, props.title) : null);
  }

  /* A game or a studio drawn as the catalogue draws it, so a post that talks
     about a game shows the game. A card whose record is gone falls back to the
     plain link it was written as. */
  function card(b, ctx, key) {
    var D = window.GGC && window.GGC.data, U = window.GGC && window.GGC.util;
    var en = ctx.lang === "en";
    var plainLink = function () { return h("p", { key: key }, anchor(b.href, [b.text || b.href], "", "a")); };
    if (!D || !U) return plainLink();
    var go = h("span", { className: "gp-card-go", "aria-hidden": "true" }, "→");
    if (b.kind === "game") {
      var g = ctx.game(b.id);
      if (!g) return plainLink();
      var art = D.gameArt(g), studio = ctx.company(g.studioId);
      var rel = D.releaseLabel(g);
      if (en && rel === "გამოსული") rel = "Released";
      return h("a", { key: key, className: "gp-card", href: "games.html#" + encodeURIComponent(g.id) },
        h("span", { className: "gp-card-art" + (g.mobile ? " gp-contain" : ""), style: art ? { backgroundImage: cssUrl(art) } : undefined }),
        h("span", { className: "gp-card-body" },
          h("span", { className: "gp-card-kicker" }, (en ? "Game" : "თამაში") + (rel ? " · " + rel : "")),
          h("span", { className: "gp-card-title" }, g.name),
          h("span", { className: "gp-card-sub" },
            [studio ? studio.name : "", (g.platforms || []).slice(0, 3).join(", ")].filter(Boolean).join(" · "))),
        go);
    }
    var c = ctx.company(b.id);
    if (!c) return plainLink();
    var count = ctx.gamesOf(c.id).length;
    return h("a", { key: key, className: "gp-card gp-studio", href: "companies.html#" + encodeURIComponent(c.id) },
      h("span", { className: "gp-card-logo", style: c.logo ? { backgroundImage: cssUrl(c.logo) } : undefined },
        c.logo ? null : U.initials(c.name)),
      h("span", { className: "gp-card-body" },
        h("span", { className: "gp-card-kicker" },
          [en ? KIND_EN[c.kind] : U.KIND_LABEL[c.kind], en ? "" : c.city].filter(Boolean).join(" · ")),
        h("span", { className: "gp-card-title" }, c.name),
        h("span", { className: "gp-card-sub" },
          count ? (en ? count + (count === 1 ? " game" : " games") : count + " თამაში") : "")),
      go);
  }

  /* opts: lang — the language of this text ("ka" | "en"), for the few labels
     the renderer writes itself; resolve(src) — where a picture really is (the
     editor points a file uploaded a moment ago at its local copy until GitHub
     Pages serves it); onImage(url, caption) — makes pictures open full size;
     game/company/gamesOf — catalogue lookups, the published catalogue unless
     the editor passes its own working copy. */
  function render(md, opts) {
    opts = opts || {};
    var D = window.GGC && window.GGC.data;
    var ctx = {
      lang: opts.lang === "en" ? "en" : "ka",
      resolve: opts.resolve || function (u) { return u; },
      onImage: opts.onImage || null,
      game: opts.game || function (id) { return D ? D.game(id) : null; },
      company: opts.company || function (id) { return D ? D.company(id) : null; },
      gamesOf: opts.gamesOf || function (id) { return D ? D.gamesOf(id) : []; }
    };
    style();
    return parse(md).map(function (b, i) { return block(b, ctx, "b" + i); });
  }

  /* ------------------------------------------------------------ plain text */

  function plainInline(s) {
    return String(s || "")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/(\*\*|__|~~)(.+?)\1/g, "$2")
      .replace(/\*+/g, "")
      .replace(/(^|[\s(])_(\S[^_]*?)_(?=[\s).,!?:;]|$)/g, "$1$2")
      .replace(/\\([\\`*_{}\[\]()#+\-.!~|<>])/g, "$1");
  }

  function blockText(b) {
    switch (b.t) {
      case "h": case "p": return plainInline(b.text);
      case "quote": case "callout": return b.children.map(blockText).join("\n");
      case "list":
        return b.items.map(function (it) {
          return plainInline(it.lines.join(" ")) + (it.sub.length ? "\n" + it.sub.map(blockText).join("\n") : "");
        }).join("\n");
      case "table":
        return [b.head].concat(b.rows).map(function (r) { return r.map(plainInline).join(" "); }).join("\n");
      case "code": return b.text;
      case "figure": return b.img.alt;
      case "gallery": return b.imgs.map(function (i) { return i.alt; }).join(" ");
      case "button": return plainInline(b.text);
    }
    return "";
  }

  function plain(md) { return parse(md).map(blockText).filter(Boolean).join("\n\n"); }
  function words(md) {
    var t = plain(md).trim();
    return t ? t.split(/\s+/).length : 0;
  }
  // Georgian words run long, so this reads a little slower than the usual 200.
  function minutes(md) { return Math.max(1, Math.round(words(md) / 180)); }

  /* The first paragraph of prose, cut at a word — what a card says about a post
     whose author left the summary empty. */
  function excerpt(md, max) {
    max = max || 200;
    var blocks = parse(md), first = "";
    for (var i = 0; i < blocks.length && !first; i++) {
      if (blocks[i].t === "p") first = plainInline(blocks[i].text).replace(/\s+/g, " ").trim();
    }
    if (!first) first = plain(md).replace(/\s+/g, " ").trim();
    if (first.length <= max) return first;
    var cut = first.slice(0, max), sp = cut.lastIndexOf(" ");
    return (sp > max * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,.;:—–-]+$/, "") + "…";
  }

  /* Whether the text opens with the summary — which it does whenever the
     summary was left for the first paragraph to fill. The article shows its
     summary above the text, and printing the same sentences twice in a row
     reads as a mistake, so the page leaves the summary out then. */
  function opensWith(md, summary) {
    var s = String(summary || "").replace(/…$/, "").replace(/\s+/g, " ").trim();
    if (!s) return false;
    return excerpt(md, 1e7).indexOf(s) === 0;
  }

  /* ------------------------------------------------------------------ style */

  /* The page's other styles are written inline, but a post's markup is built
     here rather than in a template, so it is styled by class: once, for the
     article page and the editor's preview alike. */
  var CSS = [
    ".ggc-prose{--gp-accent:#1d96d3;--gp-deep:#16181b;font-size:18px;line-height:1.78;color:#2b2f34;overflow-wrap:break-word}",
    ".ggc-prose>*{margin:0}",
    ".ggc-prose>*+*{margin-top:1.15em}",
    ".ggc-prose h2,.ggc-prose h3,.ggc-prose h4{color:#16181b;font-weight:700;text-wrap:balance}",
    ".ggc-prose h2{font-size:clamp(23px,2.9vw,29px);line-height:1.25;letter-spacing:-.02em}",
    ".ggc-prose h3{font-size:clamp(19px,2.3vw,22px);line-height:1.3;letter-spacing:-.01em}",
    ".ggc-prose h4{font-size:18px;line-height:1.4}",
    ".ggc-prose>h2:not(:first-child){margin-top:1.9em}",
    ".ggc-prose>h3:not(:first-child){margin-top:1.6em}",
    ".ggc-prose>h4:not(:first-child){margin-top:1.4em}",
    ".ggc-prose>h2+*,.ggc-prose>h3+*,.ggc-prose>h4+*{margin-top:.55em}",
    ".ggc-prose p{text-wrap:pretty}",
    ".ggc-prose a{color:#146590;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;text-decoration-color:rgba(20,101,144,.4);overflow-wrap:anywhere}",
    ".ggc-prose a:hover{color:#0f5273;text-decoration-color:currentColor}",
    ".ggc-prose strong{font-weight:700;color:#16181b}",
    ".ggc-prose del{color:#6a6f75}",
    ".ggc-prose code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.86em;background:#eceee9;border-radius:6px;padding:.12em .38em}",
    ".ggc-prose pre{background:#16181b;color:#e8eaec;border-radius:14px;padding:18px 20px;overflow:auto;font-size:14px;line-height:1.6}",
    ".ggc-prose pre code{background:none;padding:0;border-radius:0;font-size:inherit;color:inherit}",
    ".ggc-prose ul,.ggc-prose ol{padding-left:1.4em}",
    ".ggc-prose li+li,.ggc-prose li>ul,.ggc-prose li>ol{margin-top:.45em}",
    ".ggc-prose li>p{margin:0}.ggc-prose li>p+p{margin-top:.5em}",
    ".ggc-prose li::marker{color:var(--gp-accent);font-weight:700}",
    ".ggc-prose blockquote{border-left:4px solid var(--gp-accent);padding:.15em 0 .15em 1.1em;font-size:1.08em;color:#41464c}",
    ".ggc-prose blockquote>*,.gp-callout>*{margin:0}",
    ".ggc-prose blockquote>*+*,.gp-callout>*+*{margin-top:.7em}",
    ".gp-hr{display:flex;justify-content:center;gap:10px;padding:.4em 0}",
    ".gp-hr i{width:9px;height:9px;border-radius:3px}",
    ".gp-hr i:nth-child(1){background:#1d96d3}.gp-hr i:nth-child(2){background:#83c341}",
    ".gp-hr i:nth-child(3){background:#ee2626}.gp-hr i:nth-child(4){background:#fdb813}",
    ".ggc-prose figure{margin:0}",
    ".ggc-prose figure img{display:block;width:100%;height:auto;border-radius:14px;background:#e8eaec}",
    ".ggc-prose figcaption{margin-top:10px;font-size:14px;line-height:1.5;color:#5a5f65;text-align:center}",
    ".gp-zoom{display:block;width:100%;padding:0;border:0;background:none;cursor:zoom-in}",
    ".gp-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}",
    ".gp-gallery.gp-n3{grid-template-columns:repeat(3,minmax(0,1fr))}",
    ".gp-gallery figure img{aspect-ratio:4/3;object-fit:cover;border-radius:10px}",
    ".gp-gallery figcaption{margin-top:6px;font-size:13px;text-align:left}",
    ".gp-inline-img{max-width:100%;height:auto;vertical-align:middle;border-radius:6px}",
    ".gp-callout{border:1px solid;border-left-width:5px;border-radius:14px;padding:15px 18px;font-size:.95em}",
    ".gp-callout-title{font-family:'Space Grotesk','Noto Sans Georgian',sans-serif;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}",
    ".gp-note{background:#eaf5fb;border-color:#cfe6f3 #cfe6f3 #cfe6f3 #1d96d3}.gp-note .gp-callout-title{color:#0f5273}",
    ".gp-tip{background:#f0f6e9;border-color:#dcebcb #dcebcb #dcebcb #83c341}.gp-tip .gp-callout-title{color:#3d5e19}",
    ".gp-warning,.gp-important{background:#fdf4e0;border-color:#f6e3b4 #f6e3b4 #f6e3b4 #fdb813}",
    ".gp-warning .gp-callout-title,.gp-important .gp-callout-title{color:#7a5500}",
    ".gp-caution{background:#fdecec;border-color:#f6d0d0 #f6d0d0 #f6d0d0 #ee2626}.gp-caution .gp-callout-title{color:#a01616}",
    ".gp-video{position:relative;display:block;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#16181b}",
    ".gp-video.gp-vertical{max-width:340px;aspect-ratio:9/16;margin-left:auto;margin-right:auto}",
    ".gp-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}",
    ".gp-facade{padding:0;border:0;cursor:pointer;font:inherit}",
    ".gp-facade img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.9;transition:opacity .2s ease}",
    ".gp-facade:hover img{opacity:1}",
    ".gp-play{position:absolute;left:50%;top:50%;width:72px;height:72px;margin:-36px 0 0 -36px;border-radius:50%;background:rgba(22,24,27,.8);display:flex;align-items:center;justify-content:center;transition:transform .2s ease,background .2s ease}",
    ".gp-facade:hover .gp-play{transform:scale(1.07);background:#ee2626}",
    ".gp-video-title{position:absolute;left:0;right:0;bottom:0;padding:32px 16px 12px;background:linear-gradient(180deg,rgba(22,24,27,0),rgba(22,24,27,.82));color:#fff;font-size:15px;font-weight:600;line-height:1.4;text-align:left}",
    ".gp-frame{position:relative;width:100%;border-radius:14px;overflow:hidden}",
    ".gp-frame.gp-player{background:#16181b}",
    ".gp-frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}",
    ".gp-elink a{display:inline-flex;align-items:center;gap:6px;max-width:100%;background:#fff;border:1px solid #e2e4df;border-radius:12px;padding:12px 16px;font-weight:600;text-decoration:none!important;overflow-wrap:anywhere}",
    ".gp-elink a:hover{border-color:#c9cdc6}",
    ".gp-card{display:flex;align-items:center;gap:16px;background:#fff;border:1px solid #e2e4df;border-radius:16px;padding:12px;color:#16181b!important;text-decoration:none!important;box-shadow:0 1px 2px rgba(20,22,26,.04);transition:border-color .2s ease,transform .2s ease}",
    ".gp-card:hover{border-color:#c9cdc6;transform:translateY(-2px)}",
    ".gp-card-art{flex:none;width:min(184px,38%);aspect-ratio:460/215;border-radius:10px;background:#e8eaec center/cover no-repeat}",
    ".gp-card-art.gp-contain{background-size:contain;background-color:#e2e6e8}",
    ".gp-card-logo{flex:none;width:64px;height:64px;border-radius:50%;background:#eceee9 center/cover no-repeat;display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk',sans-serif;font-weight:600;color:#5a5f65}",
    ".gp-card-body{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px;line-height:1.35}",
    ".gp-card-kicker{font-family:'Space Grotesk','Noto Sans Georgian',sans-serif;font-size:12px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#5a5f65}",
    ".gp-card-title{font-size:18px;font-weight:700;letter-spacing:-.01em}",
    ".gp-card-sub{font-size:14px;color:#5a5f65}",
    ".gp-card-go{flex:none;padding:0 8px;font-size:20px;color:#146590}",
    ".gp-btn{display:inline-flex;align-items:center;gap:10px;background:var(--gp-deep);color:#fff!important;text-decoration:none!important;border-radius:12px;padding:14px 22px;font-size:16px;font-weight:600;line-height:1.3;transition:filter .2s ease,transform .2s ease}",
    ".gp-btn:hover{filter:brightness(.86);transform:translateY(-1px)}",
    ".gp-table{overflow-x:auto;border:1px solid #e2e4df;border-radius:14px;background:#fff}",
    ".gp-table table{width:100%;border-collapse:collapse;font-size:15px;line-height:1.5}",
    ".gp-table th{background:#f4f5f2;font-weight:700;text-align:left;color:#16181b}",
    ".gp-table th,.gp-table td{padding:10px 14px;border-bottom:1px solid #eceee9;vertical-align:top}",
    ".gp-table tr:last-child td{border-bottom:0}",
    "@media (max-width:560px){.ggc-prose{font-size:17px}.gp-gallery.gp-n3{grid-template-columns:repeat(2,minmax(0,1fr))}.gp-card{gap:12px}.gp-card-title{font-size:16px}}",
    "@media (prefers-reduced-motion:reduce){.gp-card,.gp-btn,.gp-play,.gp-facade img{transition:none}}"
  ].join("\n");

  var styled = false;
  function style() {
    if (styled || typeof document === "undefined" || !document.head) return;
    styled = true;
    var el = document.createElement("style");
    el.id = "ggc-prose-css";
    el.textContent = CSS;
    document.head.appendChild(el);
  }
  style();

  window.GGCMarkdown = {
    render: render, plain: plain, excerpt: excerpt, words: words, minutes: minutes,
    video: video, videoUrl: videoUrl, embedOf: embedOf, safeHref: safeHref, opensWith: opensWith
  };
})();

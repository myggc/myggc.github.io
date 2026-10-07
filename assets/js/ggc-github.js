/* GGC admin ↔ GitHub. Loaded only by admin.html.
   The admin signs in with a fine-grained personal access token scoped to this
   repository (Contents: read+write, Issues: read+write). The token lives in
   localStorage on the admin's own machine and is never committed anywhere. */
(function () {
  "use strict";

  // The page runtime evaluates <helmet> scripts more than once; keep the first
  // build so a signed-in session is not thrown away mid-render.
  if (window.GGCGitHub) return;

  var C = window.GGC.config;
  var API = "https://api.github.com";
  var KEY = "ggc.gh.token";
  var token = "";
  try { token = localStorage.getItem(KEY) || ""; } catch (e) { token = ""; }

  function setToken(t) {
    token = t || "";
    try { t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY); } catch (e) {}
  }
  function hasToken() { return !!token; }

  function req(path, opts) {
    opts = opts || {};
    var headers = { "Accept": "application/vnd.github+json" };
    if (token) headers.Authorization = "Bearer " + token;
    if (opts.body) headers["Content-Type"] = "application/json";
    return fetch(API + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      cache: "no-store"
    }).then(function (r) {
      if (r.status === 204) return null;
      return r.json().then(function (j) {
        if (!r.ok) {
          var msg = (j && j.message) || ("HTTP " + r.status);
          /* GitHub answers "Resource not accessible by personal access token"
             for anything the token was not granted, and says nothing about
             which permission is missing. A fine-grained token with Contents
             write but no Issues write signs in perfectly and then fails on the
             first approve or reject — so name the permission and where to set
             it, rather than passing GitHub's sentence through. */
          if (r.status === 403 && /not accessible|Resource not accessible/i.test(msg)) {
            msg = /\/issues/.test(path)
              ? "ტოკენს ამ რეპოზიტორიის Issues-ზე ჩაწერის უფლება არ აქვს. GitHub → Settings → " +
                "Developer settings → Personal access tokens → Fine-grained tokens → ეს ტოკენი → " +
                "Repository permissions → Issues: Read and write. შემდეგ ხელახლა შედი ადმინში."
              : "ტოკენს ამ მოქმედების უფლება არ აქვს: " + path;
          }
          var err = new Error(msg);
          err.status = r.status;
          throw err;
        }
        return j;
      });
    });
  }

  var R = "/repos/" + C.owner + "/" + C.repo;

  /* Confirms the token is valid *and* can write to this repository. */
  function signIn(t) {
    var prev = token;
    token = t;
    return req("/user").then(function (user) {
      return req(R).then(function (repo) {
        var p = repo.permissions || {};
        if (!p.push && !p.admin && !p.maintain) {
          throw new Error("ამ ტოკენს ამ რეპოზიტორიაზე ჩაწერის უფლება არ აქვს");
        }
        setToken(t);
        return { login: user.login, avatar: user.avatar_url, name: user.name || user.login };
      });
    }).catch(function (e) {
      token = prev;
      throw e;
    });
  }

  function me() {
    if (!token) return Promise.reject(new Error("no token"));
    return req("/user").then(function (u) {
      return { login: u.login, avatar: u.avatar_url, name: u.name || u.login };
    });
  }

  /* -------------------------------------------------------------- submissions */

  /* Every submission — from the site's own form or from a person opening an
     issue by hand — carries its payload in a fenced json block. */
  function parseIssue(issue) {
    var body = issue.body || "";
    var m = /```json\s*([\s\S]*?)```/.exec(body);
    var payload = null;
    if (m) { try { payload = JSON.parse(m[1]); } catch (e) { payload = null; } }
    return {
      number: issue.number,
      url: issue.html_url,
      title: issue.title,
      body: body,
      author: (issue.user && issue.user.login) || "",
      createdAt: issue.created_at,
      payload: payload,
      malformed: !payload
    };
  }

  /* GitHub silently drops ?labels= for anyone without write access, so a
     visitor's prefilled issue arrives unlabelled. Read every open issue and
     keep the ones that carry the marker, the label, or the title prefix. */
  var MARKER = "<!-- ggc:payload -->";
  var TITLE_RE = /^\[(new|edit)-(company|game)\]/;

  function isSubmission(issue) {
    if ((issue.body || "").indexOf(MARKER) >= 0) return true;
    if (TITLE_RE.test(issue.title || "")) return true;
    return (issue.labels || []).some(function (l) {
      return (l && (l.name || l)) === C.label;
    });
  }

  function listSubmissions() {
    return req(R + "/issues?state=open&per_page=100&sort=created&direction=desc")
      .then(function (list) {
        return (list || [])
          .filter(function (i) { return !i.pull_request && isSubmission(i); })
          .map(parseIssue);
      });
  }

  /* Every page of a list endpoint, up to `max` pages of a hundred. */
  function pages(path, max) {
    var out = [];
    function next(n) {
      return req(path + (path.indexOf("?") < 0 ? "?" : "&") + "per_page=100&page=" + n).then(function (list) {
        out = out.concat(list || []);
        return list && list.length === 100 && n < max ? next(n + 1) : out;
      });
    }
    return next(1);
  }

  /* Closed submissions, newest first. Publishing leaves a record of what an
     approval changed, before and after, in the closing comment, inside an HTML
     comment so the submitter sees only the thank-you. Issues closed before that
     record existed come back with `applied` null. */
  var APPLIED = /<!-- ggc:applied\s*([\s\S]*?)\s*-->/;
  var THANKS = "დადასტურდა და გამოქვეყნდა";

  function listHistory() {
    return Promise.all([
      pages(R + "/issues?state=closed&sort=updated&direction=desc", 5),
      pages(R + "/issues/comments?sort=created&direction=desc", 10)
    ]).then(function (r) {
      var applied = {}, thanked = {};
      r[1].forEach(function (c) {
        var n = Number(String(c.issue_url || "").split("/").pop());
        var body = c.body || "";
        var m = APPLIED.exec(body);
        // Newest first, so a re-published issue keeps its latest record.
        if (m && !applied[n]) { try { applied[n] = JSON.parse(m[1]); } catch (e) {} }
        if (body.indexOf(THANKS) >= 0) thanked[n] = true;
      });
      return r[0]
        .filter(function (i) { return !i.pull_request && isSubmission(i); })
        .map(function (i) {
          var it = parseIssue(i);
          var labels = (i.labels || []).map(function (l) { return (l && (l.name || l)) || ""; });
          it.closedAt = i.closed_at || "";
          it.outcome = labels.indexOf("approved") >= 0 || thanked[i.number] || applied[i.number] ? "approved"
            : labels.indexOf("rejected") >= 0 ? "rejected" : "closed";
          it.applied = applied[i.number] || null;
          return it;
        })
        .sort(function (a, b) { return a.closedAt < b.closedAt ? 1 : a.closedAt > b.closedAt ? -1 : 0; });
    });
  }

  function appliedNote(record) {
    // ">" is escaped so no value can close the HTML comment early.
    return "\n\n<!-- ggc:applied\n" + JSON.stringify(record).replace(/</g, "\\u003c").replace(/>/g, "\\u003e") + "\n-->";
  }

  function comment(number, body) {
    return req(R + "/issues/" + number + "/comments", { method: "POST", body: { body: body } });
  }
  function closeIssue(number, label) {
    var p = label
      ? req(R + "/issues/" + number + "/labels", { method: "POST", body: { labels: [label] } }).catch(function () {})
      : Promise.resolve();
    return p.then(function () {
      return req(R + "/issues/" + number, { method: "PATCH", body: { state: "closed" } });
    });
  }

  /* ------------------------------------------------------------------ commits */

  /* Raw text of a tracked file, decoded from the base64 the contents API
     returns. UTF-8 safe, which matters for the Georgian in these sources. */
  function getText(path) {
    return req(R + "/contents/" + path + "?ref=" + C.branch).then(function (f) {
      var bin = atob((f.content || "").replace(/\n/g, ""));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return { sha: f.sha, text: new TextDecoder("utf-8").decode(bytes) };
    });
  }

  function getFile(path) {
    return req(R + "/contents/" + encodeURIComponent(path) + "?ref=" + C.branch)
      .then(function (f) {
        var text = decodeURIComponent(escape(atob((f.content || "").replace(/\n/g, ""))));
        return { sha: f.sha, json: JSON.parse(text) };
      });
  }

  /* One commit for however many files changed, so companies.json and
     games.json never land in the history half-applied. A file whose content is
     null is removed in the same commit; `encoding: "base64"` carries a picture.
     With `parent`, the commit goes on top of that commit and the branch only
     moves if it still points there: a push in between fails it rather than
     being overwritten. */
  function commit(files, message, parent) {
    var head, baseTree;
    return (parent ? Promise.resolve(parent) : req(R + "/git/ref/heads/" + C.branch).then(function (ref) { return ref.object.sha; }))
      .then(function (sha) {
        head = sha;
        return req(R + "/git/commits/" + head);
      })
      .then(function (c) {
        baseTree = c.tree.sha;
        return Promise.all(files.map(function (f) {
          if (f.content === null) {
            return { path: f.path, mode: "100644", type: "blob", sha: null };
          }
          return req(R + "/git/blobs", {
            method: "POST",
            body: { content: f.content, encoding: f.encoding || "utf-8" }
          }).then(function (b) {
            return { path: f.path, mode: "100644", type: "blob", sha: b.sha };
          });
        }));
      })
      .then(function (tree) {
        return req(R + "/git/trees", { method: "POST", body: { base_tree: baseTree, tree: tree } });
      })
      .then(function (t) {
        return req(R + "/git/commits", {
          method: "POST",
          body: { message: message, tree: t.sha, parents: [head] }
        });
      })
      .then(function (c) {
        return req(R + "/git/refs/heads/" + C.branch, { method: "PATCH", body: { sha: c.sha } });
      });
  }

  /* Images go up on their own, straight away — the catalogue only stores the
     path, so the file has to exist before the record referring to it lands. */
  function putImage(path, base64, message) {
    return req(R + "/contents/" + path + "?ref=" + C.branch)
      .then(function (f) { return f.sha; })
      .catch(function () { return undefined; })
      .then(function (sha) {
        return req(R + "/contents/" + path, {
          method: "PUT",
          body: { message: message, content: base64, branch: C.branch, sha: sha }
        });
      })
      .then(function () { return path; });
  }

  function stringify(doc) {
    doc.updated = new Date().toISOString().slice(0, 10);
    return JSON.stringify(doc, null, 2) + "\n";
  }

  /* The panel used to publish the whole catalogue as it held it. After an
     upload it reloaded that catalogue from the site, which GitHub Pages takes a
     minute to rebuild, so it got the old copy back: the edits looked lost, and
     the next upload wrote the old copy over them. On 7 October one approval
     undid another that way 50 seconds after it went out.

     So an upload carries only what this panel changed. The files are read at
     the branch's current commit, the changed records are laid over them, and
     the commit goes on top of that same commit, so anything published in
     between (another admin, the store refresh) is kept. If the branch moves
     while this runs, it starts over from the new commit. */

  // Kept for callers; the merge below needs no snapshot of the files.
  function markBaseline() { return Promise.resolve(null); }

  function fileAt(path, sha) {
    return req(R + "/contents/" + path + "?ref=" + sha).then(function (f) {
      var bin = atob((f.content || "").replace(/\n/g, ""));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder("utf-8").decode(bytes));
    });
  }

  function same(a, b) { return JSON.stringify(sorted(a)) === JSON.stringify(sorted(b)); }
  function sorted(v) {
    if (Array.isArray(v)) return v.map(sorted);
    if (!v || typeof v !== "object") return v === undefined ? null : v;
    var out = {};
    Object.keys(v).sort().forEach(function (k) { out[k] = sorted(v[k]); });
    return out;
  }

  /* Lays `change` ({ upsert: [records], remove: [ids], base: { id: record as
     loaded, or null } }) over a file's items. A record someone else changed
     since this panel loaded it is still replaced, but named in `conflicts`. */
  function merge(items, change, norm, conflicts) {
    var out = (items || []).slice();
    var at = function (id) {
      for (var i = 0; i < out.length; i++) if (out[i] && out[i].id === id) return i;
      return -1;
    };
    var check = function (id) {
      if (!change.base || !(id in change.base)) return;
      var i = at(id), was = change.base[id];
      var now = i < 0 ? null : norm(out[i]);
      if (!same(now, was)) conflicts.push(id);
    };
    (change.remove || []).forEach(function (id) {
      check(id);
      var i = at(id);
      if (i >= 0) out.splice(i, 1);
    });
    (change.upsert || []).forEach(function (rec) {
      check(rec.id);
      var i = at(rec.id);
      if (i >= 0) out[i] = rec; else out.push(rec);
    });
    return out;
  }

  /* The data files as they are on the branch right now. The site serves them a
     minute or so behind a commit, while Pages rebuilds. */
  function loadData() {
    return req(R + "/git/ref/heads/" + C.branch).then(function (ref) {
      var head = ref.object.sha;
      return Promise.all([
        fileAt(C.paths.companies, head),
        fileAt(C.paths.games, head),
        fileAt(C.paths.site, head).catch(function () { return { version: 1, events: [], spending: [] }; })
      ]);
    }).then(function (docs) { return { companies: docs[0], games: docs[1], site: docs[2] }; });
  }

  /* `changes` = { companies, games } as above, plus `site` with `events`
     and/or `spending` when those were edited. Resolves to the documents as
     published, and the ids that had also been changed elsewhere. */
  function saveData(changes, message) {
    var D = window.GGC.data;
    var attempt = function (tries) {
      var head;
      return req(R + "/git/ref/heads/" + C.branch)
        .then(function (ref) {
          head = ref.object.sha;
          return Promise.all([
            fileAt(C.paths.companies, head),
            fileAt(C.paths.games, head),
            fileAt(C.paths.site, head).catch(function () { return { version: 1, events: [], spending: [] }; })
          ]);
        })
        .then(function (docs) {
          var conflicts = [];
          var cDoc = Object.assign({}, docs[0]);
          var gDoc = Object.assign({}, docs[1]);
          var sDoc = Object.assign({}, docs[2]);
          var files = [];
          if (changes.companies) {
            cDoc.items = merge(docs[0].items, changes.companies, D.normCompany, conflicts);
            files.push({ path: C.paths.companies, content: stringify(cDoc) });
          }
          if (changes.games) {
            gDoc.items = merge(docs[1].items, changes.games, D.normGame, conflicts);
            files.push({ path: C.paths.games, content: stringify(gDoc) });
          }
          if (changes.site) {
            if (changes.site.events) sDoc.events = changes.site.events;
            if (changes.site.spending) sDoc.spending = changes.site.spending;
            files.push({ path: C.paths.site, content: stringify(sDoc) });
          }
          if (!files.length) return { docs: { companies: cDoc, games: gDoc, site: sDoc }, conflicts: [] };
          return commit(files, message, head).then(function () {
            return { docs: { companies: cDoc, games: gDoc, site: sDoc }, conflicts: conflicts };
          });
        })
        .catch(function (e) {
          // 422 from moving the branch: someone pushed meanwhile. Go again.
          if (e.status === 422 && tries < 3) return attempt(tries + 1);
          throw e;
        });
    };
    return attempt(1);
  }

  /* Translations publish on their own. They are not part of the catalogue and
     nobody should have to hold an unfinished record to fix a word, so this
     commit does not go through the baseline check that guards the data files —
     it writes one file and touches nothing else. */
  function saveI18n(strings, ka, message) {
    var sorted = function (m) {
      var out = {};
      Object.keys(m || {}).sort().forEach(function (k) { out[k] = m[k]; });
      return out;
    };
    return getFile(C.paths.i18n)
      .then(function (f) { return f.json; })
      .catch(function () { return { version: 1 }; })
      .then(function (doc) {
        var next = Object.assign({}, doc, { strings: sorted(strings), ka: sorted(ka) });
        return commit([{ path: C.paths.i18n, content: stringify(next) }], message);
      });
  }

  /* -------------------------------------------------------------------- news */

  /* News publishes on its own, a post at a time, like the translations do: a
     post should not wait on a half-edited studio, and a studio should not ride
     out with a half-written post. Each save re-reads the index and changes only
     its own entry, so two admins writing two different posts cannot undo each
     other. Writing the same post is caught by comparing the entry with what it
     was when the editor opened it. */

  // A compact form of an entry that ignores key order, for that comparison.
  function stable(o) {
    if (!o || typeof o !== "object") return JSON.stringify(o === undefined ? null : o);
    return "{" + Object.keys(o).sort().map(function (k) {
      return JSON.stringify(k) + ":" + JSON.stringify(o[k]);
    }).join(",") + "}";
  }

  function loadNews() {
    return getFile(C.paths.news)
      .then(function (f) {
        var doc = f.json && typeof f.json === "object" ? f.json : {};
        return { sha: f.sha, doc: doc, items: Array.isArray(doc.items) ? doc.items : [] };
      })
      .catch(function (e) {
        // No file yet is simply no news; the first post creates it.
        if (e.status === 404) return { sha: null, doc: { version: 1 }, items: [] };
        throw e;
      });
  }

  function newest(a, b) {
    return String(b.date || "").localeCompare(String(a.date || "")) ||
      String(b.created || "").localeCompare(String(a.created || ""));
  }

  // A file this commit should remove — but only if it is actually there.
  function removal(path) {
    return fileSha(path).then(function (sha) { return sha ? { path: path, content: null } : null; });
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* posts/<id>.html — the address a post is shared by. A link preview (Facebook,
     Telegram, X, LinkedIn) reads the tags of the page it is given without
     running any script, and the site proper is one page that fills itself in
     with JavaScript, so every post would otherwise show up as the same generic
     card. This page is nothing but the post's own tags, and a person who opens
     it is sent on to the post straight away. */
  function newsStub(e) {
    var site = C.site.replace(/\/?$/, "/");
    var abs = function (u) { return /^https?:\/\//i.test(u) ? u : site + String(u).replace(/^\.?\//, ""); };
    var target = "../news.html#" + encodeURIComponent(e.id);
    var title = e.title, desc = e.excerpt || "";
    return [
      "<!DOCTYPE html>",
      '<html lang="ka">',
      "<head>",
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      "<title>" + esc(title) + " | GGC</title>",
      // A post with no summary has no description; the preview shows the title alone.
      desc ? '<meta name="description" content="' + esc(desc) + '">' : "",
      '<meta property="og:type" content="article">',
      '<meta property="og:site_name" content="Georgian Game Community">',
      '<meta property="og:title" content="' + esc(title) + '">',
      desc ? '<meta property="og:description" content="' + esc(desc) + '">' : "",
      '<meta property="og:url" content="' + esc(site + C.paths.posts + e.id + ".html") + '">',
      e.cover ? '<meta property="og:image" content="' + esc(abs(e.cover)) + '">' : "",
      e.cover ? '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">' : "",
      e.date ? '<meta property="article:published_time" content="' + esc(e.date) + '">' : "",
      '<meta name="twitter:card" content="' + (e.cover ? "summary_large_image" : "summary") + '">',
      "<script>location.replace(" + JSON.stringify(target) + ");</script>",
      "</head>",
      '<body style="margin:0;padding:48px 20px;font-family:system-ui,sans-serif;text-align:center">',
      '<a href="' + esc(target) + '">' + esc(title) + "</a>",
      "</body>",
      "</html>",
      ""
    ].filter(Boolean).join("\n");
  }

  /* Writes one post: its index entry, its text in each language it has, and
     its share page — one commit. `opts.isNew` gives a fresh post an id nobody
     has taken; `opts.expect` is the entry as the editor first saw it, and a
     different one on GitHub stops the save unless `opts.force`. A draft gets
     no share page, and a post that loses its English loses the file. */
  function saveNewsPost(entry, bodies, opts) {
    opts = opts || {};
    var dir = C.paths.posts;
    var attempt = function () {
      return loadNews().then(function (cur) {
        var items = cur.items.slice();
        var e = Object.assign({}, entry);
        if (opts.isNew) {
          var base = e.id, n = 2;
          while (items.some(function (x) { return x.id === e.id; })) e.id = base + "-" + n++;
        } else if (!opts.force) {
          var remote = items.filter(function (x) { return x.id === e.id; })[0] || null;
          if (stable(remote) !== stable(opts.expect || null)) {
            var err = new Error("ეს პოსტი GitHub-ზე შეიცვალა მას შემდეგ, რაც გაიხსნა");
            err.code = "conflict";
            throw err;
          }
        }
        // One post leads the news page; marking another one takes the mark off the last.
        if (e.featured) {
          items = items.map(function (x) {
            return x.featured && x.id !== e.id ? Object.assign({}, x, { featured: false }) : x;
          });
        }
        items = items.filter(function (x) { return x.id !== e.id; }).concat([e]).sort(newest);
        var doc = Object.assign({}, cur.doc, { items: items });
        if (!doc.version) doc.version = 1;
        var files = [
          { path: C.paths.news, content: stringify(doc) },
          { path: dir + e.id + ".md", content: bodies.body }
        ];
        var gone = [];
        if (e.en) files.push({ path: dir + e.id + ".en.md", content: bodies.bodyEn });
        else gone.push(dir + e.id + ".en.md");
        if (!e.draft) files.push({ path: dir + e.id + ".html", content: newsStub(e) });
        else gone.push(dir + e.id + ".html");
        return Promise.all(gone.map(removal)).then(function (dels) {
          return commit(files.concat(dels.filter(Boolean)), opts.message || ("news: " + e.title));
        }).then(function () { return { entry: e, items: items }; });
      });
    };
    /* A commit made by someone else between reading the branch and moving it
       — the store refresh runs twice a day — fails as "not a fast forward".
       The whole save is re-read and rebuilt on top of it once. */
    return attempt().catch(function (e) {
      if (e && e.status === 422 && /fast.forward/i.test(e.message || "")) return attempt();
      throw e;
    });
  }

  function deleteNewsPost(id, message) {
    var dir = C.paths.posts;
    return loadNews().then(function (cur) {
      var items = cur.items.filter(function (x) { return x.id !== id; });
      var doc = Object.assign({}, cur.doc, { items: items });
      return Promise.all([dir + id + ".md", dir + id + ".en.md", dir + id + ".html"].map(removal))
        .then(function (dels) {
          return commit([{ path: C.paths.news, content: stringify(doc) }].concat(dels.filter(Boolean)), message);
        })
        .then(function () { return { items: items }; });
    });
  }

  /* Several pictures in one commit — a gallery dropped into a post is one
     change in the history and one Pages rebuild, not six. */
  function putFiles(files, message) {
    return commit(files.map(function (f) {
      return { path: f.path, content: f.base64, encoding: "base64" };
    }), message);
  }

  window.GGCGitHub = {
    hasToken: hasToken, setToken: setToken, signIn: signIn, me: me,
    listSubmissions: listSubmissions, listHistory: listHistory, appliedNote: appliedNote,
    comment: comment, closeIssue: closeIssue,
    getFile: getFile, getText: getText, commit: commit, saveData: saveData, loadData: loadData, parseIssue: parseIssue,
    markBaseline: markBaseline, saveI18n: saveI18n,
    putImage: putImage, putFiles: putFiles,
    loadNews: loadNews, saveNewsPost: saveNewsPost, deleteNewsPost: deleteNewsPost,
    signOut: function () { setToken(""); }
  };
})();

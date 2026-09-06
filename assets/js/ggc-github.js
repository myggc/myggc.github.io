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
     games.json never land in the history half-applied. */
  function commit(files, message) {
    var head, baseTree;
    return req(R + "/git/ref/heads/" + C.branch)
      .then(function (ref) {
        head = ref.object.sha;
        return req(R + "/git/commits/" + head);
      })
      .then(function (c) {
        baseTree = c.tree.sha;
        return Promise.all(files.map(function (f) {
          return req(R + "/git/blobs", {
            method: "POST",
            body: { content: f.content, encoding: "utf-8" }
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

  /* Writes both catalogue files in a single commit. Pass the full item arrays. */
  function saveData(companies, games, message) {
    var raw = window.GGC.data.raw();
    var cDoc = Object.assign({}, raw.companies || { version: 1 }, { items: companies });
    var gDoc = Object.assign({}, raw.games || { version: 1 }, { items: games });
    return commit([
      { path: C.paths.companies, content: stringify(cDoc) },
      { path: C.paths.games, content: stringify(gDoc) }
    ], message);
  }

  window.GGCGitHub = {
    hasToken: hasToken, setToken: setToken, signIn: signIn, me: me,
    listSubmissions: listSubmissions, comment: comment, closeIssue: closeIssue,
    getFile: getFile, getText: getText, commit: commit, saveData: saveData, parseIssue: parseIssue,
    putImage: putImage,
    signOut: function () { setToken(""); }
  };
})();

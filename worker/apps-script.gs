/**
 * GGC submission relay — Google Apps Script version.
 *
 * Use this if you would rather not install anything: it deploys from a browser
 * in a couple of minutes and costs nothing. Functionally identical to
 * submit-worker.js — it turns a form submission into a labelled GitHub issue
 * that the admin queue picks up.
 *
 * Setup
 * -----
 * 1. script.google.com → New project → paste this file over Code.gs
 * 2. Project Settings → Script Properties → add:
 *      GITHUB_TOKEN  = a fine-grained PAT for myggc/myggc.github.io
 *                      with Issues: Read and write (nothing else)
 *      OWNER, REPO, LABEL are optional overrides of the defaults below.
 * 3. Deploy → New deployment → type "Web app"
 *      Execute as:        Me
 *      Who has access:    Anyone
 * 4. Copy the /exec URL into assets/js/ggc-core.js → config.submitEndpoint
 *
 * The site posts as text/plain on purpose: that is a "simple" CORS request, so
 * the browser sends no preflight — Apps Script cannot answer one.
 */

var DEFAULTS = { OWNER: 'myggc', REPO: 'myggc.github.io', LABEL: 'submission' };
var ACTIONS = ['new-company', 'edit-company', 'new-game', 'edit-game'];
var MAX_BYTES = 24 * 1024;

function prop_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || DEFAULTS[key] || '';
}

function reply_(obj, status) {
  return ContentService
    .createTextOutput(JSON.stringify(status ? Object.assign({}, obj, { status: status }) : obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Storefront pages have to be read from the browser to preview an import, and a
   browser cannot read them directly — the stores send no CORS header. The site
   falls back to public proxies for that, but they come and go: corsproxy.io
   started demanding an API key, and the one that stayed up returns pages
   rewritten as Markdown. This deployment already exists and is already trusted,
   so it does the same job reliably.

   ALLOWED keeps it from becoming an open proxy for anyone who finds the URL:
   only the storefronts the importer actually reads are fetched, and only ever
   read — nothing here can write. */
var ALLOWED = [
  'store.steampowered.com', 'steamcommunity.com',
  'itch.io', 'apps.apple.com', 'itunes.apple.com',
  'play.google.com', 'www.nintendo.com', 'store.playstation.com',
  'www.xbox.com', 'store.epicgames.com', 'www.gog.com'
];

function allowed_(url) {
  var m = /^https:\/\/([^/:?#]+)/i.exec(String(url || ''));
  if (!m) return false;
  var host = m[1].toLowerCase();
  for (var i = 0; i < ALLOWED.length; i++) {
    var a = ALLOWED[i];
    if (host === a || host.slice(-(a.length + 1)) === '.' + a) return true;
  }
  return false;
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action !== 'fetch') {
    return reply_({ ok: true, note: 'GGC submission relay. POST a submission payload here.' });
  }
  if (!allowed_(p.url)) return reply_({ error: 'host not allowed' });

  // A store page rarely changes between two people importing the same studio.
  var cache = CacheService.getScriptCache();
  var key = 'pg:' + Utilities.base64Encode(Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5, p.url));
  var hit = cache.get(key);
  if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.TEXT);

  var res;
  try {
    res = UrlFetchApp.fetch(p.url, {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GGC importer)' }
    });
  } catch (err) {
    return reply_({ error: 'fetch failed' });
  }
  if (res.getResponseCode() >= 400) return reply_({ error: 'store ' + res.getResponseCode() });

  var text = res.getContentText();
  // The cache entry cap is 100 KB; a bigger page is still served, just uncached.
  if (text.length < 95000) {
    try { cache.put(key, text, 900); } catch (err2) {}
  }
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var raw = (e && e.postData && e.postData.contents) || '';
  if (raw.length > MAX_BYTES) return reply_({ error: 'payload too large' });

  var payload;
  try { payload = JSON.parse(raw); } catch (err) { return reply_({ error: 'invalid json' }); }
  if (ACTIONS.indexOf(payload.action) < 0) return reply_({ error: 'unknown action' });
  if (!payload.subject || String(payload.subject).length > 200) {
    return reply_({ error: 'missing subject' });
  }

  // Light throttle: one deployment, 5 submissions a minute, shared.
  var cache = CacheService.getScriptCache();
  var bucket = 'rate:' + Math.floor(Date.now() / 60000);
  var seen = Number(cache.get(bucket) || 0);
  if (seen >= 5) return reply_({ error: 'too many submissions, try again in a minute' });
  cache.put(bucket, String(seen + 1), 120);

  // Same body shape the site builds, so the admin queue parses submissions
  // identically whether they arrived here or straight from GitHub.
  var body = [
    '**ტიპი:** ' + payload.action,
    '**სუბიექტი:** ' + payload.subject,
    payload.contact ? '**კონტაქტი:** ' + payload.contact : '',
    payload.note ? '\n' + payload.note : '',
    '',
    '<!-- ggc:payload -->',
    '```json',
    JSON.stringify(payload, null, 2),
    '```'
  ].filter(String).join('\n');

  var url = 'https://api.github.com/repos/' + prop_('OWNER') + '/' + prop_('REPO') + '/issues';
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + prop_('GITHUB_TOKEN'),
      Accept: 'application/vnd.github+json'
    },
    payload: JSON.stringify({
      title: '[' + payload.action + '] ' + payload.subject,
      body: body,
      labels: [prop_('LABEL')]
    })
  });

  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    return reply_({ error: 'github rejected the submission', detail: res.getContentText().slice(0, 300) }, code);
  }
  var issue = JSON.parse(res.getContentText());
  return reply_({ ok: true, number: issue.number, url: issue.html_url });
}

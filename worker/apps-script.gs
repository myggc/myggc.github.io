/**
 * GGC submission relay, Google Apps Script version 2.
 *
 * What it does with a form submission:
 *   1. Checks it (the same rules the form applies, since anyone can post here
 *      directly).
 *   2. Keeps the private parts private: the phone number goes to GGC's private
 *      contacts sheet, an uploaded registry extract (PDF) goes to a private
 *      Drive folder. Neither ever reaches GitHub, because the repository and its
 *      issues are public.
 *   3. Emails the sender a confirmation link and holds the submission in the
 *      sheet's "pending" tab until they press it.
 *   4. On confirmation, opens the labelled GitHub issue the admin queue reads.
 *
 * Setup (first time, or upgrading from version 1)
 * -----------------------------------------------
 * 1. script.google.com, open the GGC relay project (or New project) and paste
 *    this file over Code.gs.
 * 2. Project Settings, Script Properties:
 *      GITHUB_TOKEN  = a fine-grained PAT for myggc/myggc.github.io
 *                      with Issues: Read and write (nothing else)
 *      OWNER, REPO, LABEL are optional overrides of the defaults below.
 * 3. In the editor pick the function "setup" and press Run. Google asks for
 *    permission (Sheets, Drive, sending email, external requests). setup
 *    creates the private sheet and Drive folder, copies the phone numbers that
 *    were already stored into the sheet, and prints the sheet's link in the
 *    execution log. Running it again is safe: it only fills in what is missing.
 * 4. Deploy, Manage deployments, edit the existing web app, Version: New
 *    version, Deploy. Editing the existing deployment keeps the /exec URL, so
 *    the site needs no change. (A brand new deployment gets a new URL, which
 *    would then have to go into assets/js/ggc-core.js, config.submitEndpoint.)
 *      Execute as:        Me
 *      Who has access:    Anyone
 *
 * Confirmation emails are sent from the Google account that owns this script,
 * so submitters see that address. Deploy it under a GGC account rather than a
 * personal one. A free Gmail account can send 100 emails a day.
 *
 * The site posts as text/plain on purpose: that is a "simple" CORS request, so
 * the browser sends no preflight, which Apps Script cannot answer.
 */

var VERSION = 2;
var DEFAULTS = { OWNER: 'myggc', REPO: 'myggc.github.io', LABEL: 'submission' };
var ACTIONS = ['new-company', 'edit-company', 'new-game', 'edit-game'];
var MAX_BYTES = 24 * 1024;                 // the submission itself
var MAX_PROOF_BYTES = 3 * 1024 * 1024;     // an uploaded registry extract
var CONFIRM_DAYS = 7;
var SITE = 'https://myggc.ge/';

/* The last version of data/companies.json that still held phone numbers.
   setup() reads them from this commit and copies them into the private sheet,
   so they never have to pass through anyone's chat or inbox. */
var LEGACY_PHONES_COMMIT = '3b8cd352b3ecc81d8827013e664499dc6ef57106';

var CONTACTS = 'კონტაქტები';
var PENDING = 'მოლოდინში';
var CONTACT_HEAD = ['თარიღი', 'წყარო', 'ქმედება', 'ტიპი', 'საჯარო სახელი', 'ოფიციალური სახელი',
  'ჩანაწერის ID', 'საიდენტიფიკაციო კოდი', 'ქვეყანა', 'ელფოსტა', 'ტელეფონი',
  'ელფოსტა დადასტურდა', 'დამადასტურებელი დოკუმენტი', 'GitHub issue'];
var PENDING_HEAD = ['token', 'შეიქმნა', 'ელფოსტა', 'ქმედება', 'სახელი', 'სტატუსი',
  'დადასტურდა', 'GitHub issue', 'მონაცემები (იშლება დადასტურებისას)'];

function prop_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || DEFAULTS[key] || '';
}

function reply_(obj, status) {
  return ContentService
    .createTextOutput(JSON.stringify(status ? Object.assign({}, obj, { status: status }) : obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ setup */

function setup() {
  var props = PropertiesService.getScriptProperties();
  var ss = props.getProperty('SHEET_ID') ? SpreadsheetApp.openById(props.getProperty('SHEET_ID')) : null;
  if (!ss) {
    ss = SpreadsheetApp.create('GGC კონტაქტები (პირადი)');
    props.setProperty('SHEET_ID', ss.getId());
  }
  sheet_(ss, CONTACTS, CONTACT_HEAD);
  sheet_(ss, PENDING, PENDING_HEAD);
  var first = ss.getSheets()[0];
  if (first.getName() !== CONTACTS && first.getName() !== PENDING && first.getLastRow() === 0) {
    ss.deleteSheet(first);
  }

  if (!props.getProperty('FOLDER_ID')) {
    props.setProperty('FOLDER_ID', DriveApp.createFolder('GGC დამადასტურებელი დოკუმენტები (პირადი)').getId());
  }

  if (!props.getProperty('IMPORTED')) {
    var n = importExisting_(ss);
    props.setProperty('IMPORTED', new Date().toISOString());
    Logger.log('Copied ' + n + ' existing phone numbers into the sheet.');
  }
  Logger.log('Private contacts sheet: ' + ss.getUrl());
  Logger.log('Proof documents folder: https://drive.google.com/drive/folders/' + props.getProperty('FOLDER_ID'));
}

function sheet_(ss, name, head) {
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

/* Every cell is written as plain text, so "+995 555..." is never read as a
   number or a formula, and rows past the sheet's current end are added first. */
function append_(sh, rows) {
  var at = sh.getLastRow() + 1;
  var need = at + rows.length - 1 - sh.getMaxRows();
  if (need > 0) sh.insertRowsAfter(sh.getMaxRows(), need + 50);
  var range = sh.getRange(at, 1, rows.length, rows[0].length);
  range.setNumberFormat('@');
  range.setValues(rows);
}

function book_() {
  var id = prop_('SHEET_ID');
  if (!id) throw new Error('Run setup() once in the Apps Script editor first.');
  return SpreadsheetApp.openById(id);
}

/* Phones that were stored before this version: the ones in the catalogue file
   and the ones inside earlier submissions, which are public GitHub issues. */
function importExisting_(ss) {
  var sh = ss.getSheetByName(CONTACTS);
  var rows = [];
  var seen = {};
  var add = function (source, action, c, extra) {
    if (!c || !c.phone) return;
    var key = String(c.phone).replace(/\D/g, '') + '|' + (c.id || c.legal || c.name || '');
    if (seen[key]) return;
    seen[key] = 1;
    rows.push([new Date().toISOString(), source, action || '', c.kind || '', c.name || '', c.legal || '',
      c.id || (extra && extra.id) || '', c.regId || '', c.country || '', c.email || '', String(c.phone),
      '', '', (extra && extra.issue) || '']);
  };

  var url = 'https://raw.githubusercontent.com/' + prop_('OWNER') + '/' + prop_('REPO') + '/' +
    LEGACY_PHONES_COMMIT + '/data/companies.json';
  var res = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (res.getResponseCode() === 200) {
    (JSON.parse(res.getContentText()).items || []).forEach(function (c) { add('კატალოგი', '', c); });
  }

  for (var page = 1; page < 20; page++) {
    var r = github_('get', '/issues?state=all&per_page=100&page=' + page + '&labels=' + encodeURIComponent(prop_('LABEL')));
    if (r.code !== 200) break;
    var list = JSON.parse(r.text);
    if (!list.length) break;
    list.forEach(function (issue) {
      var m = /```json\s*([\s\S]*?)```/.exec(issue.body || '');
      if (!m) return;
      try {
        var p = JSON.parse(m[1]);
        add('issue #' + issue.number, p.action, p.company, { id: p.companyId, issue: issue.html_url });
      } catch (e) {}
    });
  }

  if (rows.length) append_(sh, rows);
  return rows.length;
}

/* ----------------------------------------------------------------- checks
   Kept in step with checkRegId / normPhone / checkEmail in assets/js/ggc-core.js. */

function looksFake_(s) {
  s = String(s || '');
  if (/^(.)\1+$/.test(s)) return true;
  return /^\d+$/.test(s) && s.length >= 6 &&
    ('01234567890123456789'.indexOf(s) >= 0 || '98765432109876543210'.indexOf(s) >= 0);
}

function checkEmail_(s) {
  return /^[^\s@<>()",;:]+@[^\s@<>()",;:.]+(\.[^\s@<>()",;:.]+)*\.[a-z]{2,}$/i.test(String(s || '').trim());
}

function phoneOk_(raw) {
  var s = String(raw || '').replace(/[()]/g, ' ').trim();
  if (!s || /[^\d\s+.\-]/.test(s) || /.\+/.test(s)) return false;
  var intl = /^(\+|00)/.test(s);
  var d = s.replace(/^00/, '').replace(/\D/g, '');
  if (!intl && d.length === 9) d = '995' + d;
  else if (!intl && !(d.length === 12 && d.indexOf('995') === 0)) return false;
  if (d.indexOf('995') === 0) {
    var n = d.slice(3);
    return n.length === 9 && /^[3457]/.test(n) && !looksFake_(n) && !/^5\d\d0{6}$/.test(n);
  }
  return d.length >= 8 && d.length <= 15 && d.charAt(0) !== '0' && !/^(\d)\1+$/.test(d.slice(-7));
}

function regIdOk_(raw, country) {
  var v = String(raw || '').trim();
  if (!country || country === 'GE') {
    var d = v.replace(/[\s.\-]/g, '');
    return /^\d{9}$/.test(d) && !looksFake_(d);
  }
  var a = v.toUpperCase().replace(/[^0-9A-Z]/g, '');
  return a.length >= 5 && a.length <= 20 && /\d/.test(a) && !looksFake_(a);
}

/* What the submission has to carry before anyone is emailed. Returns an error
   in Georgian, or '' when it passes. */
function problem_(p, priv) {
  if (!checkEmail_(priv.email)) return 'ელფოსტის ფორმატი არასწორია.';
  if (!phoneOk_(priv.phone)) return 'ტელეფონის ნომერი არასწორია.';
  if (!p.consent) return 'მონაცემების შენახვაზე თანხმობა საჭიროა.';
  var c = p.company;
  if (c && (p.action === 'new-company' || p.action === 'edit-company') && c.kind === 'company') {
    if (!regIdOk_(c.regId, c.country)) return 'საიდენტიფიკაციო კოდი არასწორია.';
    if (c.country && c.country !== 'GE' && !(p.proof && p.proof.url) && !p.proofFileName) {
      return 'საზღვარგარეთ რეგისტრირებულ კომპანიას რეესტრის ბმული ან ამონაწერი სჭირდება.';
    }
  }
  return '';
}

/* -------------------------------------------------------------- GitHub */

function github_(method, path, body) {
  var res = UrlFetchApp.fetch('https://api.github.com/repos/' + prop_('OWNER') + '/' + prop_('REPO') + path, {
    method: method,
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      Authorization: 'Bearer ' + prop_('GITHUB_TOKEN'),
      Accept: 'application/vnd.github+json'
    },
    payload: body ? JSON.stringify(body) : undefined
  });
  return { code: res.getResponseCode(), text: res.getContentText() };
}

function openIssue_(payload) {
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
  var r = github_('post', '/issues', {
    title: '[' + payload.action + '] ' + payload.subject,
    body: body,
    labels: [prop_('LABEL')]
  });
  if (r.code < 200 || r.code >= 300) throw new Error('github ' + r.code + ': ' + r.text.slice(0, 200));
  return JSON.parse(r.text);
}

/* ------------------------------------------------------------- web app */

/* Storefront pages have to be read from the browser to preview an import, and a
   browser cannot read them directly: the stores send no CORS header. This
   deployment already exists and is already trusted, so it fetches them.
   ALLOWED keeps it from becoming an open proxy: only the storefronts the
   importer actually reads are fetched, and only ever read. */
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
  if (p.action === 'version') return reply_({ ok: true, version: VERSION });
  if (p.action === 'confirm') return confirmPage_(p.t);
  if (p.action !== 'fetch') {
    return reply_({ ok: true, version: VERSION, note: 'GGC submission relay. POST a submission payload here.' });
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
  if (raw.length > MAX_BYTES + MAX_PROOF_BYTES * 1.4) return reply_({ error: 'ფაილი ძალიან დიდია.' });

  var payload;
  try { payload = JSON.parse(raw); } catch (err) { return reply_({ error: 'invalid json' }); }

  // The private parts come off before anything else looks at the payload.
  var priv = payload['private'] || {};
  var proofFile = payload.proofFile || null;
  delete payload['private'];
  delete payload.proofFile;
  if (proofFile) payload.proofFileName = String(proofFile.name || 'document.pdf').slice(0, 120);

  if (JSON.stringify(payload).length > MAX_BYTES) return reply_({ error: 'payload too large' });
  if (ACTIONS.indexOf(payload.action) < 0) return reply_({ error: 'unknown action' });
  if (!payload.subject || String(payload.subject).length > 200) {
    return reply_({ error: 'missing subject' });
  }
  var bad = problem_(payload, priv);
  if (bad) return reply_({ error: bad });
  var email = String(priv.email).trim();

  // Light throttle: 5 submissions a minute overall, 3 an hour per address, so
  // the form cannot be used to flood somebody's inbox.
  var cache = CacheService.getScriptCache();
  var bucket = 'rate:' + Math.floor(Date.now() / 60000);
  var seen = Number(cache.get(bucket) || 0);
  if (seen >= 5) return reply_({ error: 'ძალიან ბევრი მოთხოვნაა, სცადე ერთ წუთში.' });
  cache.put(bucket, String(seen + 1), 120);
  var mailKey = 'mail:' + email.toLowerCase();
  var sent = Number(cache.get(mailKey) || 0);
  if (sent >= 3) return reply_({ error: 'ამ ელფოსტაზე უკვე გაიგზავნა რამდენიმე ბმული. სცადე ერთ საათში.' });
  cache.put(mailKey, String(sent + 1), 3600);

  var fileId = '';
  if (proofFile && proofFile.data) {
    var bytes = Utilities.base64Decode(String(proofFile.data));
    if (bytes.length > MAX_PROOF_BYTES) return reply_({ error: 'ფაილი 3 MB-ზე დიდია.' });
    var type = String(proofFile.type || '');
    if (type !== 'application/pdf') return reply_({ error: 'მხოლოდ PDF ფაილი მიიღება.' });
    var blob = Utilities.newBlob(bytes, type, payload.proofFileName);
    fileId = DriveApp.getFolderById(prop_('FOLDER_ID')).createFile(blob).getId();
  }

  var token = Utilities.getUuid();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    append_(book_().getSheetByName(PENDING), [[
      token, new Date().toISOString(), email, payload.action, payload.subject, 'pending', '', '',
      JSON.stringify({ payload: payload, phone: String(priv.phone).trim(), fileId: fileId })
    ]]);
  } finally {
    lock.releaseLock();
  }

  sendConfirmation_(email, payload, token);
  return reply_({ ok: true, pending: true, to: email });
}

function selfUrl_() {
  return prop_('SELF_URL') || ScriptApp.getService().getUrl();
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function sendConfirmation_(email, payload, token) {
  var link = selfUrl_() + '?action=confirm&t=' + encodeURIComponent(token);
  var what = esc_(payload.subject);
  var html =
    '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#16181b;max-width:520px">' +
    '<p>გამარჯობა,</p>' +
    '<p>myggc.ge-ზე გამოიგზავნა მოთხოვნა: <b>' + what + '</b>. დაადასტურე, რომ ეს შენ გააგზავნე. ' +
    'სანამ არ დაადასტურებ, მოთხოვნა GGC-ის ადმინისტრაციას არ მიუვა.</p>' +
    '<p><a href="' + link + '" style="display:inline-block;background:#1d96d3;color:#fff;text-decoration:none;' +
    'border-radius:10px;padding:12px 20px;font-weight:bold">მოთხოვნის დადასტურება</a></p>' +
    '<p style="color:#5a5f65;font-size:13px">ბმული ' + CONFIRM_DAYS + ' დღე მოქმედებს. თუ ეს შენ არ გაგიგზავნია, ' +
    'უბრალოდ წაშალე წერილი.</p>' +
    '<hr style="border:0;border-top:1px solid #e6eaeb">' +
    '<p style="color:#5a5f65;font-size:13px">A submission for <b>' + what + '</b> was sent on myggc.ge. ' +
    'Open the link above to confirm it was you. If it wasn\'t, ignore this email.</p>' +
    '<p style="color:#5a5f65;font-size:13px">GGC, Georgian Game Community</p></div>';
  MailApp.sendEmail({
    to: email,
    subject: 'GGC: დაადასტურე მოთხოვნა / Confirm your submission',
    htmlBody: html,
    body: 'დაადასტურე მოთხოვნა (' + payload.subject + '): ' + link + '\nConfirm your submission: ' + link,
    name: 'GGC'
  });
}

/* The link in the email opens a page with a button rather than confirming on
   the spot: some mail filters open every link in a message to scan it, and
   that must not count as the person saying yes. */
function confirmPage_(token) {
  var html =
    '<!doctype html><html><head><meta charset="utf-8"><base target="_top">' +
    '<style>body{font-family:Arial,sans-serif;background:#f4f6f6;color:#16181b;margin:0;padding:24px}' +
    '.c{max-width:480px;margin:40px auto;background:#fff;border:1px solid #dfe3e4;border-radius:16px;padding:28px}' +
    'h1{font-size:22px;margin:0 0 10px}p{font-size:15px;line-height:1.6;color:#41464c}' +
    'button{border:0;cursor:pointer;background:#1d96d3;color:#fff;border-radius:11px;padding:14px 22px;font-size:16px;font-weight:bold}' +
    'button[disabled]{opacity:.6;cursor:default}a{color:#146590}</style></head><body><div class="c">' +
    '<h1 id="t">მოთხოვნის დადასტურება</h1>' +
    '<p id="m">დააჭირე ღილაკს და შენი მოთხოვნა GGC-ის ადმინისტრაციას გადაეცემა.</p>' +
    '<button id="b" onclick="go()">დადასტურება</button>' +
    '<p style="margin-top:22px"><a href="' + SITE + '">myggc.ge</a></p></div>' +
    '<script>var T=' + JSON.stringify(String(token || '')) + ';' +
    'function go(){var b=document.getElementById("b");b.disabled=true;b.textContent="იგზავნება…";' +
    'google.script.run.withSuccessHandler(done).withFailureHandler(function(){done({ok:false,' +
    'msg:"რაღაც შეფერხდა. სცადე ხელახლა ცოტა ხანში."})}).confirmSubmission(T)}' +
    'function done(r){document.getElementById("t").textContent=r.ok?"დადასტურებულია":"ვერ დადასტურდა";' +
    'document.getElementById("m").textContent=r.msg;document.getElementById("b").style.display=r.ok?"none":"inline-block";' +
    'document.getElementById("b").disabled=false;document.getElementById("b").textContent="დადასტურება"}</script>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setTitle('GGC: დადასტურება')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* Called from the confirmation page. Opens the GitHub issue (without the
   phone), writes the contact row, and empties the held copy. */
function confirmSubmission(token) {
  token = String(token || '');
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { ok: false, msg: 'ბმული არასწორია.' };
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = book_();
    var pending = ss.getSheetByName(PENDING);
    var cell = pending.createTextFinder(token).matchEntireCell(true).findNext();
    if (!cell || cell.getColumn() !== 1) return { ok: false, msg: 'ბმული ვერ მოიძებნა. შესაძლოა უკვე გამოყენებულია ან არასწორად დაკოპირდა.' };
    var row = cell.getRow();
    var vals = pending.getRange(row, 1, 1, PENDING_HEAD.length).getValues()[0];
    if (vals[5] === 'confirmed') {
      return { ok: true, msg: 'ეს მოთხოვნა უკვე დადასტურებულია. GGC-ის ადმინისტრაცია გადაამოწმებს და გამოაქვეყნებს.' };
    }
    if (Date.now() - new Date(vals[1]).getTime() > CONFIRM_DAYS * 86400000) {
      pending.getRange(row, 6).setValue('expired');
      return { ok: false, msg: 'ბმულს ვადა გაუვიდა. გააგზავნე მოთხოვნა ხელახლა myggc.ge-ზე.' };
    }
    var held = JSON.parse(vals[8]);
    var p = held.payload;
    var now = new Date().toISOString();
    p.emailConfirmed = true;
    p.confirmedAt = now;
    p.phoneOnFile = !!held.phone;
    if (held.fileId) p.proofFileUrl = 'https://drive.google.com/file/d/' + held.fileId + '/view';

    var issue = openIssue_(p);
    var c = p.company || {};
    append_(ss.getSheetByName(CONTACTS), [[
      now, 'ფორმა', p.action, c.kind || '', c.name || '', c.legal || p.subject || '', p.companyId || '',
      c.regId || '', c.country || 'GE', vals[2], held.phone, 'კი', p.proofFileUrl || ((p.proof && p.proof.url) || ''),
      issue.html_url
    ]]);
    pending.getRange(row, 6, 1, 4).setValues([['confirmed', now, issue.html_url, '']]);
    return { ok: true, msg: 'მადლობა! მოთხოვნა GGC-ის ადმინისტრაციას გადაეცა. გადამოწმების შემდეგ საიტზე გამოჩნდება.' };
  } catch (err) {
    return { ok: false, msg: 'რაღაც შეფერხდა. სცადე ხელახლა ცოტა ხანში.' };
  } finally {
    lock.releaseLock();
  }
}

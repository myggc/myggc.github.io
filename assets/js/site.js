/* Georgian Game Community — shared behaviour */

const TELEGRAM_URL = "https://t.me/GeorgianGameCommunity";

/* ---------- language ---------- */

function savedLang(){
  try { return localStorage.getItem("ggc-lang"); } catch(e){ return null; }
}
function storeLang(v){
  try { localStorage.setItem("ggc-lang", v); } catch(e){}
}

let LANG = savedLang()
  || ((navigator.language || "").toLowerCase().startsWith("ka") ? "ka" : "en");

function t(key){
  return (I18N[LANG] && I18N[LANG][key]) || (I18N.en[key]) || key;
}

/* pick the right language out of {ka:"", en:""} */
function pick(obj){
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj[LANG] || obj.en || obj.ka || "";
}

function label(group, key){
  const item = TAXONOMY[group] && TAXONOMY[group][key];
  return item ? (item[LANG] || item.en) : key;
}

function applyLang(){
  document.documentElement.lang = LANG;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(el => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(el => {
    el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria")));
  });

  document.querySelectorAll(".lang button").forEach(b => {
    b.setAttribute("aria-pressed", String(b.dataset.lang === LANG));
  });

  document.dispatchEvent(new CustomEvent("ggc:lang", { detail: LANG }));
}

function setLang(v){
  LANG = v;
  storeLang(v);
  applyLang();
}

/* ---------- chrome ---------- */

function buildHeader(){
  const links = [
    ["/index.html",      "nav.home"],
    ["/about.html",      "nav.about"],
    ["/companies.html",  "nav.companies"],
    ["/developers.html", "nav.developers"],
    ["/contact.html",    "nav.contact"]
  ];

  let here = location.pathname.replace(/\/$/, "/index.html");
  if (!/\.html$/.test(here)) here = "/index.html";

  const head = document.createElement("header");
  head.className = "site-head";
  head.innerHTML = `
    <div class="head-in">
      <a class="brand" href="/index.html">
        <span class="brand-cells" aria-hidden="true"><i></i><i></i><i></i></span>
        <span data-i18n="brand"></span>
      </a>
      <div class="lang" role="group" aria-label="Language">
        <button type="button" data-lang="ka">ქარ</button>
        <button type="button" data-lang="en">ENG</button>
      </div>
      <button class="menu-btn" type="button" data-i18n-aria="nav.menu" aria-expanded="false">☰</button>
      <nav class="nav">
        ${links.map(([href,key]) =>
          `<a href="${href}" data-i18n="${key}" ${href===here?'aria-current="page"':''}></a>`
        ).join("")}
      </nav>
    </div>`;

  document.body.prepend(head);

  head.querySelectorAll(".lang button").forEach(b => {
    b.addEventListener("click", () => setLang(b.dataset.lang));
  });

  const nav = head.querySelector(".nav");
  const btn = head.querySelector(".menu-btn");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
}

function buildFooter(){
  const f = document.createElement("footer");
  f.className = "site-foot";
  f.innerHTML = `
    <div class="wrap foot-in">
      <span>© ${new Date().getFullYear()} <span data-i18n="foot.rights"></span></span>
      <span>
        <a href="mailto:georgiangamecommunity@gmail.com">georgiangamecommunity@gmail.com</a>
      </span>
    </div>`;
  document.body.appendChild(f);
}

/* ---------- telegram widget ---------- */

function buildTelegram(){
  const seen = (() => { try { return localStorage.getItem("ggc-tg") === "1"; } catch(e){ return true; } })();

  const box = document.createElement("div");
  box.className = "tg";
  box.innerHTML = `
    <div class="tg-card" ${seen ? 'hidden' : ''}>
      <strong data-i18n="tg.title"></strong>
      <p data-i18n="tg.p"></p>
      <div class="row">
        <a href="${TELEGRAM_URL}" target="_blank" rel="noopener" data-i18n="tg.join"></a>
        <button type="button" data-i18n="tg.later"></button>
      </div>
    </div>
    <a class="tg-pill" href="${TELEGRAM_URL}" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.8 15.6 9.6 19c.4 0 .6-.2.8-.4l1.9-1.8 3.9 2.9c.7.4 1.2.2 1.4-.7l2.6-12c.2-1-.4-1.4-1-1.1L3.4 10.2c-1 .4-.9.9-.1 1.2l4.1 1.3 9.5-6c.4-.3.8-.1.5.2z"/></svg>
      <span data-i18n="tg.open"></span>
    </a>`;

  document.body.appendChild(box);

  const card = box.querySelector(".tg-card");
  card.querySelector("button").addEventListener("click", () => {
    card.hidden = true;
    try { localStorage.setItem("ggc-tg", "1"); } catch(e){}
  });
}

/* ---------- counters (home page) ---------- */

async function loadCounts(){
  const el = document.getElementById("counts");
  if (!el) return;
  try{
    const [co, dv] = await Promise.all([
      fetch("/data/companies.json").then(r => r.json()),
      fetch("/data/developers.json").then(r => r.json())
    ]);
    const companies = co.filter(x => x.entity === "company" && x.verified).length;
    const teams     = co.filter(x => x.entity === "team" && x.verified).length;
    const devs      = dv.filter(x => x.verified).length;
    el.querySelector("[data-c=companies]").textContent = companies;
    el.querySelector("[data-c=teams]").textContent     = teams;
    el.querySelector("[data-c=devs]").textContent      = devs;
  } catch(e){
    el.hidden = true;
  }
}

/* ---------- boot ---------- */

function initSite(){
  buildHeader();
  buildFooter();
  buildTelegram();
  applyLang();
  loadCounts();
}

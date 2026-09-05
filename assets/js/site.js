/* ==========================================================================
   Georgian Game Community — shared behaviour
   Header, footer, language switch, Telegram widget, home counters.
   ========================================================================== */

const TELEGRAM_URL = "https://t.me/GeorgianGameCommunity";

const SOCIAL = {
  facebook:  "https://www.facebook.com/share/1JN4PdkHES/",
  instagram: "https://www.instagram.com/ggc_geo",
  youtube:   "https://youtube.com/@ggc_geo",
  tiktok:    "https://www.tiktok.com/@ggc_geo",
  telegram:  TELEGRAM_URL
};

const CONTACT = {
  address: "#7 Innovations Street, Tbilisi, Georgia",
  email:   "georgiangamecommunity@gmail.com",
  phones:  [["+995 511 15 40 66","Giorgi"], ["+995 577 23 37 11","Saba"]]
};

/* ---------------------------------------------------------------- language */

function savedLang(){ try{ return localStorage.getItem("ggc-lang"); }catch(e){ return null; } }
function storeLang(v){ try{ localStorage.setItem("ggc-lang", v); }catch(e){} }

let LANG = savedLang()
  || ((navigator.language || "").toLowerCase().startsWith("ka") ? "ka" : "en");

function t(key){ return (I18N[LANG] && I18N[LANG][key]) || I18N.en[key] || key; }

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
  document.querySelectorAll("[data-i18n]").forEach(el => el.textContent = t(el.getAttribute("data-i18n")));
  document.querySelectorAll("[data-i18n-ph]").forEach(el => el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph"))));
  document.querySelectorAll("[data-i18n-aria]").forEach(el => el.setAttribute("aria-label", t(el.getAttribute("data-i18n-aria"))));
  document.querySelectorAll(".lang button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === LANG)));
  document.dispatchEvent(new CustomEvent("ggc:lang", { detail: LANG }));
}

function setLang(v){ LANG = v; storeLang(v); applyLang(); }

/* ---------------------------------------------------------------- chrome */

function buildHeader(){
  const links = [
    ["/index.html",      "nav.home"],
    ["/about.html",      "nav.about"],
    ["/companies.html",  "nav.companies"],
    ["/games.html",      "nav.games"],
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
        ${ggcLogo(34)}
        <span data-i18n="brand"></span>
      </a>
      <div class="lang" role="group" aria-label="Language">
        <button type="button" data-lang="ka">ქარ</button>
        <button type="button" data-lang="en">ENG</button>
      </div>
      <button class="menu-btn" type="button" data-i18n-aria="nav.menu" aria-expanded="false">☰</button>
      <nav class="nav">
        ${links.map(([h,k]) => `<a href="${h}" data-i18n="${k}" ${h===here?'aria-current="page"':''}></a>`).join("")}
        <a href="/join.html" class="btn btn-accent" style="margin-top:.3rem" data-i18n="nav.join"></a>
      </nav>
    </div>`;
  document.body.prepend(head);

  head.querySelectorAll(".lang button").forEach(b => b.addEventListener("click", () => setLang(b.dataset.lang)));
  const nav = head.querySelector(".nav"), btn = head.querySelector(".menu-btn");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
  });
}

function buildFooter(){
  const f = document.createElement("footer");
  f.className = "site-foot";
  f.innerHTML = `
    <div class="stripe" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <div class="wrap foot-in">
      <div>
        <div style="display:flex;align-items:center;gap:.6rem;margin-bottom:.7rem">
          ${ggcLogo(38)}
          <strong style="color:#fff" data-i18n="brand"></strong>
        </div>
        <p style="margin:0;font-size:.9rem;max-width:30ch" data-i18n="home.sub"></p>
        <div class="socials" style="margin-top:1rem">
          ${socialButtons(SOCIAL, { iconOnly:true })}
        </div>
      </div>
      <div>
        <h4 data-i18n="nav.menu"></h4>
        <ul class="foot-links">
          <li><a href="/about.html" data-i18n="nav.about"></a></li>
          <li><a href="/companies.html" data-i18n="nav.companies"></a></li>
          <li><a href="/games.html" data-i18n="nav.games"></a></li>
          <li><a href="/developers.html" data-i18n="nav.developers"></a></li>
          <li><a href="/join.html" data-i18n="nav.join"></a></li>
        </ul>
      </div>
      <div>
        <h4 data-i18n="contact.title"></h4>
        <ul class="foot-links">
          <li>${CONTACT.address}</li>
          <li><a href="mailto:${CONTACT.email}">${CONTACT.email}</a></li>
          ${CONTACT.phones.map(([n,who]) => `<li><a href="tel:${n.replace(/\s/g,"")}">${n}</a> — ${who}</li>`).join("")}
        </ul>
      </div>
    </div>
    <div class="wrap foot-bottom">
      <span>© ${new Date().getFullYear()} <span data-i18n="foot.rights"></span></span>
      <a href="/admin.html">Admin</a>
    </div>`;
  document.body.appendChild(f);
}

function buildTelegram(){
  let seen = true;
  try{ seen = localStorage.getItem("ggc-tg") === "1"; }catch(e){}
  const box = document.createElement("div");
  box.className = "tg";
  box.innerHTML = `
    <div class="tg-card" ${seen ? "hidden" : ""}>
      <strong data-i18n="tg.title"></strong>
      <p data-i18n="tg.p"></p>
      <div class="row">
        <a href="${TELEGRAM_URL}" target="_blank" rel="noopener" data-i18n="tg.join"></a>
        <button type="button" data-i18n="tg.later"></button>
      </div>
    </div>
    <a class="tg-pill" href="${TELEGRAM_URL}" target="_blank" rel="noopener">
      ${icon("telegram")}<span data-i18n="tg.open"></span>
    </a>`;
  document.body.appendChild(box);
  const card = box.querySelector(".tg-card");
  card.querySelector("button").addEventListener("click", () => {
    card.hidden = true;
    try{ localStorage.setItem("ggc-tg","1"); }catch(e){}
  });
}

/* ---------------------------------------------------------------- counts */
/* Shows the total in each directory, with how many of those are verified.
   The old version only counted verified entries, which read as zero. */

async function loadCounts(){
  const el = document.getElementById("counts");
  if (!el) return;
  try{
    const [co, dv, gm] = await Promise.all([
      fetch("/data/companies.json",  {cache:"no-store"}).then(r => r.json()),
      fetch("/data/developers.json", {cache:"no-store"}).then(r => r.json()),
      fetch("/data/games.json",      {cache:"no-store"}).then(r => r.json())
    ]);
    const firms = co.filter(x => x.entity !== "team");
    const teams = co.filter(x => x.entity === "team");

    const put = (key, list) => {
      const box = el.querySelector(`[data-c="${key}"]`);
      if (!box) return;
      const ver = list.filter(x => x.verified).length;
      box.querySelector("b").textContent = list.length;
      box.querySelector(".ver").textContent = ver
        ? `${ver} ${t("count.verified")}` : "";
    };
    put("companies", firms);
    put("teams", teams);
    put("games", gm);
    put("devs", dv);
  }catch(e){
    el.hidden = true;
  }
}

/* ---------------------------------------------------------------- boot */

function initSite(){
  buildHeader();
  buildFooter();
  buildTelegram();
  applyLang();
  loadCounts();
  document.addEventListener("ggc:lang", loadCounts);
}

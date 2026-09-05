/* ==========================================================================
   Directory listings, filters, and detail pages.

   Cards deliberately show only a summary. Contact details, full description,
   links, verification date and everything else live on the entry page, and
   are NOT part of what the search box looks through.
   ========================================================================== */

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}
function initials(n){
  return String(n || "?").trim().split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase();
}

/* ?v= keeps a replaced image from being served out of cache.
   REPLACE WITH REAL IMAGE: entries with no logo fall back to initials. */
function media(item){
  if (!item.logo) return "";
  const clean = "/" + String(item.logo).replace(/^\//,"");
  return item.updated ? clean + "?v=" + item.updated : clean;
}

const ROLE_GROUP = { companies:"role", developers:"discipline", games:"genre" };
const TAG_CYCLE = ["g","b","y","r"];

function verifiedBadge(item){
  if (!item.verified) return "";
  return `<span class="verified">${icon("check")}${esc(t("t.verified"))}</span>`;
}

/* ------------------------------------------------------------------ card */

function cardHTML(item, mode){
  const group = ROLE_GROUP[mode];
  const href  = `/entry.html?type=${mode}&id=${encodeURIComponent(item.id||"")}`;
  const round = mode === "developers", wide = mode === "games";
  const src   = media(item);

  const chip = src
    ? `<img class="logo-chip${round?" round":""}${wide?" wide":""}" src="${esc(src)}" alt="" loading="lazy">`
    : `<div class="logo-chip${round?" round":""}${wide?" wide":""}" aria-hidden="true">${esc(initials(pick(item.name)))}</div>`;

  const sub = mode === "games"
    ? [pick(item.developer), item.released].filter(Boolean).join(" · ")
    : [item.city, item.founded ? `${t("t.since")} ${item.founded}` : "",
       (mode==="companies" && item.size) ? `${label("size",item.size)} ${t("t.people")}` : ""
      ].filter(Boolean).join(" · ");

  const tags = [];
  if (mode === "companies" && item.origin) tags.push(`<span class="tag b">${esc(label("origin",item.origin))}</span>`);
  if (mode === "games" && item.status)     tags.push(`<span class="tag y">${esc(label("gamestatus",item.status))}</span>`);
  if (mode === "games") (item.platforms||[]).slice(0,3).forEach(p => tags.push(`<span class="tag">${esc(label("platform",p))}</span>`));
  if (mode === "developers" && item.available) tags.push(`<span class="tag y">${esc(t("t.available"))}</span>`);
  (item.roles||[]).slice(0,4).forEach((r,i) => tags.push(`<span class="tag ${TAG_CYCLE[i%4]}">${esc(label(group,r))}</span>`));

  /* short teaser only — the full text is on the entry page */
  const teaser = pick(item.about);
  const short = teaser.length > 130 ? teaser.slice(0,127).replace(/\s\S*$/,"") + "…" : teaser;

  const team = mode === "companies" && item.entity === "team";

  return `
    <article class="card${team?" card-team":""}${wide?" card-wide":""}">
      <a class="card-hit" href="${href}">
        <div class="card-top">
          ${chip}
          <div>
            <h3>${esc(pick(item.name))}</h3>
            ${item.verified ? verifiedBadge(item) : ""}
            ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
          </div>
        </div>
      </a>
      ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
      ${short ? `<p class="about">${esc(short)}</p>` : ""}
      <div class="card-links"><a href="${href}">${esc(t("t.more"))} →</a></div>
    </article>`;
}

/* ------------------------------------------------------------- directory */

function initDirectory(mode){
  const grid = document.getElementById("grid");
  const info = document.getElementById("resultInfo");
  const search = document.getElementById("fSearch");
  const reset = document.getElementById("fReset");
  const selects = Array.from(document.querySelectorAll("[data-filter]"));
  const group = ROLE_GROUP[mode];
  let data = [];

  function fillOptions(){
    selects.forEach(sel => {
      const kind = sel.dataset.filter, keep = sel.value;
      let opts = "";
      if (kind === "role"){
        opts = Object.keys(TAXONOMY[group]).map(k => `<option value="${k}">${esc(label(group,k))}</option>`).join("");
      } else if (TAXONOMY[kind]){
        opts = Object.keys(TAXONOMY[kind]).map(k => `<option value="${k}">${esc(label(kind,k))}</option>`).join("");
      } else if (kind === "city"){
        opts = [...new Set(data.map(x => x.city).filter(Boolean))].sort()
          .map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
      } else if (kind === "verified" || kind === "available"){
        opts = `<option value="yes">${esc(t(kind==="verified"?"f.verified":"f.available"))}</option>`;
      }
      const ph = (kind==="verified"||kind==="available") ? t("f.all") : t("f."+kind);
      sel.innerHTML = `<option value="">${esc(ph)}</option>` + opts;
      sel.value = keep;
    });
  }

  /* Search covers public, listing-level fields only. Contact details and the
     full description are detail-page content and stay out of the index. */
  function haystack(item){
    return [
      item.name && item.name.en, item.name && item.name.ka,
      item.city, pick(item.developer),
      ...(item.roles||[]).map(r => label(group,r)),
      ...(item.platforms||[]).map(p => label("platform",p))
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function matches(item){
    const q = (search.value||"").trim().toLowerCase();
    if (q && !haystack(item).includes(q)) return false;
    for (const sel of selects){
      const v = sel.value; if (!v) continue;
      const k = sel.dataset.filter;
      if (k==="role"       && !(item.roles||[]).includes(v)) return false;
      if (k==="platform"   && !(item.platforms||[]).includes(v)) return false;
      if (k==="gamestatus" && item.status !== v) return false;
      if (k==="entity"     && item.entity !== v) return false;
      if (k==="origin"     && item.origin !== v) return false;
      if (k==="size"       && item.size !== v) return false;
      if (k==="city"       && item.city !== v) return false;
      if (k==="verified"   && !item.verified) return false;
      if (k==="available"  && !item.available) return false;
    }
    return true;
  }

  function render(){
    const shown = data.filter(matches);
    info.querySelector("span").textContent = `${t("f.showing")} ${shown.length} ${t("f.of")} ${data.length}`;
    if (!shown.length){ grid.innerHTML = `<div class="empty">${esc(t("f.none"))}</div>`; return; }

    if (mode === "companies"){
      const firms = shown.filter(x => x.entity !== "team");
      const teams = shown.filter(x => x.entity === "team");
      let out = "";
      if (firms.length) out += `<h2 class="group-head">${esc(t("co.section.companies"))} <b>${firms.length}</b></h2>
        <div class="cards">${firms.map(x => cardHTML(x,mode)).join("")}</div>`;
      if (teams.length) out += `<h2 class="group-head group-head-teams">${esc(t("co.section.teams"))} <b>${teams.length}</b></h2>
        <p class="group-note">${esc(t("co.section.teams.note"))}</p>
        <div class="cards">${teams.map(x => cardHTML(x,mode)).join("")}</div>`;
      grid.innerHTML = out;
    } else {
      grid.innerHTML = `<div class="cards">${shown.map(x => cardHTML(x,mode)).join("")}</div>`;
    }
  }

  search.addEventListener("input", render);
  selects.forEach(s => s.addEventListener("change", render));
  reset.addEventListener("click", () => { search.value=""; selects.forEach(s=>s.value=""); render(); });
  document.addEventListener("ggc:lang", () => { fillOptions(); render(); });

  fetch(`/data/${mode}.json`, {cache:"no-store"})
    .then(r => r.json())
    .then(j => {
      data = Array.isArray(j) ? j : [];
      data.sort((a,b) => (!!b.verified - !!a.verified) || pick(a.name).localeCompare(pick(b.name)));
      fillOptions(); render();
    })
    .catch(() => grid.innerHTML = `<div class="empty">${esc(t("f.error"))}</div>`);
}

/* ------------------------------------------------------------ entry page */

function initEntry(){
  const box = document.getElementById("entry");
  const q = new URLSearchParams(location.search);
  const mode = ["companies","developers","games"].includes(q.get("type")) ? q.get("type") : "companies";
  const id = q.get("id");
  const group = ROLE_GROUP[mode];
  const backTo = { companies:"/companies.html", developers:"/developers.html", games:"/games.html" }[mode];
  let current = null;

  function rows(item){
    const r = [];
    if (mode === "games"){
      if (pick(item.developer)) r.push([t("t.developer"),
        item.developerId ? `<a href="/entry.html?type=companies&id=${encodeURIComponent(item.developerId)}">${esc(pick(item.developer))}</a>` : esc(pick(item.developer))]);
      if (item.released) r.push([t("t.released"), esc(item.released)]);
      if (item.status)   r.push([t("t.status"), esc(label("gamestatus",item.status))]);
      if ((item.platforms||[]).length) r.push([t("t.platforms"), item.platforms.map(p=>esc(label("platform",p))).join(", ")]);
      if ((item.roles||[]).length)     r.push([t("t.genre"), item.roles.map(g=>esc(label(group,g))).join(", ")]);
    } else {
      if (mode === "companies"){
        if (item.entity) r.push([t("t.details"), esc(label("entity",item.entity))]);
        if (item.origin) r.push([t("f.origin"), esc(label("origin",item.origin))]);
        if (item.size)   r.push([t("t.people"), esc(label("size",item.size))]);
      }
      if (item.city)     r.push([icon("pin") ? t("contact.address.h") : "", esc(item.city)]);
      if (item.founded)  r.push([t("t.since"), esc(item.founded)]);
      if ((item.roles||[]).length) r.push([t("t.details"), item.roles.map(x=>esc(label(group,x))).join(", ")]);
      if (mode === "developers" && item.available) r.push([t("t.status"), esc(t("t.available"))]);
    }
    if (item.verified && item.verifiedAt) r.push([t("t.verifiedon"), esc(item.verifiedAt)]);
    return r;
  }

  function paint(item){
    if (!item){
      box.innerHTML = `<div class="empty">${esc(t("t.notfound"))}</div>
        <p style="margin-top:1.2rem"><a href="${backTo}">← ${esc(t("t.back"))}</a></p>`;
      return;
    }
    document.title = pick(item.name) + " — Georgian Game Community";

    const src = media(item), round = mode==="developers", wide = mode==="games";
    const hero = src
      ? `<img class="entry-media${round?" round":""}${wide?" wide":""}" src="${esc(src)}" alt="">`
      : `<div class="entry-media${round?" round":""}${wide?" wide":""}">${esc(initials(pick(item.name)))}</div>`;

    const contact = [];
    if (item.website) contact.push(`<a class="soc" href="${esc(item.website)}" target="_blank" rel="noopener">${icon("website")}<span>${esc(t("t.website"))}</span></a>`);
    if (item.email)   contact.push(`<a class="soc" href="mailto:${esc(item.email)}">${icon("email")}<span>${esc(item.email)}</span></a>`);
    const social = socialButtons(item.links);

    const kv = rows(item).map(([k,v]) => `<div class="kv"><dt>${k}</dt><dd>${v}</dd></div>`).join("");

    box.innerHTML = `
      <p class="crumb"><a href="${backTo}">← ${esc(t("t.back"))}</a></p>
      <div class="entry-head">
        ${hero}
        <div style="flex:1 1 18rem">
          <h1 class="page-title">${esc(pick(item.name))}</h1>
          ${item.verified ? `<p style="margin:.5rem 0 0">${verifiedBadge(item)}</p>` : ""}
          ${(item.name && item.name.en && item.name.ka)
            ? `<p style="color:var(--muted);margin:.3rem 0 0">${esc(LANG==="ka"?item.name.en:item.name.ka)}</p>` : ""}
        </div>
      </div>`;

    const body = document.getElementById("entryBody");
    body.innerHTML = `
      <div class="grid2" style="align-items:start">
        <div>
          ${pick(item.about) ? `<div class="prose panel-card"><p>${esc(pick(item.about))}</p></div>` : ""}
          <div id="relatedGames"></div>
        </div>
        <div class="panel-card">
          ${kv ? `<dl class="kvs">${kv}</dl>` : ""}
          ${contact.length ? `<h3 style="font-size:1rem;margin:1.4rem 0 .6rem">${esc(t("t.contact"))}</h3>
            <div class="socials">${contact.join("")}</div>` : ""}
          ${social ? `<h3 style="font-size:1rem;margin:1.4rem 0 .6rem">${esc(t("t.links"))}</h3>
            <div class="socials">${social}</div>` : ""}
        </div>
      </div>`;

    if (mode === "companies") relatedGames(item);
  }

  function relatedGames(company){
    fetch("/data/games.json",{cache:"no-store"}).then(r=>r.json()).then(list => {
      const mine = (list||[]).filter(g => g.developerId && g.developerId === company.id);
      const host = document.getElementById("relatedGames");
      if (!mine.length || !host) return;
      host.innerHTML = `<h2 class="group-head">${esc(t("t.games"))} <b>${mine.length}</b></h2>
        <div class="cards" style="grid-template-columns:1fr">${mine.map(g=>cardHTML(g,"games")).join("")}</div>`;
    }).catch(()=>{});
  }

  document.addEventListener("ggc:lang", () => paint(current));

  fetch(`/data/${mode}.json`,{cache:"no-store"})
    .then(r=>r.json())
    .then(list => { current = (list||[]).find(x => x.id === id) || null; paint(current); })
    .catch(() => paint(null));
}

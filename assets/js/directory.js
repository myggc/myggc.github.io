/* Georgian Game Community — directory listing, filters, and detail pages */

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function initials(name){
  return String(name || "?").trim().split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase();
}

/* logo paths carry ?v= so a replaced image is not served from cache */
function media(item, field){
  const p = item[field || "logo"];
  if (!p) return "";
  const clean = "/" + String(p).replace(/^\//, "");
  return item.updated ? clean + "?v=" + item.updated : clean;
}

const ROLE_GROUP = { companies: "role", developers: "discipline", games: "genre" };

/* ------------------------------------------------------------------ card */

function cardHTML(item, mode){
  const group = ROLE_GROUP[mode];
  const name  = esc(pick(item.name));
  const href  = `/entry.html?type=${mode}&id=${encodeURIComponent(item.id || "")}`;
  const round = mode === "developers";
  const wide  = mode === "games";

  const src = media(item);
  const chip = src
    ? `<img class="logo-chip${round ? " round" : ""}${wide ? " wide" : ""}" src="${esc(src)}" alt="" loading="lazy">`
    : `<div class="logo-chip${round ? " round" : ""}${wide ? " wide" : ""}" aria-hidden="true">${esc(initials(pick(item.name)))}</div>`;

  let sub = "";
  if (mode === "games"){
    sub = [ pick(item.developer), item.released ].filter(Boolean).join(" · ");
  } else {
    sub = [
      item.city,
      item.founded ? `${t("t.since")} ${item.founded}` : "",
      (mode === "companies" && item.size) ? `${label("size", item.size)} ${t("t.people")}` : ""
    ].filter(Boolean).join(" · ");
  }

  const tags = [];
  if (mode === "companies"){
    if (item.origin) tags.push(`<span class="tag">${esc(label("origin", item.origin))}</span>`);
  } else if (mode === "games"){
    if (item.status) tags.push(`<span class="tag gold">${esc(label("gamestatus", item.status))}</span>`);
    (item.platforms || []).slice(0,3).forEach(p =>
      tags.push(`<span class="tag">${esc(label("platform", p))}</span>`));
  } else if (item.available){
    tags.push(`<span class="tag gold">${esc(t("t.available"))}</span>`);
  }
  (item.roles || []).slice(0, 4).forEach(r =>
    tags.push(`<span class="tag turq">${esc(label(group, r))}</span>`));

  const teamCard = mode === "companies" && item.entity === "team";

  return `
    <article class="card${teamCard ? " card-team" : ""}${wide ? " card-wide" : ""}">
      <a class="card-hit" href="${href}">
        <div class="card-top">
          ${chip}
          <div>
            <h3>${name} ${item.verified ? `<span class="verified" title="${esc(t("t.verified"))}">✓</span>` : ""}</h3>
            ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
          </div>
        </div>
      </a>
      ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
      ${pick(item.about) ? `<p class="about">${esc(pick(item.about))}</p>` : ""}
      <div class="card-links">
        <a href="${href}">${esc(t("t.more"))}</a>
        ${item.website ? `<a href="${esc(item.website)}" target="_blank" rel="noopener">${esc(t("t.website"))}</a>` : ""}
      </div>
    </article>`;
}

/* ------------------------------------------------------------- directory */

function initDirectory(mode){
  const grid   = document.getElementById("grid");
  const info   = document.getElementById("resultInfo");
  const search = document.getElementById("fSearch");
  const reset  = document.getElementById("fReset");
  const selects = Array.from(document.querySelectorAll("[data-filter]"));

  const group = ROLE_GROUP[mode];
  let data = [];

  function fillOptions(){
    selects.forEach(sel => {
      const kind = sel.dataset.filter;
      const keep = sel.value;
      let opts = "";

      if (kind === "role"){
        opts = Object.keys(TAXONOMY[group])
          .map(k => `<option value="${k}">${esc(label(group,k))}</option>`).join("");
      } else if (TAXONOMY[kind]){
        opts = Object.keys(TAXONOMY[kind])
          .map(k => `<option value="${k}">${esc(label(kind,k))}</option>`).join("");
      } else if (kind === "city"){
        opts = [...new Set(data.map(x => x.city).filter(Boolean))].sort()
          .map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
      } else if (kind === "verified" || kind === "available"){
        opts = `<option value="yes">${esc(t(kind === "verified" ? "f.verified" : "f.available"))}</option>`;
      }

      const ph = (kind === "verified" || kind === "available") ? t("f.all") : t("f." + kind);
      sel.innerHTML = `<option value="">${esc(ph)}</option>` + opts;
      sel.value = keep;
    });
  }

  function matches(item){
    const q = (search.value || "").trim().toLowerCase();
    if (q){
      const hay = [
        pick(item.name), item.name && item.name.en, item.name && item.name.ka,
        pick(item.about), item.city, pick(item.developer),
        ...(item.roles || []).map(r => label(group, r))
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    for (const sel of selects){
      const v = sel.value;
      if (!v) continue;
      const kind = sel.dataset.filter;
      if (kind === "role"       && !(item.roles || []).includes(v)) return false;
      if (kind === "platform"   && !(item.platforms || []).includes(v)) return false;
      if (kind === "gamestatus" && item.status !== v) return false;
      if (kind === "entity"     && item.entity !== v) return false;
      if (kind === "origin"     && item.origin !== v) return false;
      if (kind === "size"       && item.size !== v) return false;
      if (kind === "city"       && item.city !== v) return false;
      if (kind === "verified"   && !item.verified) return false;
      if (kind === "available"  && !item.available) return false;
    }
    return true;
  }

  function render(){
    const shown = data.filter(matches);
    info.querySelector("span").textContent =
      `${t("f.showing")} ${shown.length} ${t("f.of")} ${data.length}`;

    if (!shown.length){
      grid.innerHTML = `<div class="empty">${esc(t("f.none"))}</div>`;
      return;
    }

    /* companies are split so unregistered teams read as their own thing */
    if (mode === "companies"){
      const firms = shown.filter(x => x.entity !== "team");
      const teams = shown.filter(x => x.entity === "team");
      let out = "";
      if (firms.length){
        out += `<h2 class="group-head">${esc(t("co.section.companies"))} <b>${firms.length}</b></h2>
                <div class="cards">${firms.map(x => cardHTML(x, mode)).join("")}</div>`;
      }
      if (teams.length){
        out += `<h2 class="group-head group-head-teams">${esc(t("co.section.teams"))} <b>${teams.length}</b></h2>
                <p class="group-note">${esc(t("co.section.teams.note"))}</p>
                <div class="cards">${teams.map(x => cardHTML(x, mode)).join("")}</div>`;
      }
      grid.innerHTML = out;
    } else {
      grid.innerHTML = `<div class="cards">${shown.map(x => cardHTML(x, mode)).join("")}</div>`;
    }
  }

  search.addEventListener("input", render);
  selects.forEach(s => s.addEventListener("change", render));
  reset.addEventListener("click", () => {
    search.value = "";
    selects.forEach(s => s.value = "");
    render();
  });
  document.addEventListener("ggc:lang", () => { fillOptions(); render(); });

  fetch(`/data/${mode}.json`, { cache: "no-store" })
    .then(r => r.json())
    .then(json => {
      data = Array.isArray(json) ? json : [];
      data.sort((a, b) => (!!b.verified - !!a.verified) || pick(a.name).localeCompare(pick(b.name)));
      fillOptions();
      render();
    })
    .catch(() => {
      grid.innerHTML = `<div class="empty">${esc(t("f.error"))}</div>`;
    });
}

/* ------------------------------------------------------------ entry page */

function initEntry(){
  const box = document.getElementById("entry");
  const params = new URLSearchParams(location.search);
  const mode = ["companies","developers","games"].includes(params.get("type")) ? params.get("type") : "companies";
  const id = params.get("id");
  const group = ROLE_GROUP[mode];
  const backTo = { companies:"/companies.html", developers:"/developers.html", games:"/games.html" }[mode];

  const rowsFor = item => {
    const r = [];
    if (mode === "games"){
      if (pick(item.developer)) r.push([t("t.developer"), esc(pick(item.developer))]);
      if (item.released) r.push([t("t.released"), esc(item.released)]);
      if (item.status) r.push([t("t.status"), esc(label("gamestatus", item.status))]);
      if ((item.platforms||[]).length)
        r.push([t("t.platforms"), item.platforms.map(p => esc(label("platform", p))).join(", ")]);
      if ((item.roles||[]).length)
        r.push([t("t.genre"), item.roles.map(g => esc(label(group, g))).join(", ")]);
    } else {
      if (mode === "companies"){
        if (item.entity) r.push(["", esc(label("entity", item.entity))]);
        if (item.origin) r.push([t("f.origin").replace(/^All /,""), esc(label("origin", item.origin))]);
        if (item.size) r.push([t("t.people"), esc(label("size", item.size))]);
      }
      if (item.city) r.push(["", esc(item.city)]);
      if (item.founded) r.push([t("t.since"), esc(item.founded)]);
      if ((item.roles||[]).length)
        r.push([t("t.details"), item.roles.map(x => esc(label(group, x))).join(", ")]);
      if (mode === "developers" && item.available) r.push(["", esc(t("t.available"))]);
    }
    return r;
  };

  function paint(item){
    if (!item){
      box.innerHTML = `<div class="empty">${esc(t("t.notfound"))}</div>
        <p style="margin-top:1.2rem"><a href="${backTo}">${esc(t("t.back"))}</a></p>`;
      return;
    }
    document.title = pick(item.name) + " — Georgian Game Community";

    const src = media(item);
    const round = mode === "developers", wide = mode === "games";
    const hero = src
      ? `<img class="entry-media${round?" round":""}${wide?" wide":""}" src="${esc(src)}" alt="">`
      : `<div class="entry-media${round?" round":""}${wide?" wide":""}">${esc(initials(pick(item.name)))}</div>`;

    const links = [];
    if (item.website) links.push(`<a href="${esc(item.website)}" target="_blank" rel="noopener">${esc(t("t.website"))}</a>`);
    if (item.email)   links.push(`<a href="mailto:${esc(item.email)}">${esc(t("t.email"))}</a>`);
    Object.entries(item.links || {}).forEach(([k,v]) => {
      if (v) links.push(`<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k)}</a>`);
    });

    const rows = rowsFor(item).map(([k,v]) =>
      `<div class="kv"><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join("");

    box.innerHTML = `
      <p class="crumb"><a href="${backTo}">← ${esc(t("t.back"))}</a></p>
      <div class="entry-head">
        ${hero}
        <div>
          <h1 class="page-title" style="font-size:clamp(1.7rem,4.6vw,2.5rem)">${esc(pick(item.name))}</h1>
          ${item.verified ? `<p class="verified" style="margin:.4rem 0 0">✓ ${esc(t("t.verified"))}</p>` : ""}
          ${(item.name && item.name.en && item.name.ka)
            ? `<p class="sub" style="margin-top:.3rem">${esc(LANG === "ka" ? item.name.en : item.name.ka)}</p>` : ""}
        </div>
      </div>
      <div class="enamel" aria-hidden="true"><i></i><i></i><i></i></div>
      ${pick(item.about) ? `<div class="prose"><p>${esc(pick(item.about))}</p></div>` : ""}
      ${rows ? `<dl class="kvs">${rows}</dl>` : ""}
      ${links.length ? `<h2 class="group-head">${esc(t("t.links"))}</h2>
        <div class="socials">${links.join("")}</div>` : ""}
      <div id="relatedGames"></div>`;

    if (mode === "companies") relatedGames(item);
  }

  function relatedGames(company){
    fetch("/data/games.json", { cache: "no-store" })
      .then(r => r.json())
      .then(list => {
        const mine = (list || []).filter(g => g.developerId && g.developerId === company.id);
        if (!mine.length) return;
        document.getElementById("relatedGames").innerHTML =
          `<h2 class="group-head">${esc(t("t.games"))} <b>${mine.length}</b></h2>
           <div class="cards">${mine.map(g => cardHTML(g, "games")).join("")}</div>`;
      })
      .catch(() => {});
  }

  let cache = null;
  function load(){
    fetch(`/data/${mode}.json`, { cache: "no-store" })
      .then(r => r.json())
      .then(list => { cache = (list || []).find(x => x.id === id) || null; paint(cache); })
      .catch(() => paint(null));
  }

  document.addEventListener("ggc:lang", () => { if (cache !== undefined) paint(cache); });
  load();
}

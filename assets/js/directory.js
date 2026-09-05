/* Georgian Game Community — directory listing with filters */

function esc(s){
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function initials(name){
  return String(name || "?").trim().split(/\s+/).slice(0,2).map(w => w[0]).join("").toUpperCase();
}

/* mode: "companies" or "developers" */
function initDirectory(mode){
  const grid   = document.getElementById("grid");
  const info   = document.getElementById("resultInfo");
  const search = document.getElementById("fSearch");
  const reset  = document.getElementById("fReset");
  const selects = Array.from(document.querySelectorAll("[data-filter]"));

  const roleGroup = mode === "companies" ? "role" : "discipline";
  let data = [];

  function fillOptions(){
    selects.forEach(sel => {
      const kind = sel.dataset.filter;
      const keep = sel.value;
      let opts = "";

      if (kind === "role"){
        opts = Object.keys(TAXONOMY[roleGroup])
          .map(k => `<option value="${k}">${esc(label(roleGroup,k))}</option>`).join("");
      } else if (kind === "entity" || kind === "origin" || kind === "size"){
        opts = Object.keys(TAXONOMY[kind])
          .map(k => `<option value="${k}">${esc(label(kind,k))}</option>`).join("");
      } else if (kind === "city"){
        const cities = [...new Set(data.map(x => x.city).filter(Boolean))].sort();
        opts = cities.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");
      } else if (kind === "verified" || kind === "available"){
        opts = `<option value="yes">${esc(t(kind === "verified" ? "f.verified" : "f.available"))}</option>`;
      }

      const placeholder = (kind === "verified" || kind === "available")
        ? t("f.all") : t("f." + kind);
      sel.innerHTML = `<option value="">${esc(placeholder)}</option>` + opts;
      sel.value = keep;
    });
  }

  function matches(item){
    const q = (search.value || "").trim().toLowerCase();
    if (q){
      const hay = [
        pick(item.name), item.name && item.name.en, item.name && item.name.ka,
        pick(item.about), item.city,
        ...(item.roles || []).map(r => label(roleGroup, r))
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    for (const sel of selects){
      const v = sel.value;
      if (!v) continue;
      const kind = sel.dataset.filter;
      if (kind === "role"      && !(item.roles || []).includes(v)) return false;
      if (kind === "entity"    && item.entity !== v) return false;
      if (kind === "origin"    && item.origin !== v) return false;
      if (kind === "size"      && item.size !== v) return false;
      if (kind === "city"      && item.city !== v) return false;
      if (kind === "verified"  && !item.verified) return false;
      if (kind === "available" && !item.available) return false;
    }
    return true;
  }

  function cardHTML(item){
    const name = esc(pick(item.name));
    const round = mode === "developers";

    const logo = item.logo
      ? `<img class="logo-chip${round ? " round" : ""}" src="${esc(item.logo)}" alt="" loading="lazy">`
      : `<div class="logo-chip${round ? " round" : ""}" aria-hidden="true">${esc(initials(pick(item.name)))}</div>`;

    const sub = [
      item.city,
      item.founded ? `${t("t.since")} ${item.founded}` : "",
      (mode === "companies" && item.size) ? `${label("size", item.size)} ${t("t.people")}` : ""
    ].filter(Boolean).join(" · ");

    const tags = [];
    if (mode === "companies"){
      if (item.entity) tags.push(`<span class="tag ${item.entity === "company" ? "gold" : "crim"}">${esc(label("entity", item.entity))}</span>`);
      if (item.origin) tags.push(`<span class="tag">${esc(label("origin", item.origin))}</span>`);
    } else if (item.available){
      tags.push(`<span class="tag gold">${esc(t("t.available"))}</span>`);
    }
    (item.roles || []).forEach(r => {
      tags.push(`<span class="tag turq">${esc(label(roleGroup, r))}</span>`);
    });

    const links = [];
    if (item.website) links.push(`<a href="${esc(item.website)}" target="_blank" rel="noopener">${esc(t("t.website"))}</a>`);
    if (item.email)   links.push(`<a href="mailto:${esc(item.email)}">${esc(t("t.email"))}</a>`);
    Object.entries(item.links || {}).forEach(([k, v]) => {
      if (v) links.push(`<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k)}</a>`);
    });

    return `
      <article class="card">
        <div class="card-top">
          ${logo}
          <div>
            <h3>${name} ${item.verified ? `<span class="verified" title="${esc(t("t.verified"))}">✓</span>` : ""}</h3>
            ${sub ? `<div class="sub">${esc(sub)}</div>` : ""}
          </div>
        </div>
        ${tags.length ? `<div class="tags">${tags.join("")}</div>` : ""}
        ${pick(item.about) ? `<p class="about">${esc(pick(item.about))}</p>` : ""}
        ${links.length ? `<div class="card-links">${links.join("")}</div>` : ""}
      </article>`;
  }

  function render(){
    const shown = data.filter(matches);
    info.querySelector("span").textContent =
      `${t("f.showing")} ${shown.length} ${t("f.of")} ${data.length}`;

    grid.innerHTML = shown.length
      ? shown.map(cardHTML).join("")
      : `<div class="empty" style="grid-column:1/-1">${esc(t("f.none"))}</div>`;
  }

  function bind(){
    search.addEventListener("input", render);
    selects.forEach(s => s.addEventListener("change", render));
    reset.addEventListener("click", () => {
      search.value = "";
      selects.forEach(s => s.value = "");
      render();
    });
    document.addEventListener("ggc:lang", () => { fillOptions(); render(); });
  }

  fetch(`/data/${mode}.json`)
    .then(r => r.json())
    .then(json => {
      data = Array.isArray(json) ? json : [];
      data.sort((a, b) => {
        if (!!b.verified - !!a.verified) return !!b.verified - !!a.verified;
        return pick(a.name).localeCompare(pick(b.name));
      });
      fillOptions();
      bind();
      render();
    })
    .catch(() => {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${esc(t("f.error"))}</div>`;
    });
}

/* Optional submission relay for the GGC site.
 *
 * The site works without it: submit.html falls back to a prefilled GitHub
 * issue plus copy/Telegram. Deploy this only if you want visitors who have no
 * GitHub account to submit in one click.
 *
 * Cloudflare Workers (free tier is plenty):
 *   1. npm create cloudflare@latest ggc-submit -- --type hello-world
 *   2. replace src/index.js with this file
 *   3. wrangler secret put GITHUB_TOKEN     (fine-grained, Issues: read+write on the repo)
 *   4. wrangler deploy
 *   5. put the resulting URL in assets/js/ggc-core.js -> config.submitEndpoint
 *
 * Optional bindings:
 *   OWNER, REPO, LABEL  — vars, defaulting to the values below
 *   RATE                — a KV namespace; when bound, one IP gets 5 submissions/hour
 */

const DEFAULTS = { OWNER: "myggc", REPO: "myggc.github.io", LABEL: "submission" };
const MAX_BYTES = 24 * 1024;
const ACTIONS = ["new-company", "edit-company", "new-game", "edit-game"];

const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
});

const json = (body, status, origin) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors(origin) }
  });

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== "POST") return json({ error: "POST only" }, 405, origin);

    const raw = await request.text();
    if (raw.length > MAX_BYTES) return json({ error: "payload too large" }, 413, origin);

    let payload;
    try { payload = JSON.parse(raw); } catch { return json({ error: "invalid json" }, 400, origin); }
    if (!ACTIONS.includes(payload.action)) return json({ error: "unknown action" }, 400, origin);
    if (!payload.subject || String(payload.subject).length > 200) {
      return json({ error: "missing subject" }, 400, origin);
    }

    // Light per-IP throttle, only when a KV namespace is bound.
    if (env.RATE) {
      const ip = request.headers.get("CF-Connecting-IP") || "anon";
      const key = `rate:${ip}:${new Date().toISOString().slice(0, 13)}`;
      const seen = Number(await env.RATE.get(key)) || 0;
      if (seen >= 5) return json({ error: "too many submissions, try later" }, 429, origin);
      await env.RATE.put(key, String(seen + 1), { expirationTtl: 3600 });
    }

    const owner = env.OWNER || DEFAULTS.OWNER;
    const repo = env.REPO || DEFAULTS.REPO;
    const label = env.LABEL || DEFAULTS.LABEL;

    // Same body shape the site produces, so the admin queue parses it
    // identically whether it arrived here or straight from GitHub.
    const body = [
      `**ტიპი:** ${payload.action}`,
      `**სუბიექტი:** ${payload.subject}`,
      payload.contact ? `**კონტაქტი:** ${payload.contact}` : "",
      payload.note ? `\n${payload.note}` : "",
      "",
      "<!-- ggc:payload -->",
      "```json",
      JSON.stringify(payload, null, 2),
      "```"
    ].filter(Boolean).join("\n");

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "ggc-submit-worker"
      },
      body: JSON.stringify({ title: `[${payload.action}] ${payload.subject}`, body, labels: [label] })
    });

    if (!res.ok) {
      const detail = await res.text();
      return json({ error: "github rejected the submission", status: res.status, detail: detail.slice(0, 300) }, 502, origin);
    }
    const issue = await res.json();
    return json({ ok: true, number: issue.number, url: issue.html_url }, 200, origin);
  }
};

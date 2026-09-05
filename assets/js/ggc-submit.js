/* ==========================================================================
   GGC submission receiver — Cloudflare Worker
   --------------------------------------------------------------------------
   The public form at /join.html has no credentials, so it cannot write to the
   repository. This tiny service does it instead. The GitHub token lives here,
   as a secret on Cloudflare, and never reaches anyone's browser.

   DEPLOY (free, about ten minutes)

   1. Make a GitHub fine-grained token:
        Resource owner  myggc
        Repository      only myggc.github.io
        Permission      Contents: Read and write
      Do not put this token anywhere in the website repository.

   2. Cloudflare dashboard -> Workers & Pages -> Create -> Worker.
      Name it ggc-submit. Paste this whole file as the code and deploy.

   3. Worker -> Settings -> Variables:
        GITHUB_TOKEN   (encrypt it)   your token from step 1
        ALLOWED_ORIGIN               https://myggc.github.io

   4. Copy the worker address, then set it in join.html:
        const SUBMIT_ENDPOINT = "https://ggc-submit.<your-subdomain>.workers.dev";

   Submissions land as data/submissions/<id>.json, with the image alongside at
   assets/submissions/<id>.jpg. Re-sending with the same submissionId
   overwrites the same file, so a person editing and sending again produces one
   record, never a duplicate.
   ========================================================================== */

const OWNER  = "myggc";
const REPO   = "myggc.github.io";
const BRANCH = "main";
const MAX_BODY = 3 * 1024 * 1024;      // 3 MB, plenty for a 512px jpeg

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST")
      return json({ error: "POST only" }, 405, cors);
    if (!env.GITHUB_TOKEN)
      return json({ error: "not configured" }, 500, cors);

    let body;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY) return json({ error: "too large" }, 413, cors);
      body = JSON.parse(raw);
    } catch (e) {
      return json({ error: "bad json" }, 400, cors);
    }

    /* --- validate ------------------------------------------------------ */
    const id = String(body.submissionId || "").replace(/[^a-z0-9]/gi, "").slice(0, 40);
    const type = ["companies", "developers", "games"].includes(body.type) ? body.type : null;
    const name = body.payload && body.payload.name;
    const email = body.contact && body.contact.email;

    if (!id || !type || !name || (!name.en && !name.ka) || !email)
      return json({ error: "missing fields" }, 400, cors);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email)))
      return json({ error: "bad email" }, 400, cors);

    /* --- image (optional) ---------------------------------------------- */
    let imagePath = "";
    if (body.image && body.image.data) {
      const ext = ["jpg", "png", "webp"].includes(body.image.ext) ? body.image.ext : "jpg";
      imagePath = `assets/submissions/${id}.${ext}`;
      const ok = await put(env, imagePath, body.image.data, `submission image ${id}`);
      if (!ok) return json({ error: "image upload failed" }, 502, cors);
    }

    /* --- the record ----------------------------------------------------- */
    const record = {
      submissionId: id,
      type,
      status: "new",
      receivedAt: new Date().toISOString(),
      contact: { name: String(body.contact.name || "").slice(0, 120), email: String(email).slice(0, 160) },
      image: imagePath,
      payload: body.payload
    };

    const ok = await put(
      env,
      `data/submissions/${id}.json`,
      b64(JSON.stringify(record, null, 2)),
      `submission from ${record.contact.email}`
    );
    if (!ok) return json({ error: "save failed" }, 502, cors);

    return json({ ok: true, id }, 200, cors);
  }
};

/* ------------------------------------------------------------- helpers */

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...cors }
  });
}

function b64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

const gh = (env) => ({
  "Authorization": "Bearer " + env.GITHUB_TOKEN,
  "Accept": "application/vnd.github+json",
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "ggc-submit-worker",
  "Content-Type": "application/json"
});

/* write, replacing the file if that submission id already sent something */
async function put(env, path, contentB64, message) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;

  let sha = null;
  const head = await fetch(`${url}?ref=${BRANCH}`, { headers: gh(env) });
  if (head.ok) sha = (await head.json()).sha;

  const body = { message, content: contentB64, branch: BRANCH };
  if (sha) body.sha = sha;

  const r = await fetch(url, { method: "PUT", headers: gh(env), body: JSON.stringify(body) });
  return r.ok;
}

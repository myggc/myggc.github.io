# Submission relay — required

Someone fills in `submit.html` and presses send. That is the whole flow: no
GitHub account, no signup, no leaving the site, nothing to finish by hand.

A page served from GitHub Pages cannot do that on its own. Creating an issue
needs a GitHub token, and a token shipped inside the page would let anyone post
as GGC. So exactly one small thing has to hold that secret.

**Until one of these is deployed and its URL is in `config.submitEndpoint`, the
form cannot deliver anything and nothing reaches the admin queue.** Pick
whichever is easier — they behave identically and the site cannot tell them
apart. Option A needs nothing installed.

---

## Option A — Google Apps Script (no installs, ~3 minutes)

Deploys from a browser. Use this one if you do not want to touch a terminal.

1. Open [script.google.com](https://script.google.com) → **New project**
2. Paste [`apps-script.gs`](apps-script.gs) over `Code.gs`
3. **Project Settings → Script Properties → Add script property**
   - `GITHUB_TOKEN` = a fine-grained token for `myggc/myggc.github.io` with
     **Issues: Read and write** and nothing else
4. **Deploy → New deployment → Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
5. Copy the `/exec` URL

## Option B — Cloudflare Worker (needs npm)

```bash
npm create cloudflare@latest ggc-submit -- --type hello-world
cd ggc-submit
# replace src/index.js with submit-worker.js from this folder
npx wrangler secret put GITHUB_TOKEN
npx wrangler deploy
```

Optional bindings: `OWNER`, `REPO`, `LABEL` as vars; bind a KV namespace as
`RATE` to throttle one IP to 5 submissions an hour.

---

## Then, either way

Put the URL in [`assets/js/ggc-core.js`](../assets/js/ggc-core.js):

```js
submitEndpoint: "https://…",
```

That is the only change the site needs. Reload `submit.html`, send a test
submission, and it should appear in `admin.html` → ვალიდაციის რიგი.

## Notes

- The site posts the payload as `text/plain` on purpose. That keeps it a
  "simple" CORS request so the browser sends no preflight — which is what makes
  Apps Script usable as an endpoint. Both relays read the raw body, so the
  header costs nothing.
- Both relays validate the action and subject, cap the body at 24 KB and
  throttle, so an open endpoint cannot be used to spam the issue tracker.
- Both produce the same issue body the site would have produced by hand, so a
  submission looks identical to the admin queue however it arrived.
- Rotate the token by replacing the secret; nothing in the repository needs to
  change.

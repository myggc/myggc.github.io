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

## If a submission does not arrive

Open `admin.html` → პარამეტრები → **მიმღების შემოწმება**. It pings the endpoint
and reports what came back, which separates the three things that look alike
from the visitor's side:

| symptom | cause | fix |
| --- | --- | --- |
| "submitEndpoint ცარიელია" | no relay configured | deploy one above, paste the URL |
| "მიმღებამდე ვერ მივედით" | blocked by CORS, or the URL is wrong | for Apps Script, redeploy with *Who has access: **Anyone*** — the usual cause is "Anyone with Google account". Check you copied the `/exec` URL, not `/dev` |
| "მიმღები შეცდომას აბრუნებს" | the relay ran but GitHub refused | the token is expired, or lacks **Issues: Read and write** on this repo |

The browser console on `submit.html` also names the problem on a failed send.

## It also reads store pages

The relay does a second job, and this one is the difference between an import
that fills a studio in and one that sits there spinning.

To show a preview of an import, the browser has to read a Steam or itch page —
and it cannot: the stores send no CORS header, so the request is refused before
it starts. The site works around that with free public proxies, but they rot.
Seventeen were tried from `myggc.github.io` itself in September 2026 and exactly
one answered: `corsproxy.io` wants an API key, `api.allorigins.win` and
`api.codetabs.com` have stopped answering, and `proxy.corsfix.com` serves
localhost happily but replies `403 domain_not_registered` to the real site —
which is why this has to be measured where the visitors are, not on a laptop.

So one public proxy carries the whole load, and it rate-limits. That is what
made a studio import take two minutes and come back without its games.

Both relays now answer `GET ?action=fetch&url=…` with the page, and the site
tries that first. It only fetches the storefronts in `ALLOWED` — Steam, itch,
Apple, Google Play and the console stores — so the URL being public does not
turn it into an open proxy for anything else, and it can only ever read.

**Apps Script deployments are versioned: an already-deployed relay keeps running
the old code until you redeploy.** To pick this up: open the project → paste the
current `apps-script.gs` → **Deploy → Manage deployments** → pencil icon →
*Version*: **New version** → **Deploy**. The `/exec` URL does not change, so
nothing in the repository needs editing. Until then the site still works — the
relay's old reply fails the parse and the one live public proxy takes over — but
it is slow, and it stops working entirely whenever that proxy is busy.

`admin.html` → პარამეტრები → **მიმღების შემოწმება** says which of the two jobs
the deployed relay is doing, so there is no guessing about whether the redeploy
took.

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

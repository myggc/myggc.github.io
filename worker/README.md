# Optional submission relay

The site does **not** need this. Without it, `submit.html` finishes by handing
the visitor a prefilled GitHub issue, a Telegram link and a copy-JSON button —
all three land in the same place the admin panel reads.

Deploy this worker only to remove that last step for people who have no GitHub
account: the form then POSTs straight through and the visitor sees "გაიგზავნა".

## Deploy (Cloudflare Workers, free tier)

```bash
npm create cloudflare@latest ggc-submit -- --type hello-world
cd ggc-submit
# replace src/index.js with submit-worker.js from this folder
npx wrangler secret put GITHUB_TOKEN
npx wrangler deploy
```

`GITHUB_TOKEN` is a fine-grained personal access token limited to
`myggc/myggc.github.io` with **Issues: Read and write**. Nothing else.

Then set the URL in [`assets/js/ggc-core.js`](../assets/js/ggc-core.js):

```js
submitEndpoint: "https://ggc-submit.<your-subdomain>.workers.dev",
```

## Optional bindings

| binding | type | effect |
| --- | --- | --- |
| `OWNER`, `REPO`, `LABEL` | vars | override the defaults baked into the worker |
| `RATE` | KV namespace | throttles one IP to 5 submissions per hour |

## Why a relay at all

The token has to stay server side — a token shipped in the page would let
anyone open issues as GGC. The worker is the smallest thing that can hold it.
Any other host works the same way; the site only cares that the endpoint
accepts `POST` with a JSON body and answers `2xx`.

# Kikoe Audio — AI-delegated shopping sample (WebMCP + llms.txt)

A static sample site for a **fictional** wireless-earphone store, built for a world where people don't search Google themselves but hand exploring, comparing and operating to an AI agent. Design details and decisions are in [SPEC.md](SPEC.md).

Published at `https://sakanayuki.github.io/cc_webmcp/` (GitHub Pages project page, deployed by GitHub Actions).

## Status

| Layer | Status |
| --- | --- |
| Static HTML readable without JavaScript | done (Phase 1) |
| `llms.txt`, `llms-full.txt`, per-product `.md`, JSON-LD, `products.json`, `sitemap.xml`, `robots.txt` | done (Phase 1) |
| Cart, compare page, diagnostics, shared services | not started (Phase 2) |
| WebMCP imperative tools and declarative search form | not started (Phase 3) |
| Agent interoperability with a real client | **not tested** (Phase 4) |

Registration of WebMCP tools (when built) will never be reported as agent compatibility. Only a recorded real test can change `not tested`.

## Known limitation: sub-path hosting

Because the site lives under `/cc_webmcp/`, `llms.txt` is **not** at the domain root, and crawlers ignore `/cc_webmcp/robots.txt`. Mitigations: `<link rel="alternate">` in every page and links in the footer. CSP is set through a `<meta>` tag because GitHub Pages cannot send custom headers.

## Develop

```sh
npm ci
npm run build       # vite bundle + generate pages and AI-facing files into dist/
npm run validate    # consistency checks over dist/
npm test            # unit tests (vitest)
npm run e2e         # Playwright against dist served under /cc_webmcp/
npm run serve       # preview at http://127.0.0.1:4173/cc_webmcp/
```

If Playwright's browsers are not installed, run `npx playwright install chromium`, or set `PW_CHROMIUM_PATH` to an existing Chromium binary.

`data/products.json` is the single source of truth. Every HTML page, Markdown file, JSON-LD block, `llms.txt` and `sitemap.xml` is generated from it by `scripts/build-content.ts`.

## Deploy

1. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions** (one-time manual step).
2. Merge to `main`. The workflow `.github/workflows/deploy.yml` runs typecheck, unit tests, build, artifact validation and e2e tests, then deploys `dist/`.
3. Pull requests run the same checks without deploying.

## WebMCP API notes (verified 2026-10-28)

The official draft ([spec](https://webmachinelearning.github.io/webmcp), Draft Community Group Report, not a W3C Standard) exposes `document.modelContext` (not `navigator.modelContext`) with `registerTool`, `getTools` and `executeTool`; tools are unregistered through the `signal` option. The declarative form attribute names and `requestUserInteraction` were not confirmed in the spec text and must be re-verified before Phase 3. Browser flag and origin-trial requirements come only from secondary sources and are unverified.

# AI-Delegated Shopping Sample (WebMCP + llms.txt) — SPEC.md

Version: 0.2.0 (agreed via interview, supersedes the WebMCP Playground 0.1.0 draft)
Status: Implementation-ready, awaiting approval
Target: GitHub Pages, deployed by GitHub Actions

## 1. Purpose

A static sample site for a fictional wireless-earphone / audio store, designed for a world where people do not run a Google search themselves but delegate exploring, comparing and operating to an AI agent.

The site demonstrates four layers and reports them separately:

1. **Crawlable content**: what an AI can read without running JavaScript (HTML, per-product Markdown, JSON-LD, `products.json`, `llms.txt`).
2. **WebMCP tools**: what an AI can do in the browser (imperative tools plus one declarative form).
3. **Application correctness**: shared services behave correctly for both human UI and tools.
4. **Real agent interoperability**: measured only by real tests. Registration success never implies an agent can use the tools.

## 2. Decisions

| Topic | Decision |
|---|---|
| Domain | Fictional store, wireless earphones / audio, 24 products, a few categories |
| Hosting | GitHub Pages project page, `https://sakanayuki.github.io/cc_webmcp/` (sub-path, no custom domain) |
| Rendering | Build-time static HTML (MPA) plus light TypeScript for interactivity. No UI framework |
| Language | Japanese UI, content and `llms.txt`. Tool names, parameter names and schemas in English. Tool `description` in English with a Japanese gloss. `lang="ja"` |
| Images | Build-time generated SVG placeholders with rich `alt` text. No external images |
| Data | Fictional only. Cart and preferences in IndexedDB. No backend, API key or analytics |
| WebMCP API | Official draft only: `document.modelContext` (SecureContext). No `navigator.modelContext` fallback, no polyfill in production |
| Declarative | Implemented on the product search form, labelled "spec unverified / experimental" |
| Diagnostics | Full: support status, execution log, manual harness, simulate_error/delay, agent interoperability status |

## 3. Constraints from hosting on GitHub Pages

- The site lives under `/cc_webmcp/`, so `/llms.txt` is **not** at the domain root. The site states this limitation on its Compatibility page and in the README. Mitigations: `<link rel="alternate" type="text/markdown" href="…/llms.txt">` in every page head, and `llms.txt` linked from the footer.
- `robots.txt` at `/cc_webmcp/robots.txt` is **not** honored by crawlers (they read only the domain root). It is published for documentation purposes only, and this is disclosed.
- GitHub Pages cannot set custom HTTP headers (`_headers` does not apply). CSP is applied through `<meta http-equiv="Content-Security-Policy">`, with no inline scripts.
- All asset URLs use Vite `base: '/cc_webmcp/'`. Generated absolute URLs (sitemap, JSON-LD, `llms.txt`) are built from a single `SITE_URL` constant.

## 4. AI-facing surfaces (all generated at build time from `data/products.json`)

- `llms.txt`: site summary, link list (categories, products, policies, tool guide), per llmstxt.org format, in Japanese.
- `llms-full.txt`: concatenated full product specs and policies.
- `products/<slug>.html`: complete content without JS, with JSON-LD `schema.org/Product` (`Offer` with price, currency, availability).
- `products/<slug>.md`: the same content as Markdown.
- `products.json`: whole catalog as structured data.
- `sitemap.xml` and `robots.txt` (the latter documented as non-effective, see section 3).
- A policies page (shipping, returns, warranty) in HTML and Markdown, so an agent can answer policy questions.

Single source of truth: `data/products.json`. Every artifact is generated from it, and a build-time check verifies consistency.

## 5. Product data

```ts
type Product = {
  id: string;            // stable slug, e.g. "aurora-anc-pro"
  name: string;
  brand: string;         // fictional
  category: 'true-wireless' | 'neckband' | 'over-ear' | 'sport';
  priceJpy: number;      // tax included
  stock: number;         // 0..999
  specs: {
    batteryHours: number;
    caseBatteryHours?: number;
    weightG: number;
    anc: boolean;
    waterproof: 'none' | 'IPX4' | 'IPX5' | 'IPX7';
    codecs: string[];
    bluetooth: string;
    multipoint: boolean;
  };
  tags: string[];        // e.g. "commute", "gym", "work-calls"
  summary: string;       // Japanese
  description: string;   // Japanese
  rating: number;        // 0..5, fictional
};
```

24 fixed fictional products. Comparison axes: price, battery, weight, ANC, waterproof, codecs, multipoint. Data must make fuzzy requests solvable (e.g. "for commuting, under ¥30,000, good noise cancelling").

## 6. Architecture

- TypeScript + Vite (multi-page) + plain HTML/CSS. Node 22 for build.
- `scripts/build-content.ts` runs after the Vite build and writes the AI-facing files and product pages into `dist/`.
- Shared services used by both the human UI and WebMCP handlers: `CatalogService`, `CartService`, `AppStateService`, `DiagnosticsService`, `ApprovalService`. No duplicated business logic.
- `CartService` persists the cart in IndexedDB (schema version 1). Validation happens in service methods, not only in the UI or tool schemas.
- `WebMcpAdapter` is isolated and feature-detects `document.modelContext`. Tools are registered with `registerTool(tool, { signal })`, and aborting the `AbortController` unregisters them. Duplicate registration, reload and partial failure are guarded.
- Handlers return values that are serialized to JSON by the platform (`executeTool` resolves a JSON string). Service results `ServiceResult<T>` are converted at the boundary and never contain stack traces.

Layout:

```text
.
├── .github/workflows/deploy.yml
├── data/products.json
├── scripts/                 # build-content.ts, validators
├── src/
│   ├── main.ts, styles.css
│   ├── webmcp/ (adapter.ts, tools.ts, declarative.ts, compatibility.ts)
│   ├── services/ (catalog, cart, approval, app-state, diagnostics, validation)
│   ├── storage/indexed-db.ts
│   └── ui/ (cart, search, compare, diagnostics, ai-view, scenarios)
├── tests/ (unit/, e2e/)
├── index.html + page templates
├── package.json, tsconfig.json, vite.config.ts
├── README.md
└── SPEC.md
```

## 7. WebMCP tool catalog

All names and schemas in English. `annotations` are hints, not access control.

| Tool | Inputs | Notes |
|---|---|---|
| `search_products` | query?, category?, maxPriceJpy?, minBatteryHours?, anc?, waterproof?, tags?, sort?, limit? (<=24) | readOnlyHint |
| `get_product` | id | readOnlyHint, NOT_FOUND on miss |
| `compare_products` | ids (2..4) | readOnlyHint, returns aligned spec table |
| `view_cart` | none | readOnlyHint |
| `add_to_cart` | id, quantity? (1..10) | mutating, reversible, no approval |
| `update_cart_quantity` | id, quantity (1..10) | mutating, reversible, no approval |
| `remove_from_cart` | id | `consequentialHint`, requires user approval |
| `clear_cart` | none | `consequentialHint`, requires user approval |
| `navigate_to` | route (allowlist) | UI side effect, internal routes only |
| `get_app_state` | none | route, cart summary, WebMCP status |
| `simulate_error` | code (allowlist) | diagnostic |
| `simulate_delay` | durationMs 0..5000 | diagnostic, honors the `signal` passed to `execute` |
| `get_execution_log` | limit? 1..100 | redacted, bounded |

`set_theme` from the old draft is dropped (not part of the shopping story). Theme is a plain UI preference.

Order placement and the inquiry form are out of scope.

### Declarative form

The product search form (`GET`, query / max price / category) carries WebMCP declarative attributes (`toolname`, `tooldescription`, `toolparamdescription`; names to be re-verified against Chrome documentation before implementation). Its detection and result are shown separately from imperative tools, with the label "spec unverified / experimental". Without WebMCP or without JavaScript the form is an ordinary search.

### Approval policy

`remove_from_cart` and `clear_cart` never execute from an unconfirmed AI call. `ApprovalService` creates a pending operation scoped to the operation and item ID with a short expiry (default 60 s). The visible UI shows a confirmation dialog, and approval is single-use. No reusable global approval flag. If approval is not given or expires, the tool returns `APPROVAL_REQUIRED` / `APPROVAL_EXPIRED`. The same service enforces this for the human UI. Add and quantity changes need no approval.

## 8. Pages

1. **Home / catalog**: product list, search form, filters, cart link. Works without JS (search degrades to a static list).
2. **Product detail**: static content, add-to-cart enhancement.
3. **Compare**: select 2..4 products and view a table.
4. **Cart**: quantities, remove with confirmation, clear with confirmation.
5. **AI view**: the same product shown side by side as HTML, Markdown, JSON-LD and the `llms.txt` entry (what an AI reads).
6. **Scenarios**: copy-paste request prompts for a real AI client, with expected tool calls and expected results (the five-task comparison from the old draft).
7. **Diagnostics**: WebMCP status (`unsupported` / `available` / `registered` / `failed`), imperative and declarative reported separately, tool count, invocation stats, manual harness, error and delay simulation, log export and clear. **Agent interoperability** is `not tested` / `passed` / `failed`, set only by a recorded real test.
8. **About / Compatibility**: data boundaries, `llms.txt` and `robots.txt` sub-path limitation, browser and flag requirements with verified date, security limits.

Keyboard accessible, mobile-friendly, usable without WebMCP and without JS for reading.

## 9. Diagnostics and security

- Log every invocation (UI or AI): timestamp, source, tool, sanitized input summary, status, durationMs, error code. In-memory, bounded to 100, exported only by explicit user action.
- Measure separately: registration, direct tool execution correctness, agent discovery, agent end-to-end completion, cancellation behavior.
- Render with `textContent` / safe DOM APIs only. Treat product text and tool results as untrusted data. No `innerHTML` interpolation.
- Allowlisted routes only. Input validation for type, range, enum and length.
- No third-party scripts or analytics. CSP via meta tag, no inline scripts.

## 10. CI/CD (GitHub Actions)

`.github/workflows/deploy.yml`:

- Triggers: `pull_request` (verify only) and `push` to `main` (verify and deploy), plus `workflow_dispatch`.
- Steps: checkout, setup-node 22 with npm cache, `npm ci`, typecheck, unit tests, `npm run build`, **AI-artifact validation** (see below), Playwright e2e against the built `dist` served under `/cc_webmcp/`, then `actions/configure-pages`, `actions/upload-pages-artifact` (`dist`), and `actions/deploy-pages` as a separate job with `pages: write` and `id-token: write` permissions and `environment: github-pages`.
- Pin action major versions. Concurrency group `pages`, no cancel of in-progress deploys.
- **Manual step for the owner**: Settings > Pages > Source = "GitHub Actions" (and allow deployment from `main`).

AI-artifact validation checks that `llms.txt` links all resolve to built files, every product has HTML, Markdown and valid JSON-LD, prices and stock match across all formats, `sitemap.xml` covers all pages, and every generated file uses the `/cc_webmcp/` base.

## 11. Testing

- **Unit (Vitest)**: validation, catalog search and compare, cart, approval expiry and single-use, adapter detection states, log bounding and redaction.
- **e2e (Playwright, Chromium)**: human flows (search, compare, cart, confirm removal); JS-disabled reading of product pages; WebMCP flows using a **test-only stub of `document.modelContext`** injected with `addInitScript` (never shipped) to verify registration, schema, execute results, signal-based unregistration and approval gating.
- CI results from the stub prove adapter logic only. They are reported as such and never as browser or agent support.
- **Manual**: real Chrome with the required flag / origin trial and a compatible agent or inspector. Record browser version, flags, agent version and date in the README test matrix. Failure to discover tools is not an application failure.

## 12. Phases

1. **Content and static site**: data, build pipeline, pages, `llms.txt` and companions, deploy workflow. Exit: site deployed to GitHub Pages with all AI-facing files valid, no WebMCP required.
2. **Services and UI**: catalog, compare, cart, approval, diagnostics.
3. **WebMCP**: re-verify the API and attribute names against official sources and record URLs and date in the README; implement the adapter, imperative tools and the declarative form; stub-based e2e.
4. **Real interoperability**: manual test in real Chrome with a real agent; fill the test matrix and known limitations honestly.

## 13. Acceptance criteria

- [ ] Pages workflow builds, tests and deploys from `main` to `https://sakanayuki.github.io/cc_webmcp/`.
- [ ] `llms.txt`, `llms-full.txt`, per-product `.md`, JSON-LD, `products.json`, `sitemap.xml` are generated and pass validation.
- [ ] Product pages are readable with JavaScript disabled.
- [ ] Sub-path limitations for `llms.txt` / `robots.txt` are disclosed in the site and README.
- [ ] Search, compare and cart work through UI and tools using the same services, and the cart survives reload.
- [ ] `remove_from_cart` and `clear_cart` require item-scoped, single-use, expiring approval.
- [ ] Support states distinguish missing API from registration failure; imperative and declarative are reported separately.
- [ ] Agent interoperability is reported independently and shows `not tested` until a real test is recorded.
- [ ] Logs are bounded, sanitized, clearable and exportable.
- [ ] No backend, API key, paid service or third-party analytics.
- [ ] Usable on mobile, with keyboard, and in browsers without WebMCP.

## 14. Reference notes (verified 2026-10-28)

- Official draft: https://webmachinelearning.github.io/webmcp (Draft Community Group Report, not a W3C Standard). Exposes `document.modelContext` with `registerTool`, `getTools`, `executeTool`; unregistration via the `signal` option; tool annotations include `readOnlyHint`, `untrustedContentHint`, `consequentialHint`.
- Declarative attribute names and `requestUserInteraction` were **not** confirmed in the official text read. Treat them as unverified and re-check before Phase 3.
- Blog posts report flag / origin-trial requirements (Chrome 146 Canary flag, later origin trial). These are secondary and unverified.

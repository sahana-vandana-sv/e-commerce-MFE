# Day 2 — Large-scale MFE architecture notes (2026 sources)

Sources:

- Luca Mezzalira, *Micro-frontends best practices* — QCon London 2025 ([InfoQ, Apr 2025](https://www.infoq.com/news/2025/04/microfrontend-best-practices))
- Luca Mezzalira, *Migrating to micro-frontends* — QCon San Francisco 2025 ([InfoQ, Nov 2025](https://infoq.com/news/2025/11/micro-frontends-migration-qcon))
- Luca Mezzalira, *Building Micro-Frontends*, 2nd ed. (O'Reilly, 2025)
- [Module Federation 2.0 stable release](https://module-federation.io/blog/v2-stable-version) (Feb 2026) and [Handling remote rendering errors](https://module-federation.io/blog/error-load-remote) (Sep 2025)
- [Nx: Module Federation consumer and provider (v23+)](https://nx.dev/docs/kb/consumer-and-provider)
- [awslabs/frontend-discovery](https://github.com/awslabs/frontend-discovery) — shared JSON schema for micro-frontend discovery

## 1. Why organisations end up with 100+ micro-frontends

The 2025–26 consensus: micro-frontends are an **answer to an organisational problem, not a default architecture**. You adopt them when many teams need to ship one product independently; boundaries follow teams and business domains (Conway's law, Team Topologies).

- A micro-frontend is **the UI of one business subdomain**, owned end to end by one team.
- Deployments must be **independent, incremental and frequent** — if shipping `cart` requires a coordinated release of the shell, the split has failed.
- "100+ MFEs" is an **org-wide count** (dozens of teams × a few subdomains each), *not* 100 things on one page. Mezzalira's heuristic: if a single view needs ~25+ MFE instances at runtime, you've probably built a **distributed monolith** — boundaries are too fine-grained.

What the architecture costs, and what large orgs add to pay for it:

| Cost | 2026 mitigation |
| --- | --- |
| Duplicate dependencies in the payload | MF `shared` config; MF 2.0 adds **tree-shaking of shared deps** (only the used exports of e.g. a UI kit get shipped) |
| Hardcoded remote URLs don't scale to 100+ teams | **Discovery**: a registry/manifest (`mf-manifest.json`, frontend-discovery schema) the shell reads at runtime → per-team deploys, canary and blue/green |
| A broken remote takes down the page | Three layers: retry (`@module-federation/retry-plugin`) → loading fallback (`errorLoadRemote` runtime hook) → rendering fallback (React error boundary) |
| Teams stuck on different framework versions | **MF Bridge** (`@module-federation/bridge-react`): a remote exports a whole app with its own React (16–19) and router; the host mounts it without sharing React |
| Hard to see what is loaded from where | MF Chrome DevTools: shared-dependency and module-graph views |

## 2. Mezzalira's four decisions (still the framework in 2025–26)

Make them in order — each one constrains the next.

### 1) Definition — how do you slice?

- **Vertical**: one MFE per page / group of pages for a subdomain. Easiest to start with, one team per view.
- **Horizontal**: several MFEs share a view (product grid + mini-cart). More coordination; keep the count per view small.
- Design rules from the 2025 talks:
  - keep the MFE's public API tiny (one or two props/events);
  - keep domain state *inside* the MFE;
  - prefer flow over reuse, because every shared piece is coupling.

### 2) Composition — where are pieces assembled?

- **Client-side**: an app shell loads MFEs at runtime (Module Federation, import maps, single-spa).
- **Server-side / edge-side**: server or CDN composes HTML. MF 2.0 now supports SSR and Node consumption, so the line is blurring.

### 3) Routing — who maps URL → MFE?

- Usually the **app shell**, owned by a platform team and kept "vanilla" (framework-light, no domain logic).
- Rule of thumb: route **between** MFEs in the shell, route **inside** an MFE in the MFE.
- Smell: if a feature change in an MFE forces a change in the shell, the boundary is wrong.

### 4) Communication — how do MFEs talk?

- **Events** (`CustomEvent`/`EventTarget`, small pub-sub) are the recommended default.
- The **URL** is the contract for cross-page state and deep links.
- Avoid a shared global store — it re-couples releases.

## 3. How the 2026 tooling changes this repo's plan

- **Module Federation 2.0 is the baseline.** Our Day 1 uses webpack's built-in `ModuleFederationPlugin` (the MF 1.0 runtime). The 2.0 runtime lives in `@module-federation/enhanced` (webpack/Rspack), `@module-federation/rsbuild-plugin` and `@module-federation/vite`. It adds manifests, runtime `registerRemotes`/`loadRemote`, type hints, devtools and bridges.
- **Nx 23 dropped `host`/`remote` generators** (removed in v24) in favour of `@nx/react:consumer` / `@nx/react:provider`:
  - bundlers are **Vite (default), Rsbuild or Rspack** — no webpack;
  - remotes are **dynamic by default** (a `PROVIDERS` list in `src/mf.ts` + `registerRemotes`);
  - `nx serve <provider>` starts its consumer;
  - every remote is wrapped in an error boundary.
- **Different React versions (Day 6)** now have a first-party path: MF Bridge, instead of hand-rolled "mount into your own root" code.

## 4. Where this repo sits on each decision

| Decision | Our choice | When |
| --- | --- | --- |
| Definition | Vertical: `product-listing`, `cart`, `checkout` each own a subdomain; one horizontal case (cart reacting next to products) | Day 1 → 5 |
| Composition | Client-side Module Federation, shell as app shell | Day 1 |
| Routing | Shell owns top-level routes and lazy-loads one remote per route; remotes own their sub-routes | Day 4 |
| Communication | `CustomEvent` bus (product → cart), singleton auth context from the shell, URL for deep links | Day 5 |
| Discovery | Hardcoded URL today → runtime registry / manifest | Day 4 (dynamic remotes) |

## 5. What Day 1 already demonstrated

- **Every static remote loads at startup.** The shell fetched `remoteEntry.js` before the product list rendered, because share-scope init asks every static remote to register its shared versions. With 100 static remotes that's 100 requests at startup → why 2026 tooling defaults to **dynamic** remotes.
- **Error boundaries keep the shell alive.** With the remote stopped, the shell stayed up and showed a fallback — the rendering layer of the three-layer error strategy.
- **`shared` keys match exact imports only.** React was a singleton, but `react/jsx-dev-runtime` still came from the remote because the key `react` doesn't cover subpaths. MF Bridge docs call this out too: share `react-dom/` (trailing slash) so `react-dom/client` is covered.

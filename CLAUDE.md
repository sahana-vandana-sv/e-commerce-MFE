# CLAUDE.md

This file guides Claude Code when working in this repository. The goal of this repo is to learn Micro Frontend (MFE) Architecture hands-on, focused on these areas:

- Webpack Module Federation
- Managing large-scale MFEs (mental model for 100+ Micro Frontends)
- Monorepo management & shared module configuration
- Navigation & data sharing across MFEs
- Multiple React versions within a single host application

## Project overview

We are building a **Mini E-commerce Shell**: a host app plus several independently deployable React micro-frontends, inside a single monorepo.

Target architecture:

- `apps/shell` — Host application. Owns top-level routing, nav, and an auth/user context. Consumes remotes at runtime via Module Federation.
- `apps/product-listing` — Remote MFE. Exposes a `ProductList` component. Runs its own React version.
- `apps/cart` — Remote MFE. Exposes a `Cart` component. Reads data/events from `product-listing` and the shell's auth context.
- `apps/checkout` — Remote MFE. Exposes a `Checkout` component. Deliberately pinned to a different React major version than the shell, to force real handling of multi-version React.
- `packages/ui` (`@mfe/ui`) — Shared component library (Button, Card, design tokens) consumed by shell + all remotes. Source-only package (no build step; each app's babel-loader compiles it). Shared via Module Federation as a non-singleton.
- `packages/shared-utils` — Shared non-UI utilities (formatting, event bus helpers, types).

Start simple (plain Webpack host + one remote) and evolve into the full monorepo — don't scaffold everything on day one.

## Working agreement for Claude Code

- Prefer small, explainable diffs over large generated scaffolds. This is a learning project — after any non-trivial change, briefly explain *why* the Module Federation / monorepo config is set up that way, not just what changed.
- When editing `webpack.config.js` federation blocks (`exposes`, `remotes`, `shared`), always explain the effect of `singleton`, `eager`, `requiredVersion`, and `strictVersion` if you touch them.
- Never silently upgrade a package version in a remote that's intentionally pinned for the multi-version React exercise (see Day 6) without flagging it first.
- When adding a new remote or shared package, update this file's "Project overview" section and the relevant day's checklist below.
- Ask before introducing a new top-level tool (e.g. switching from Nx to Turborepo, or Webpack to Rspack/Vite) — these are deliberate learning milestones, not incidental choices.

## Repo conventions

- Package manager: pnpm (workspace defined in `pnpm-workspace.yaml`; each app declares its own deps — no reliance on hoisting)
- Monorepo tool: Nx 23, used as a task runner over the pnpm workspace. Targets are inferred from each package's `package.json` scripts (`serve`, `build`); `nx.json` only adds caching and marks `serve` as continuous. We don't use Nx's MF generators — as of Nx 23 they only support Vite/Rsbuild/Rspack.
- Module Federation: MF 2.0 runtime via `@module-federation/enhanced/webpack` (not webpack's built-in `container.ModuleFederationPlugin`). `dts: false` because the repo is JavaScript.
- Dev ports: shell `4000`, product-listing `4001`, cart `4002`, checkout `4003` (3000 is avoided — clashes with other local Next.js projects)
- Each app/package should be independently runnable (`nx serve <app>`) as well as runnable together via the host.
- Shared dependencies (`react`, `react-dom`) should be declared explicitly in each federation config's `shared` block — don't rely on implicit hoisting to paper over version issues.
- Workspace packages in `shared` (e.g. `@mfe/ui`) need an explicit `requiredVersion` read from the package's own `package.json`. Apps depend on them via `workspace:*`, which MF would otherwise turn into `*` (accept any version).

## Seven-day learning plan

Use this as a checklist. Check off each day's build goal before moving on.

### Day 1 — Module Federation fundamentals

- [x] One host, one remote, expose and consume a single component (`shell` consumes `productListing/ProductList` via webpack's built-in `ModuleFederationPlugin`)
- Reference: [module-federation-examples](https://github.com/module-federation/module-federation-examples) (`basic-host-remote`, `create-react-app`)
- Docs: https://webpack.js.org/concepts/module-federation and https://module-federation.io

### Day 2 — Large-scale MFE architecture patterns (reading day)

- [x] Read and summarize: why orgs split into 100+ MFEs, and the 4 decision pillars (definition, composition, routing, communication) → [docs/day-2-architecture-notes.md](docs/day-2-architecture-notes.md)
- Mezzalira, MFE best practices (QCon London 2025): https://www.infoq.com/news/2025/04/microfrontend-best-practices
- Mezzalira, migrating to MFEs (QCon SF 2025): https://infoq.com/news/2025/11/micro-frontends-migration-qcon
- Book: Mezzalira, *Building Micro-Frontends*, 2nd ed. (O'Reilly, 2025)
- Module Federation 2.0 stable (Feb 2026): https://module-federation.io/blog/v2-stable-version
- Discovery at scale: https://github.com/awslabs/frontend-discovery
- Background (2019, foundational): https://martinfowler.com/articles/micro-frontends.html

### Day 3 — Monorepo & shared module configuration

- [x] Migrate the project into an Nx monorepo (hand-migrated: Nx 23 task runner + webpack + MF 2.0 `@module-federation/enhanced`)
- [x] Extract a shared `packages/ui` library consumed by host + remote (`@mfe/ui`: `Button`, `Card`, `tokens`)
- Nx 23 consumer/provider (replaces the deprecated host/remote generators; Vite/Rsbuild/Rspack only): https://nx.dev/docs/kb/consumer-and-provider
- Nx shared library versions: https://nx.dev/docs/technologies/module-federation/concepts/manage-library-versions-with-module-federation
- Docs: https://nx.dev/docs/technologies/module-federation, https://module-federation.io

### Day 4 — Navigation across MFEs

- [ ] Add React Router in the shell; route-based lazy loading of remotes
- [ ] Handle deep links correctly
- MF 2.0 runtime API (`registerRemotes` / `loadRemote`) — the pattern Nx 23 generates in `src/mf.ts`: https://module-federation.io
- React Router integration across remotes (MF Bridge): https://module-federation.io/guide/bridge/react/load-app
- Reference: "Dynamic Remotes" examples in module-federation-examples

### Day 5 — Data sharing across MFEs

- [ ] Implement cross-MFE communication: shared auth/user context (singleton) + an event bus (CustomEvent/EventTarget or small pub-sub) so `cart` reacts to `product-listing`
- Reference: "Bi-Directional Hosts" example in module-federation-examples
- Concept reading: Luca Mezzalira's "Micro-frontends decisions framework" (communication pillar)

### Day 6 — Multiple React versions in one host

- [ ] Pin `checkout` to a different React major version than the shell
- [ ] Get it rendering correctly without duplicate-React / invalid-hook errors
- Key config: `shared` → `singleton`, `requiredVersion`, `strictVersion`; isolated `ReactDOM` root per remote when versions diverge
- Watch out: `@mfe/ui` is shared in the `default` scope and bundles React 19's `react/jsx-runtime` wherever it's provided. A React 18 `checkout` must not pick up the shell's copy — plan for this (separate share scope, own copy, or Bridge).
- 2026 first-party path: MF Bridge (`@module-federation/bridge-react`, `createBridgeComponent` / `createRemoteAppComponent`, React 16–19): https://module-federation.io/guide/bridge/react/getting-started — build it by hand first, then compare with Bridge
- Reference: "Different React Versions" examples in module-federation-examples

### Day 7 — Bring it together + scale review

- [ ] Full end-to-end run: shell + 3 remotes + shared lib + monorepo + routing + data sharing + mixed React versions
- [ ] Write a short retro doc: what broke, what the #1 failure mode was (usually shared dependency mismatches), and how you'd document ownership boundaries for a real 100+ MFE org
- Reference for scale/tooling patterns: https://github.com/module-federation/core
- Resilience (retry plugin, `errorLoadRemote`, error boundaries): https://module-federation.io/blog/error-load-remote

## Useful commands

Prefix with `pnpm` (e.g. `pnpm nx serve shell`) unless Nx is installed globally.

```bash
pnpm install                          # install all workspace packages
pnpm start                            # = nx run-many -t serve (every app's dev server)
nx serve shell                        # host only → http://localhost:4000
nx serve product-listing              # remote only → http://localhost:4001 (standalone)
pnpm build                            # = nx run-many -t build (cached)
nx graph                              # build-time dependency graph (MF remotes don't appear: they're runtime-only)
nx show projects --affected --files=packages/ui/src/Button.jsx   # what a ui change affects
```

## Do not

- Do not remove the intentional React version mismatch in `checkout` — that's the Day 6 exercise, not a bug.
- Do not collapse all remotes into the host's build "to make it simpler" — the point is independent deployability.

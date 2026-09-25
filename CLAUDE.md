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
- `packages/ui` — Shared component library (Button, Card, design tokens) consumed by shell + all remotes.
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
- Monorepo tool: starts plain, migrates to Nx on Day 3 (see plan below)
- Dev ports: shell `4000`, product-listing `4001`, cart `4002`, checkout `4003` (3000 is avoided — clashes with other local Next.js projects)
- Each app/package should be independently runnable (`nx serve <app>` or `npm start` from its folder) as well as runnable together via the host.
- Shared dependencies (`react`, `react-dom`) should be declared explicitly in each federation config's `shared` block — don't rely on implicit hoisting to paper over version issues.

## Seven-day learning plan

Use this as a checklist. Check off each day's build goal before moving on.

### Day 1 — Module Federation fundamentals

- [x] One host, one remote, expose and consume a single component (`shell` consumes `productListing/ProductList` via webpack's built-in `ModuleFederationPlugin`)
- Reference: [module-federation-examples](https://github.com/module-federation/module-federation-examples) (`basic-host-remote`, `create-react-app`)
- Docs: https://webpack.js.org/concepts/module-federation and https://module-federation.io

### Day 2 — Large-scale MFE architecture patterns (reading day)

- [ ] Read and summarize: why orgs split into 100+ MFEs, and the 4 decision pillars (definition, composition, routing, communication)
- Reference: https://martinfowler.com/articles/micro-frontends.html
- List: https://github.com/ColinEberhardt/awesome-micro-frontends

### Day 3 — Monorepo & shared module configuration

- [ ] Migrate the project into an Nx monorepo
- [ ] Extract a shared `packages/ui` library consumed by host + remote
- Reference: https://github.com/hemantajax/mfe-react, https://github.com/JustalK/LABORATORY-MICROFRONTEND
- Docs: https://nx.dev/docs/technologies/module-federation, https://nx.dev/docs/kb/react-micro-frontends

### Day 4 — Navigation across MFEs

- [ ] Add React Router in the shell; route-based lazy loading of remotes
- [ ] Handle deep links correctly
- Reference: "Advanced API" / "Dynamic Remotes" examples in module-federation-examples
- Blog: https://h3manth.com/posts/dynamic-remotes-webpack-module-federation/

### Day 5 — Data sharing across MFEs

- [ ] Implement cross-MFE communication: shared auth/user context (singleton) + an event bus (CustomEvent/EventTarget or small pub-sub) so `cart` reacts to `product-listing`
- Reference: "Bi-Directional Hosts" example in module-federation-examples
- Concept reading: Luca Mezzalira's "Micro-frontends decisions framework" (communication pillar)

### Day 6 — Multiple React versions in one host

- [ ] Pin `checkout` to a different React major version than the shell
- [ ] Get it rendering correctly without duplicate-React / invalid-hook errors
- Key config: `shared` → `singleton`, `requiredVersion`, `strictVersion`; isolated `ReactDOM` root per remote when versions diverge
- Reference: "Different React Versions" example in module-federation-examples

### Day 7 — Bring it together + scale review

- [ ] Full end-to-end run: shell + 3 remotes + shared lib + monorepo + routing + data sharing + mixed React versions
- [ ] Write a short retro doc: what broke, what the #1 failure mode was (usually shared dependency mismatches), and how you'd document ownership boundaries for a real 100+ MFE org
- Reference for scale/tooling patterns: https://github.com/module-federation/core

## Useful commands

Current (pre-Nx):

```bash
pnpm install                          # install all workspace apps
pnpm start                            # run every app's dev server in parallel
pnpm --filter shell start             # host only → http://localhost:4000
pnpm --filter product-listing start   # remote only → http://localhost:4001 (standalone)
pnpm build                            # production build of every app into its dist/
```

After the Day 3 Nx migration (planned):

```bash
nx serve shell
nx serve product-listing
nx run-many --target=serve --projects=shell,product-listing,cart,checkout
nx graph
```

## Do not

- Do not remove the intentional React version mismatch in `checkout` — that's the Day 6 exercise, not a bug.
- Do not collapse all remotes into the host's build "to make it simpler" — the point is independent deployability.

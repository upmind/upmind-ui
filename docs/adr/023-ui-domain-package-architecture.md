# ADR 023: UI Domain Package Architecture

**Date:** June 15, 2026
**Updated:** June 15, 2026 — §10 rewritten as a two-axis SSR-safe state model (brand-invariant shared cache + per-user request scope), after reviewing the `@next-legacy` scope-based composables (`modules/scope/`). They are built and SPA-correct; the SSR gap is that the scope registry, `QueryClient`, and session-store are module-level (per-process) rather than per-request — fixable at one chokepoint (`ensure()`). **Accepted 2026-06-16** — all Open Questions (Q1–Q4) resolved.
**Status:** Accepted — amended 2026-08-25 (constraint 5 narrowed), 2026-09-07 (Amendment 1: a phased strangler replaces the big-bang wave), 2026-09-08 (Amendment 2: four scope rulings, UNRATIFIED), 2026-09-11 (Amendment 3: a generic control is not a domain renderer — ratified, and it supersedes part of Amendment 2 ruling 1), 2026-09-15 (Amendment 4: genericness admits to `foundation` alongside the count — ratified 2026-09-16, WITHDRAWN 2026-09-17), 2026-09-17 (Amendment 7: `basket` may read `client`, and the subject rows go home — ratified), 2026-09-21 (Amendment 9: the §8 feature contract is retired — the app owns its renderer list, its routes and its route names — ratified 2026-09-25), 2026-09-24 (Amendment 11: Phase 0 holds only what Phase 0 needs), 2026-09-25 (Amendment 13: a domain package holds only UI concerns; the rest lives in `headless` — ratified 2026-09-28), 2026-09-28 (Amendment 14: the theme belongs to the app; useAnnouncement lives in foundation; both ports are removed) and 2026-09-28 (Amendment 15: a page takes its templates from the page that mounts it; catalogue imports domain when a category needs it; headless stays as develop has it; the shell socket and the DAC port are removed). See the Amendments below.
**Authors:** Dom da Costa

---

## Context

Complex, Upmind-aware UI organisms currently live in one package, `@upmind-automation/client-vue`. The cart is shipped; the next surfaces (client portal, admin, auth, payment) plus brand variants (velia, hosting) are coming. A single monolithic UI package does not scale to that, and the `ui` library is being brought in as a first-class monorepo citizen (no longer a submodule, no longer forced to be Upmind-agnostic).

We are **deprecating `client-vue`** and re-homing its organisms into smaller domain packages.

### Constraints (binding)

1. **Internal-only, source-consumed.** Apps consume package *source* via pnpm-workspace aliases (`packages/*/src`). No registry publishing, no semver, no per-package dist. A package boundary is an **enforced dependency direction + a discoverability unit**, not a build artifact. *Why packages over plain folders (which an eslint barrier could also wall off): only a package gives a **compiler-enforced TypeScript project-reference boundary** — incremental-rebuild-scoped and checked by `tsc -b`, not just a lint pass. That compiler edge is what earns the per-package ceremony at this scale.*
2. **Acyclic.** The dependency graph must be a clean DAG; existing cycles must be broken.
3. **Collapse velia + hosting into a single configurable `cart`** (no fork).
4. **Teams aspirational.** Optimise current DevX; keep team-independence possible; do not over-fit ownership.
5. **`ui` stays presentational** (dumb by preference, may now know `headless`); `headless` is already cleanly modular. *(Narrowed 2026-08-25 to `ui`'s `src/components/` tree — see the Amendment below.)*
6. **Nuxt is the de-facto app platform going forward.** **`cart-nuxt` is the de-facto app; the existing Vite apps (`cart`, `velia`, `hosting`) are *deprecated, not migrated*** — velia/hosting variation is re-homed as cart-nuxt config/layers (Q3). Every surviving app targets Nuxt, moving to **SSR/SSG** for speed and SEO. (cart-nuxt is SPA today; SSR is the direction — greenfield, not a migration. **Enabling SSR is a separate workstream from this package cut** — see §10.)
7. **Brand is always resolved from the path/domain**; the BE returns the brand's settings bundle **with its id** on every request.

This ADR is grounded in the module-foundation docs (`<agent-runner>/workshop-bundle/02-module-foundations/*`) and the headless reference (`docs/published-docs/developers/reference/headless/*`) — the canonical domain taxonomy — not invented nomenclature.

---

## Decision

### 1. Package philosophy

- **Stands alone → its own package.** A thing earns a package if it can operate from a primitive input (e.g. an id) without wiring in a sibling. Cannot stand alone (needs a specific parent) → it is a **folder inside that parent**.
- **Arrows point one way.** Overlap and shared dependencies are expected; the only rule is acyclicity. Shared things sink *low* so consumers reach down to them.
- **Two edge kinds:** imports down the layers (shared bases) + one-way sibling imports within the buy-funnel. Cross-context composition that would otherwise point *up* is done via **slots / injected renderers / routing flows**, never an upward import.

### 2. The three layers (resolves Open Q1 — the `ui`/`foundation` line)

Deciding rule: *does `ui`'s own primitives need it → `ui`; does it know about Upmind domains/features/brands → `foundation`.*

| Layer | Owns | Notes |
|-------|------|-------|
| `ui` | dumb primitives · CVA engine (`cva`/`useStyles`) · `registerEntry` · the dumb `Form` (renderers via prop) · **`useThemes`** (the theme *engine* + active-theme store) | Presentational. `useThemes` stays here because primitives read the active theme config — moving it up would invert the layer. |
| `headless` | composables + XState machines + TanStack Query | Depends only on `i18n`, `types`. **Will split** → `headless` (pure-JS core) + `headless-vue` (reactive wrapper); the "composables come from headless" rule then reads "from `headless-vue`". |
| `foundation` (★ shared base) | brand · system · feedback · **brand→theme selection** · `useFeatures`/`defineFeature` · the renderer registry + inject (`useFormRenderers`) · the form-host wrapper · `useRouting` (funnels) | App-glue: the parts that know about Upmind domains, features, brands. |
| domain packages | Upmind-aware organisms | Built on `ui` + `headless` + `foundation`. |

**Two invariants keep `foundation` a *layer*, not a re-grown monolith:**

> **Admission rule** — a thing earns a place in `foundation` only if **≥2 domain packages depend on it AND it knows no single domain**. Domain-specific things register *into* foundation via the socket (§7); they don't live there. *(A second route — admission on genericness alone — was proposed by [Amendment 4](#amendment-4-2026-09-15--genericness-admits-to-foundation-not-only-the-count) and withdrawn on 2026-09-17 by [Amendment 7](#amendment-7-2026-09-17--basket-may-read-client): the grant matrix that stranded its instance was the thing to change. The rule above is the only route.)*
>
> **Admitted below the count, 2026-09-14 — the announcer port.** `foundation`'s announcement port serves ONE domain package (`invoice`), not two. Ruled in by the operator, on the grounds that message banners are a general capability other boxes are expected to need. Recorded here rather than left to be re-argued.
>
> The supporting observation, which the ruling does not turn on: the count is a sensible test for a **kit** — code that could simply be copied into two packages. It reads oddly against a **port**, which is a single seam everything must meet at; two of them is not a duplicate, it is a broken connection. `foundation` already owns three ports that never met a count: the renderer registry, the routing socket and the shell socket. Whether ports are exempt *as a class* is NOT settled by this ruling and remains open.
>
> **Registry-ownership** — renderer/route/flow **entries** live in the contributing package's `feature.ts` (§8); `foundation` owns only the **empty typed registries + the inject API**. If entries lived in `foundation`, then `foundation → {product, domain}` — and since every domain imports `foundation`, that is a real typed cycle. This invariant is what keeps the socket pattern (§7) acyclic.

### 3. Roster & dependency graph

Ten domain packages (★ = shared base) plus the layer/support packages:

| Package | Holds | May import |
|---------|-------|-----------|
| ★ `foundation` | brand · system · theming-glue · feedback · app-wiring | `ui`, `headless` |
| ★ `product` | read · configure · seat + shared rendering kit (public barrel) | `ui`, `headless`, `foundation` |
| `recommendations` | upsell/cross-sell widgets | + `product` |
| `catalogue` | browse: catalogue · categories | + `product`, `recommendations` |
| `domain` *(optional)* | domain search / DAC + its renderers | + `product` |
| `auth` | login · register · 2FA · recover (the `session` module) | `ui`, `headless`, `foundation` |
| `client` | addresses · emails · companies · phones | + `auth` |
| `payment` | make-payment | `ui`, `headless`, `foundation` |
| `invoice` | invoice/order view (`useOrder` = `useInvoice`) | + `payment`, `recommendations`, `auth` |
| `basket` | in-flight order: basketProduct · billing · promo · currency · **checkout flow** | + `product`, `recommendations`, `auth`, `payment`, `invoice`, `client` |

Support: `i18n`, `types`, `icons`. *(`icons` (ADR 003) sits on the floor with `types`/`i18n`. Caveat: its current `@icons`-alias → built `dist/assets` model is per-package dist, which constraint 1 forbids under source-consumption — reconcile during build-out: either source-consume the assets or treat `icons` as the one allowed asset-only dist exception.)*

Topological order:

```text
types, i18n, icons (leaf floor) → ui, headless → foundation → product → recommendations → {catalogue, domain}
                                     auth → client → basket
                                     payment → invoice
                                     basket (top of buy-funnel) → product, recommendations, auth, payment, invoice, client
```

Acyclic by construction. `product`, `recommendations`, `payment`, `auth` are low/shared; `basket` is the top of the buy-funnel.

> **This table grants; it does not describe.** The column is *May import*, so a row is a permission, and a permission can go unspent. Two are, measured 2026-09-14:
>
> - **Nothing imports `recommendations`.** Not `invoice`, not `basket`, not `catalogue`, and no `client-vue` module at all. Its two components are mounted **directly by the apps** — two pages in `cart`, one in `cart-nuxt`. That is the shape §7 intends: a cross-cutting package arrives through the socket or from the host, not by a sibling importing it. The three grants stand for the day one of them needs it.
> - **`client` does not spend its `auth` grant.** Nothing in that box asks who is signed in yet, because the surface that would is the one still to be built.
>
> Read a row as "this edge would be legal", never as "this edge exists". A phase that creates an edge because the table lists it has misread the table.

### 4. Taxonomy (from the foundation docs — corrects intuitive but wrong groupings)

- **No "order" domain.** `useOrder` is an alias for `useInvoice`; an order is a type of invoice. A basket *is* the order pre-conversion (`/orders/{id}`); after `convert` the same id is an invoice (`/invoices/{id}`). → the package is named **`invoice`**.
- **"checkout" is a flow, not a module** — it lives **inside `basket`**.
- **`basket` is the in-flight order** — accumulates products, prices, discounts, attaches address + payment method, converts. `basketProduct`, `billing`, `currency`, `promotions` are basket child actors → folders inside `basket`.
- **`payment` is standalone** — *makes* a payment given an invoice id (`paymentDetails` *captures* intent inside basket/checkout; `payment` *executes*).
- **`auth` ≠ `client`** — `auth`/session resolves *who* you are; `client` is the editable profile and depends on `auth` for the client id.

### 5. Breaking the existing cycles

- ~~`Promotion.vue` → `ui`~~ → **`product`'s pricing kit** *(revised by Amendment 1 change 6: a promotion is cart/commerce opinion, so it cannot sit in a presentational library. Still kills `product → basket-product`.)*
- the misfiled `product/Recommendations.vue` → the `recommendations` package (kills `product → recommendations`).
- `basket-product` → **`basket`** (domain ownership); it consumes `product`'s public components as a downward dependency.
- `catalogue`'s DAC (`catalogue/products/WidgetDAC.vue`) currently **hard-imports `domain`** → reroute it through the provision-field renderer socket (§7), so `domain` stays a genuinely optional package rather than a hard dependency of the (non-optional) browse surface.

### 6. No `headless` re-export

A package barrel exports **only its own UI**. Composables come from `headless` directly. **Discoverability triad:** `Upm*` = a domain organism · `use*` = a `headless` composable · bare PascalCase (`Button`) = a `ui` primitive.

### 7. Optional & cross-cutting packages (the socket rule)

A package *rendered inside* a lower one (which would force an upward import) is wired via a **socket**, never an import:

- **`domain`** is optional. `domain → product` (pricing) is one-way; `product` does **not** import `domain`. A product's SLD provision field renders the domain renderer through the **provision-field renderer registry** (the existing `DomainRenderer` mechanism), injected — not imported. **`catalogue`'s DAC field uses the same socket** — `catalogue` does **not** import `domain` either (today it does; rerouting it is part of §5). This is what keeps `domain` *optional*: nothing non-optional statically depends on it.
- **`recommendations`** is its own package (appears on product pages, checkout, invoices). `recommendations → product`; `product` does **not** import `recommendations`.

### 8. Feature wiring (`defineFeature`)

> ⚠️ **RETIRED by [Amendment 9](#amendment-9-2026-09-21--the-feature-contract-is-retired-the-app-owns-its-list-its-routes-and-its-names) (2026-09-21, ratified 2026-09-25).** `defineFeature`, `useFeatures` and the three registries are gone, and with them every package's `feature.ts`, `nuxt.ts` and Nuxt plugin. An app now composes one renderer array from the published arrays of the packages it depends on, and provides it once. Read this section for the shape that was proposed, not for how a package reaches a host.

Each package self-describes its contribution through one uniform contract:

```ts
// packages/<pkg>/src/feature.ts — default export, identical signature everywhere
import type { Router } from 'vue-router'

// The contract this ADR proposes. `foundation` owns `defineFeature` and the
// empty typed registries; the entries below live in the contributing package.
type FeatureContext = {
  addRenderers: (renderers: Record<string, unknown>) => void
  addRoutes: (routes: unknown[]) => void
  registerFlows: (register: (engine: Router) => void) => void
}

declare function defineFeature(feature: {
  name: string
  setup: (ctx: FeatureContext) => void
}): unknown

declare const domainRenderers: Record<string, unknown>
declare const domainRoutes: unknown[]
declare function useDomainFlows(): { register: (engine: Router) => void }

export default defineFeature({
  name: "domain",
  setup(ctx) {
    ctx.addRenderers(domainRenderers);
    ctx.addRoutes(domainRoutes);            // funnels/routes
    ctx.registerFlows((engine) => useDomainFlows().register(engine));
  }
});
```

Contributions land in the `foundation` registries (`useFeatures`, `useFormRenderers`, `useRouting`); forms/router read from them. This contract is framework-agnostic; the **loader is Nuxt-native** (§9).

### 9. Platform: Nuxt modules + layers

Nuxt is the universal app platform. Composition aligns with Nuxt's own primitives rather than a parallel hand-rolled system:

> ⚠️ **The loader claim no longer holds** — [Amendment 9](#amendment-9-2026-09-21--the-feature-contract-is-retired-the-app-owns-its-list-its-routes-and-its-names) (2026-09-21, ratified 2026-09-25). No package ships a Nuxt module. The first bullet below describes a mechanism that no longer exists; the layer and brand-variant halves of this section still bind.

- **Features → thin per-package Nuxt modules.** Each package ships `@upmind-automation/<pkg>/nuxt` (a `defineNuxtModule`) that registers the package's `defineFeature` contribution (renderers, routes/funnels, plugins). The app's `nuxt.config` `modules: [...]` is the uniform feature list — Nuxt's module system *is* the loader. This also gives feature **route registration** natively (modules/layers contribute pages).
- **Brand variants → Nuxt layers.** velia/hosting become **layers that `extends` the base `cart`** and override tokens/slots/components — the idiomatic no-fork variation mechanism (informs Open Q3).
- **Packages stay framework-core-agnostic.** The organisms are Vue + `headless` only (portable, standalone-usable, protects the `widgets` story). Nuxt coupling lives in the thin `/nuxt` adapter, never in the components.

### 10. Per-brand & per-user state — SSR safety (Open Q2)

**Governing rule:** *no mutable, user-specific state may be created at module-evaluation time.* On an SSR server one Node process serves every request; any module-level `let`/`const` instance, module-scope `interpret()`, or module-scope `new QueryClient()` is shared across requests → user B sees user A's session/basket/locale. State splits on **two axes**, each with one mechanism. The earlier framing ("the only per-request value is *which brand am I*") was **wrong** — session, basket, locale and the routing interpreter are per-*user* too.

**Axis 1 — brand-invariant (shared, process-global).** Brand config (theme · feature set · funnel/route definitions · settings · org config) is **identical for all users of a brand**:

> **brand** (from path/domain, constraint 7) → **BE returns one settings bundle** (*with its id*) → **brand-keyed cache** (`Map<brandId, BrandConfig>`) → resolved per request.

Safe to share, bounded (brands are finite). **Key by brand/org, never by individual client** (unbounded → memory leak). `useThemes`/`useFeatures`/`useRouting` read `cache[brandId]`; funnels become a per-brand BE service cached the same way. **Cache invalidation:** the bundle is versioned/TTL'd (or busted on an explicit signal) so a BE-side brand change isn't served stale from a long-lived SSR process — "bounded + finite" addresses memory, not staleness. *(Today brand is **not** brand-keyed — it is six module-level `let`s in `useBrand`; this cache must be built — see SSR readiness.)*

**Axis 2 — per-user (request-scoped).** Session · basket · locale · the routing interpreter · recaptcha/feedback/recommendations · **and the TanStack `QueryClient`** are per-user. The scope-based composables (`@next-legacy`) already give us the seam: every scoped instance is created through one chokepoint — **`ensure(scopeKey, factory)`** in `modules/scope/scope.registry.ts`, each wrapped in its own detached `effectScope`. The only SSR change is **where the per-user state lives**:

- Today the scope registry is a **module-level `Map`** (`scope.registry.ts:23`) — per-process, so under SSR it is shared across requests. The fix: `ensure()` resolves its registry from a **per-request context** (owned by the Nuxt app instance), with the module `Map` as SPA fallback. Because every scoped composable goes through `ensure()`, **making this one Map per-request makes them all request-isolated at once** — no per-composable rewrite.
- A **`defineNuxtPlugin` (server + client)** creates that per-request context — the registry, a fresh `QueryClient`, and the session-store — `provide`s it, and on `app:rendered` **dehydrates the `QueryClient` → payload** (client branch hydrates). `headless` stays Nuxt-free: it is *given* the per-request registry resolver (§9), never importing Nuxt. Render-time composables run under `nuxtApp.runWithContext()` so async boundaries keep the request scope.

**Reconciling with ADR 001.** ADR 001 keys composables by `.as(actor).for(context,id).inBrand(brand)`. The two segments map to the two axes: **`.inBrand(brand)` → Axis 1 (keyed, shared)**; **`.as(actor).for(context,id)` → Axis 2 (keyed, but the keyed map is owned by the *request scope*, not a module Map)**. "Key by client id" (ADR 001) and "never key by individual client" (Axis 1) are both correct *at their own layer*; the only bug is collapsing them into one module-level store. **ADR 001's scope-key builder + registry ARE implemented in `@next-legacy` (`modules/scope/`)** — they isolate instances by scope key *within a process*, but the registry has no per-request lifecycle, so it is not yet SSR-safe. Axis 2 is therefore **not a from-scratch build: the seam exists; the work is giving the registry (and the `QueryClient` and session-store) a per-request lifecycle.** ADR 001 therefore **gates enabling SSR** even though it does not gate the package cut — its registry's lifetime *is* the SSR fix.

**Per-route SSR/SPA is the scoping lever.** Nuxt `routeRules` make the render boundary match the state boundary:

- **Public, brand-only routes** (landing · catalogue · product) → `{ ssr: true }` — render-time needs brand config + locale only (both safe). SEO/TTFB win.
- **Authenticated/stateful routes** (basket · checkout · account) → `{ ssr: false }` — depend on session/basket; SSR-rendering them is the highest leak risk with no SEO value. Client-only initially.
- **Hard rule: render-time code must never touch session.** The classic trap is the shared header (cart count, "Hi {name}") and `useLocale`/`useI18n` — locale must be **resolved per request from the request** (Accept-Language / brand default), never a module singleton; SSR-route headers render from brand+locale only.

**SSG:** static generation has no request — a brand-keyed cache populated per brand at build time covers Axis 1; Axis 2 is inherently client-only on a static page (hydrated SPA islands). State which routes are SSG vs SSR, or drop "/SSG" from the claim.

#### SSR readiness — gaps to plug (verified against `@next-legacy` @ `d9f609da1`, 2026-06-15)

The scope-based composables are built and well-designed *for SPA*, but the port is **not SSR-safe yet**: three per-process singletons are shared across requests once `ssr: true` is set. Ranked by blast-radius (each verified against `@next-legacy` source, cited inline):

1. **The scope registry `Map` is module-level** (`modules/scope/scope.registry.ts:23`, `const registry = new Map(...)`). *This is the one that matters most — and the cheapest to fix*: it is the single chokepoint (`ensure()`), so making it per-request fixes **every** scoped composable at once. Scope keys are `(name, actor, context, brand)` — **not** keyed by session identity, so `.as('client')` is shared across all client users under SSR. → per-request registry (Axis 2).
2. **`QueryClient` is module-level** (`modules/query/client.ts:5`, `export const queryClient = new QueryClient(...)`). One shared cache co-mingles every user's API data. → construct per request inside the context; dehydrate/hydrate.
3. **`session-store` is module-level *and* browser-coupled** (`session-store.store.ts:153`, `export const sessionStore = new Store(...)`; plus BroadcastChannel / localStorage / cookie listeners in `session-store.sync.ts`). → per request, and guard the browser-only sync behind `import.meta.client`.
4. **The `Upmind` orchestrator is a module-level singleton** (`useUpmind.ts:479`, `const upmind = new Upmind()`) whose `init()`/`initDebugging()` read `window.location` — implicitly client-only. → its per-request equivalent is the Nuxt plugin in Axis 2; keep the browser bits client-side.
5. **Locale is render-time** (consumed by routing/query). → request-scoped before any route flips to SSR, else pages render in the last request's language.

**Gate:** until 1–3 land, **`ssr: true` is forbidden repo-wide.** The flip is unblocked only by a **2-concurrent-request cross-user isolation spec** (registry / session / basket / brand / locale) running green.

### 11. Enforcement (the acyclic guarantee)

- `import/no-cycle` + `import/no-internal-modules` (ship with the installed `eslint-plugin-import`), on day one.
- Generalise the existing `@internal/no-cross-module-imports` barrier plugin to a per-package resolver.
- TypeScript **project references** as the compiler-level guard; `sideEffects` flags for tree-shaking. **Caveat:** §8's additive feature registration is a deliberate side effect — `sideEffects` must list the `feature.ts`/entry modules, or an over-eager `sideEffects: false` silently drops registered features from the bundle. The "lazy / per-feature chunks" claim also needs explicit dynamic `import()` boundaries (build-out): under source-consumption there is no per-package dist to lazy-load by default.
- **No** turbo/nx/lerna/changesets — they cache per-package dist builds, of which there are none under source consumption.

---

## Consequences

### Positive

- The import path is a map; a generated `PACKAGES.md` + per-package `CLAUDE.md` keep humans and agents from hunting.
- Features are genuinely optional (omit the package/module) and lazy (per-feature chunks).
- One consistent state model (§10): brand-invariant config in a brand-keyed shared cache; per-user state (session/basket/locale/query) in a per-request scope. The scope-based composables already provide the seam (`ensure()`); SSR-safety is making the scope registry (+ QueryClient + session-store) per-request — a focused lifecycle change, not a rewrite (see §10 SSR readiness).
- Nuxt modules/layers do the composition + route + variation work for us instead of bespoke wiring.
- Apps stay thin; brand variants share packages (and layers) instead of duplicating organisms.

### Costs / required work

- `product` must publish a **curated public barrel** instead of deep-internal reach.
- Renderer/route aggregation moves out of `client-vue`'s central `Form` wrapper into per-package `feature`/Nuxt-module contributions.
- A migration off `client-vue` (Open Q4).
- Each package needs a thin `/nuxt` adapter.
- **Per-request lifecycle for the scope registry, `QueryClient`, and session-store (§10, Axis 2)**, provisioned by a Nuxt plugin, plus the brand-keyed cache. The scope seam already exists (`ensure()`) — this is a focused lifecycle change, not a rewrite — but it is a hard predecessor to enabling SSR.

---

## Migration (big-bang wave)

> ⚠️ **SUPERSEDED by [Amendment 1](#amendment-1-2026-09-07--a-phased-strangler-replaces-the-big-bang-wave) (2026-09-07).** Delivery is a phased strangler — one package per phase, an operator gate between phases, `client-vue` deleted last. The pre-flight shape, the coverage watchlist and the `invoice`-last tranche below all still bind; only the one-wave delivery model is replaced. Read this section for that retained detail, not for the shape of the run.

Move all `client-vue` modules into the 10 packages in **one dependency-ordered wave** — parallel agents, the regression suite as the single gate. Source-only (`git mv` + alias + import-rewrite); no strangler, no shim. Mechanical work with a mechanical check (`tsc -b` + lint + suite) — same risk profile as the FE-2820 lint/rename wave.

**Scope of this wave:** purely the *mechanical re-homing of modules into packages*. It is **independent of the scope-registry/SSR work (§10)** — that is a separate workstream gating only `ssr: true`, not this migration. Do not block or sequence the wave on it.

Shape: **pre-flight** (STEP 0 barrel-eager-load fix · break the two cycle files · `import/no-cycle` → ERROR · stand up the 10 shells + aliases) → **parallel worktree movers** (bases `foundation`/`product` first, `basket` last) → **codemod** `cart-nuxt`'s imports (the only surviving consumer — the other apps are deprecated, §6) → **`tsc -b` + full suite gate** → delete `client-vue`. Rollback = revert the branch. velia/hosting variation via Q3.

**Coverage (audited 2026-06-15): GO-WITH-WATCHLIST.** The buy-flow e2e net covers the high-traffic populated areas; near-empty areas (client UI, theming) are safe regardless. The gambles are unit-dark internals:

- **`invoice` / orders — HIGH:** no unit tests, no dedicated spec (covered only as a side-effect of confirmation). Move **last, as its own revertable tranche**, after a smoke spec on invoice/order detail.
- **`basket` / `payment` / `feedback` machines — med:** broad e2e but unit-dark XState machines; land each behind its green e2e, add thin transition tests as follow-ups.
- **`catalogue` / `domain` / `recommendations` — med:** strong e2e; cover the dark pure utils as cheap follow-ups.

Detailed batches, agent ownership, and codemod specifics come from the **full implementation plan run against this ADR + issues** — not baked here.

---

## Open Questions (to resolve before / during implementation)

1. **velia / hosting → `cart` consolidation (Q3) — resolved.** Most variation is **brand data** (theme now; features + funnels once the BE serves them) → no code, no build. Bespoke markup → a thin **Nuxt layer** dropped into the organisms' named slots. So **hosting = config-only (no layer)**, **velia = a thin layer** on the base cart. *Velia inspected (2026-06-15): the delta is **~45% brand-data / ~50% slot-components / ~5% structural**. The slot half is **9 bespoke Vue components injected into existing `<Upm>` named slots** (footer, logo, basket pricing, product-config pricing). The structural 5% is **a single item — the URL prefix `/order/cart/` vs `/order/basket/`, a one-line config change**; the funnel machine, guards, route names, and all pages are byte-for-byte identical to base cart (no velia-only pages, no extra/reordered checkout steps). The "velia = thin layer" premise holds — no fork.*
2. **Migration off `client-vue` (Q4) — resolved as a single big-bang wave; *re-resolved as a phased strangler* by [Amendment 1](#amendment-1-2026-09-07--a-phased-strangler-replaces-the-big-bang-wave).** The regression suite is the safety net (precedent: the FE-2820 lint/rename wave). Pre-flight (cycle fixes, package shells + aliases, `import/no-cycle` → ERROR), then all modules move in one **dependency-ordered, parallel-agent wave**; codemod the in-repo app imports; `tsc -b` + full suite as the **single gate**; delete `client-vue`. No strangler, no `@deprecated` shim (velia/hosting handled via Q3). See the *Migration* section above (GO-WITH-WATCHLIST audit).
3. **`product`'s public API surface — resolved (proposed barrel, lock during extraction).** Derived from actual cross-module usage — the public barrel is the cross-boundary-consumed set (~17 symbols): config/views kit (`Config`, `ConfigErrors`, `ConfigSkeleton`, `NotFound`), hero kit (`ProductHero`, `ProductHeroSkeleton`, `ProductImage`, `PRODUCT_HERO_DIRECTION`), pricing atoms + list (`CurrentPrice`, `ExPrice`, `Pricing`, `PricingSkeleton`, `PricingTotal`), `TermCard`, card kit (`ProductCard`, `ProductCardSkeleton`), and `PRODUCT_TEMPLATE`. **~22 components stay internal** (actions, card/term sub-components, layout templates, `product.config.ts`). Three edge cases resolve via §5, not a new decision: `SubproductCard`/`TermCard`'s `Promotion` import → `Promotion` moves to `ui`; the misfiled `product/Recommendations.vue` → `recommendations` (drop from barrel); `SubproductCardPricing` has no cross-boundary consumer → drop.
4. **Detailed Nuxt wiring — starting shape drafted; validate during build-out.** Proposed shape: each package ships `@upmind-automation/<pkg>/nuxt` = a `defineNuxtModule` that (a) registers the package's `defineFeature` contribution (renderers, routes/funnels, plugins) into the `foundation` registries, and (b) contributes its pages via `extendPages`. The app's `nuxt.config` `modules: [...]` is the uniform feature list, **ordered to mirror the DAG** (`foundation/nuxt` first → domains → `basket/nuxt` last). Brand variants: **velia = a Nuxt layer** (`extends`) overriding tokens + dropping its 9 slot components (Q1); **hosting = config-only**. Per-brand funnels: a module registers the *capability*; the **active** funnel/route set is **brand-resolved per request** from the brand bundle (§10 Axis 1), never baked at build. *Validate against cart-nuxt during build-out:* module-execution order vs registry population, layer `extends` order, and that build-time module registration composes with request-time brand-driven funnels (the §9 ↔ §10 seam).

---

## Amendment (2026-08-25) — `ui` hosts the vendored form engine; constraint 5 narrows to `src/components/`

**Scope:** narrows binding constraint 5 only. The layer table (§2), the package roster and DAG (§3), the socket rule (§7), the feature-wiring contract (§8) and the state model (§10) stand unchanged.

**What changes.** Constraint 5 ("`ui` stays presentational") is narrowed to: **`ui`'s `src/components/` tree stays presentational.** `ui` additionally hosts one vendored, non-presentational subtree — the JSONForms form engine at `src/form/**` — which §2 already assigns to the `ui` layer (`registerEntry`, the dumb `Form` with renderers via prop). The subtree sits outside `COMPONENT_SPEC.md`'s scope and outside the composed-component contract; it carries its own dependencies (`@jsonforms/*`, `ajv`, `lodash-es`, `libphonenumber-js`) and imports no `@upmind-automation/*` package. Nothing under `src/components/` may import them.

**Why the narrowing is required, and why it is only a narrowing.** The engine sits at the `ui` layer's DAG position either way — §2's layer table already put `registerEntry` and the dumb `Form` there — so this is a placement decision, not a layering one. What could not survive unqualified is the word *presentational*: a `rankWith` tester registry, an error-collection and translation pipeline, and a validation-mode state machine are not presentational, and they now live in `ui`. Splitting the subtree out to keep the old wording would have created a second physical home for a live engine, which is the divergence failure class ADR 024's August 19, 2026 amendment closed.

**What `foundation` keeps.** Unchanged: the form-host wrapper, `useFormI18n`, and the renderer registry + `useFormRenderers` inject that will replace today's `additionalRenderers` prop. None of it is built or moved by this work; the wrapper stays in `client-vue` until the package cut, and the engine's departure leaves that cut smaller, not larger.

**See also** ADR 024's amendment of the same date, which records the engine's home (`@upmind/ui` at `src/form/**`), the five dependencies `ui` gains, and the Upmind-domain renderers that stay in `client-vue`.

---

## Amendment 1 (2026-09-07) — a phased strangler replaces the big-bang wave

> **Provenance.** The original text of this amendment is not in this repository. It is reconstructed from the twelve phase issues written against it on 2026-09-07 (FE-3188 … FE-3199), each of which names "ADR 023 + Amendment 1" as its binding record and cites the change numbers below. Those issues were written by Dominic da Costa; the amendment's own text was reconstructed by an agent and is NOT operator-ratified. One item could not be reconstructed and is marked open at the end.

**Scope.** Supersedes the *Migration (big-bang wave)* section and Open Question 2's "single big-bang wave" resolution. Also supersedes §5's placement of `Promotion.vue` (change 6) and the consumer set implied by constraint 6 (change 2). The roster and DAG (§3), the taxonomy (§4), the no-`headless`-re-export rule (§6), the socket rule (§7), the feature-wiring contract (§8), the platform shape (§9) and the state model (§10) stand unchanged.

**What changes.** Delivery is a **phased strangler**, one package per phase, not one dependency-ordered wave:

1. **`client-vue` is deleted last**, in its own phase, after every consumer is off it — not as the tail of a single wave.
2. **All apps come off it first, and stay deployable throughout.** The consumer set is **cart, cart-nuxt and portal-nuxt** — `portal-nuxt` did not exist when this ADR was written, and `cart` is still the shipped Vue app, so constraint 6's "deprecated, not migrated" does not exempt either from per-phase wiring.
3. **The shell is app-owned.** Page, layouts, header and footer belong to each app, not to `ui` and not to `foundation`.
4. **`auth` and `payment` each also ship as a standalone app**, booting from a redirect/return-target input and depending only on their own package plus the shared bases. This is the decoupling proof: a package that cannot boot alone is not decoupled.
5. **`foundation` is grown minimally per phase**, not built up front. Each phase adds only the glue its box needs; a closing sweep in the final phase migrates whatever residual no single box pulled.
6. **`Promotion.vue` goes to `product`, not `ui`.** A promotion is cart/commerce opinion, so it cannot sit in a presentational library. It lands in `product`'s pricing kit — the shared base both `product` and `basket` reach down to — which still kills the `product → basket-product` cycle §5 identified.

**Unchanged and held.** The pre-flight shape survives intact: the STEP 0 barrel eager-load fix, the two cycle breaks, `import/no-cycle` set to ERROR, and the ten package shells with their aliases and project references. It is applied at the phased run's start (Phase 0) rather than ahead of a wave. The coverage watchlist also holds: `invoice` moves in its own revertable tranche behind a smoke spec authored first, and the unit-dark basket/payment/feedback machines land behind their green e2e.

**The "Placement Ladder" citation is retired (2026-09-08).** Phase 0 and Phase 10 cited a Placement Ladder by rung — rung 2 for the `Promotion.vue` ruling, rung 0 for the app-owned shell. That text was never in this repository and is not recoverable from the citations. It is not owed, because both rungs it produced are recorded above as rulings that bind on their own, and the one open decision that reached for it — where the shared `manage` kit lands, in Phase 7 — is already answered by **§2's admission rule**: `foundation` earns a thing only if two or more domain packages depend on it and it knows no single domain. A consumer count decides it; no rung lookup is required. Phase 7's story was re-pointed at §2 accordingly.

---

## Amendment 2 (2026-09-08) — four scope rulings before the run

**Scope.** Four scope decisions recorded before Phase 0. Additive to Amendment 1; nothing in the Decision changes.

> ⚠️ **UNRATIFIED.** An agent authored these; the operator has not ratified rulings 1, 3 or 4. Ruling 2 is ratified — the operator created FE-3202 for it and confirmed the velia/hosting retirement on 2026-09-08. Treat rulings 1, 3 and 4 as a proposal until ratified.

1. ~~**The Upmind-domain renderers ride their domain phase.**~~ *(Partly superseded by Amendment 3, 2026-09-11: the assignment stands for the genuinely domain-subject renderers and is withdrawn for `Image` and the `Filter*` family.)* **The Upmind-domain renderers ride their domain phase.** ADR 024's 2026-08-25 amendment leaves the domain renderers in `client-vue` to "move into their domain modules with the ADR 023 package cut", and named no phase. They are assigned per box: Gateways and PaymentDetails → `payment`; SubProduct and Terms → `product`; Domain and SLD → `domain`; the collection `Filter*` family → `catalogue`; Address and Manage → `client`; Image → `product`. No dedicated renderer phase.
2. **velia and hosting are retired in their own phase, before the delete.** Both still import `client-vue` (47 and 40 files), so the final phase's "no consumer imports `client-vue`" criterion cannot pass while they stand. A phase ahead of it re-homes velia's slot components and hosting's configuration into cart-nuxt per Open Question 1, then retires both apps.
3. **The standalone `auth` and `payment` apps stay in their phases** (Amendment 1 change 4), rather than deferring to a follow-up.
4. **`ui` means `design-system/packages/ui`.** Per ADR 024's 2026-08-19 amendment, the library's single home is the `design-system` submodule and the in-tree copies are deleted. The ten packages' project references target the submodule's workspace package; the leftover `packages/ui` working tree from the old library is removed.

---

## Amendment 3 (2026-09-11) — a generic control is not a domain renderer

**Scope.** Corrects part of Amendment 2 ruling 1, and closes two placements the Decision never made. Ratified by the operator on 2026-09-11. Nothing in the three layers, the roster or the socket rule changes.

**The test.** A renderer belongs to a domain package only if its *subject* is that domain. The test is its tester, not its filename: a tester keyed on an Upmind ui type (`Terms`, `SubProducts`, `Manager`, `address`) or an Upmind semantic marker (`semantic_type: domain_name`, `format: sld`) names a domain. A tester keyed on a presentational shape (`format: file`, `format: search`, `format: range`, `format: button-group`, `format: toggle-group`, `hasOption("lookup")`) names a field type, and a field type is the design system's.

1. **Six controls leave the domain packages for the design system.** `Image`, `Lookup`, `FilterBar`, `FilterButtonGroup`, `FilterToggleGroup`, `FilterSearch` and `FilterRange` are generic. None calls product, catalogue or any other feature. They join the 28 controls the design system already ships, in their own story ahead of Phase 6 — an ADR 024 change plus a gitlink bump, not a phase.

   Two of them need Upmind behaviour, and the seam for that already exists: `foundation`'s form wrapper calls `provideFormEngineData({ countries, ensureCountries })`, which is how the design system's `PhoneRenderer` gets its country list without importing `headless`. `Lookup` takes its lookup function and `Image` its upload function the same way. `FilterRange` needs only the `RequestFilterOperator` constant, which travels with it.

   **This changes no rule.** `foundation`'s registries still ship empty; the design system's controls are the engine's defaults, not registry contributions.

2. **`Image` is not product's, and Phase 4 is corrected rather than left standing.** Its tester claims any field of format `file` or option type `image`; it calls no product code; and the fields it renders are produced by the shared `useFields` parser for registration (`auth`), basket fields and client custom fields alike — product provision fields are one caller of four. It returns to `client-vue` in Phase 4's own branch and leaves for the design system with the other five. Consequence recorded: `portal-nuxt` takes no `client-vue`, so it has no file-upload control until that story lands; no live surface renders one today.

3. **`Lookup` was assigned nowhere, and ours REPLACES the design system's.** Amendment 2 ruling 1 named fourteen of the fifteen renderers; `LookupRenderer` is named nowhere in this record.

   Two controls of that name exist, both at rank 3 — the design system's keyed on the data schema (`schema.lookup`), `client-vue`'s on the uischema options (`options.lookup`). They are not duplicates and the design system's is not the base. `client-vue`'s is the superset: given a `service` thunk in `options.lookup` it runs a live search through `useLookup` with paging and a total, and with no service it falls back to the embedded option list — which is the whole of what the design system's control does. The design system's own comment asks whether anything needs the async half; `client-notes` does, for linking a contract product, and it is the only lookup field the codebase produces.

   So `client-vue`'s moves down and the design system's is deleted, with `useLookup` handed in through `provideFormEngineData` beside the country list. One control, one rank, no tie possible.

   **Nothing is broken meanwhile.** No schema in this repository carries `schema.lookup`, so the design system's control never fires and the rank tie is latent rather than live. That is what makes this safe to defer to the same story as the other five.

4. **`Domain` and `SLD` stay in `domain`; `Address` and `Manage` stay in `client`.** `Domain` and `SLD` call no Upmind behaviour either, but their testers key on Upmind's own field vocabulary, so their subject is the domain. Recorded as deliberate, not overlooked. `Manage`'s placement follows wherever Phase 7 lands the shared `manage` kit under §2's admission rule.

5. **`product-setup` belongs to `basket`.** The module was claimed by no phase. It is basket-bound end to end: the funnel state is `ROUTE.BASKET_PRODUCTS_SETUP` (`prev: basket`, `next: checkout`); `guardProductSetup` gates the funnel and the address step keys off its completeness; headless `useProductSetup` has no machine of its own and is a selector over `useBasket`, `useBasketProducts` and `basketProductServices`; `ApplyToOthers` acts across the basket; and `checkout` embeds the same form inline. Added to Phase 9 as another child folder alongside `basketProduct`, `billing`, `currency` and `promotions`.

   Separately: the portal's `product-area/setup` is a **different** surface with the same name — a post-purchase provisioning blueprint for a product the client already owns, with no basket in sight. It is new capability outside this ADR, and `apps/portal-nuxt/docs/client-vue-adoption.md` promises `UpmProductSetup` for it in one table while its own gap list records that the component cannot serve it. That table needs correcting.

**Why this is worth a record rather than a judgement call each time.** Fifteen renderers were treated as one kind of thing because they shared a folder. Seven of them are not domain renderers at all, and the folder was the only thing saying otherwise. The test in this amendment is what stops the next one being filed by its neighbours.
## Amendment 4 (2026-09-15) — genericness admits to `foundation`, not only the count

**Scope.** Adds a second admission route to §2's rule. Additive to Amendments 1–3; the three layers, the roster, §3's grant matrix and the socket rule are unchanged.

> ⚠️ **WITHDRAWN 2026-09-17 — superseded by [Amendment 7](#amendment-7-2026-09-17--basket-may-read-client).** Ratified on 2026-09-16 and withdrawn the next day, on a measurement nobody had taken. It is kept in full because the route it proposed will be argued again, and the reason it failed is the useful part: its instance was not stranded. The text below stands as written on 2026-09-15; the paragraph under **The instance** is measurably wrong, and Amendment 7 shows the measurement.

**The rule.** §2 admits a thing to `foundation` on a measured count — two or more domain packages depend on it, and it knows no single domain. A presentational component that carries no domain behaviour may also be admitted on **genericness alone, without the count**, when §3's grant matrix would otherwise strand it in a package no other consumer can reach.

Both halves are required. *Presentational and behaviour-free* means props in, markup and events out: no composable, no machine, no fetch, no save. A domain TYPE on the props is not domain behaviour — `foundation` already depends on `headless`, and `modules/manage/types.ts` is domain-typed, behaviour-free code sitting there today. *Stranded* means §3, not a preference: the count route is unavailable because the grant matrix forbids the second consumer from ever existing, so waiting for it is waiting for something the architecture has foreclosed.

**The instance.** `AddressItem`, `CompanyItem` and `PhoneItem` — the rows `Manage` renders through its `item` slot. Each takes one headless type (`Address`, `Company`, `Phone`), renders a title, a description and an edit link, and emits `edit`. Their only importers are `client-vue`'s `TabBusiness` and `TabPersonal`, which §3 re-homes into `basket` at Phase 9 — one domain package, so the count is one and always will be. §3 grants `basket` no `client` and `client` no `basket`: left in `basket`, no account-side surface could ever render a saved address or company, though the markup is the same on both sides. They move to `packages/modules-foundation/src/modules/manage/`, beside the frames that render them.

**Why this is narrower than it reads.** The count exists to stop `foundation` re-growing into the monolith it replaced, and behaviour is what made that monolith heavy. This route admits no behaviour at all: anything with a composable, a machine or a call in it still faces the count. A component that fails the count and is NOT stranded by §3 also still faces it — it waits for its second consumer, because one may arrive.

---

## Amendment 7 (2026-09-17) — `basket` may read `client`

**Scope.** Adds one edge to §3's grant matrix, moves three components, and withdraws Amendment 4. Numbered 7 because Amendments 5 and 6 are Phase 10's, both withdrawn on the day they were written; a branch below that phase does not carry their text yet. The three layers, §2's admission rule, the socket rule and every other row of the matrix are unchanged. Ratified by the operator on 2026-09-17.

**The grant.** `basket` may import `client`. The edge points down — `client` reads only `ui`, `headless`, `foundation` and `auth`, and may never read `basket` — so the graph stays acyclic and `client` sits between `auth` and `basket` in the topological order.

**The three rows go home.** `AddressItem`, `CompanyItem` and `PhoneItem` move from `packages/modules-foundation/src/modules/manage/` to `packages/modules-client/src/rows/`, and ship from `client`'s barrel. The manage FRAMES stay in `foundation` on §2's count, untouched: three files in `basket` mount them and one in `client` mounts them, and they know no subject, because every row, schema and mutation arrives through the injected `useList` / `useMutate` pair.

**Why Amendment 4 fell.** Its case rested on one sentence — the rows have one consumer, "so the count is one and always will be". Measured at the Phase 10 branch tip, in source, outside tests:

| Row | drawn in `basket` | drawn in `client` |
|-----|-------------------|-------------------|
| `AddressItem` | `billing/TabPersonal.vue` | — |
| `CompanyItem` | `billing/TabBusiness.vue` | — |
| `PhoneItem` | `billing/Tab{Personal,Business}.vue` | — |

No `client` surface draws them yet, so the count is one today. "Always will be" is the flaw: only §3's grant matrix stranded them, and this amendment changes the matrix instead.

**Why the edge rather than a socket.** Three facts, each measured on the branch:

1. **The data edge already exists.** `basket`'s billing tabs call seven `client-*` composables from `headless` — addresses, companies and phones, each with its editor. Checkout already reads and writes the customer's own records; only the markup was walled off.
2. **No app pays for it.** Every app that ships `basket` already ships `client`: `cart`, `cart-nuxt` and `velia-nuxt`. Only `portal-nuxt` takes `client` alone.
3. **A socket would have to be invented.** `foundation`'s only registry takes form-renderer entries (§7), not row components, and the billing tabs sit six components below the app. Handing the rows in would mean threading slots through all six or minting a second registry mid-migration — indirection with no consumer asking for it.

**What this does NOT license.** The edge is granted for the rows the two surfaces genuinely share, not as a general opening of `client` to the buy funnel. `client`'s composables still come from `headless` (§6), the profile panels stay internal to `client`, and any further name `basket` takes from `client` is a decision on its own evidence, the same as this one. §3's own warning still binds: the table grants, it does not describe.

**What travels with it.** `PhoneItem` has one consumer today, in `basket`. It still goes to `client`, because §3 names phones among `client`'s four subjects and because the direction of the new edge makes `client` the only home both surfaces can reach.

---

## Amendment 9 (2026-09-21) — the feature contract is retired; the app owns its list, its routes and its names

**Scope.** Retires §8 in full. Corrects §9's claim that the Nuxt module system is the loader.
Corrects §2's `foundation` row and its parenthetical count of ports. The three layers, §2's
admission rule, §7's socket rule for the *optional-package* case, the roster and the DAG are
otherwise unchanged.

> **Ratified by the operator on 2026-09-25.**

**The ruling.** Two steps, the same day. First: routes and funnel flows belong to the app, not to
a registry in `foundation`. Second, on the contract itself — *"I would rather get rid of it and
avoid inventing new patterns/features/composables where possible."* Extended later the same day:
a package holds **no route knowledge at all** — not the records, and not the route-name
vocabulary.

**Why it falls, measured rather than argued.** §8 was written as a proposal (*"The contract this
ADR proposes"*), and the built article did not earn its own ceremony:

1. **Four of the nine boxes contribute nothing.** `basket`, `catalogue`, `invoice` and
   `recommendations` each shipped a `feature.ts` whose `setup` was empty, and each file said so in
   prose. Each named the same justification: `useFeatures().has("<name>")` is "the fact a host can
   read."
2. **Nothing read that fact.** `useFeatures().has(...)` occurred seven times in the repo: four
   package doc comments, one README line, and two lines of `apps/portal-nuxt/docs/`. There was no
   runtime reader.
3. **The route half had two contributors and two readers, and they were the same two boxes** —
   the `auth` package feeding the `auth` app, the `payment` package feeding the `payment` app. No
   third party sat between them. Every contributed record made a round trip through `foundation`
   to reach an app that already imported it.
4. **Cart registered a flow registrar and never drained it.** Nothing in `apps/cart` or
   `apps/cart-nuxt` called `useRouting().register(router)`, and with `routes: false` no record
   carried the `meta.authReturnTarget` the registrar's guard fired on. The contribution was inert
   twice over.
5. **The renderer half turned a one-line static import into a five-step round trip.** The engine's
   own extension point is a prop (`design-system/packages/ui/src/form/Form.vue:113` defaults
   `additionalRenderers: () => []`; `:190-193` concatenates it). `develop` fills that prop with one
   static import (`packages/client-vue/src/components/form/Form.vue:33,7`). The registry had the
   app build the list, wrap it in a feature, post it to a module-level `shallowRef`, `foundation`
   read it back, and `foundation` pass the prop.
6. **Three of the six hosts were already building the list themselves** —
   `apps/cart/src/shell/components/form/renderers/index.ts` and its cart-nuxt and labs-nuxt twins
   composed the whole array by hand, importing each package's entries by name. The registry carried
   a list from the app to the app.

None of this is a design failure. It is a contract that anticipated contributors who did not
arrive: four packages had nothing to contribute, and the two that did had exactly one consumer
each. The mechanism was sized for a plugin ecosystem and used by a fixed set of six apps that can
each name what they want.

**What replaces it.**

1. **The app owns its renderer list.** Each host composes a `FormRendererEntry[]` by spreading the
   *whole* published array of every renderer-publishing package it depends on — never picking an
   entry by name — and hands the result to `foundation` once, at the app level, through the
   injection seam that already exists: `provide(FORM_RENDERERS, …)`, read by `useFormRenderers()`.
   `foundation`'s `Form.vue` keeps passing the design system's `additionalRenderers` prop; only
   the source of the value changes. Four packages publish an array — `client`, `domain`, `payment`
   and `product` — and a host spreads only the ones it depends on, so the set a host carries falls
   straight out of its own manifest: `apps/auth` provides a deliberate `[]`, `apps/portal-nuxt`
   spreads three (no `domain` dependency), and `apps/cart`, `apps/cart-nuxt` and
   `playgrounds/labs-nuxt` each spread all four plus one control of their own.
2. **The app owns its routes and its route names.** Both live in the app, which is where `develop`
   has always kept them — `apps/cart/src/router/routes.ts` for the records,
   `apps/cart/src/router/funnels/types.ts` for the names. `packages/client-vue` held neither. So
   `AUTH_ROUTE`, `authRoutes()`, `PAYMENT_ROUTE` and `paymentRoutes()` were new knowledge, not
   relocated knowledge, and they went back: `apps/auth/src/routes.ts` and
   `apps/payment/src/routes.ts` now hold them, each package's own copy deleted.
3. **A package that must send a visitor somewhere takes the destination as a prop.** Where such a
   prop already existed it becomes required rather than defaulted. No package imports another
   package's route names. `apps/portal-nuxt` is the proof this works the other way too: it names
   its own three auth routes from Nuxt's own file-derived page names and imports only the
   `AuthRoutes` **type** — a prop contract, not a name.
4. **A package's flow registrar stays in the package and is called by the app.** `registerAuthFlows`
   is behaviour — an origin-checked return-target reader and two navigation guards — not route
   knowledge. `apps/auth` hands it the router directly, in `apps/auth/src/router.ts`.
   *(Amendment 13 deletes the registrar. The app's own router holds the hand-back.)*

**Why the app, and not the package.** A single form can carry controls from a package its own
owner may not import. The product configuration form is `product`'s own — it emits the `Terms`
and `SubProducts` controls, both `product`'s by Amendment 3's test — alongside a provision field,
`provision_field.sld`, that `domain`'s `SLDRenderer` claims. `product`, `basket` and
`recommendations` all draw that form, and §3 grants none of the three an edge to `domain`.
Measured by running the real JSON Forms testers against a schema built from a recorded staging
fixture: the SLD field resolves only when `domain`'s entry is in the set the form is handed, and
no package below the app can put it there without an edge §3 forbids. An app is the only layer §3
permits to import every domain package, so an app is the only place such a set can be assembled —
`foundation` cannot assemble it either, for the reason below.

**Why the injection stays when the registry goes.** The static list cannot simply move into
`foundation` the way it sits in `client-vue` on `develop`: a list there would make `foundation`
import `payment`, `product`, `client` and `domain`, all four of which already import
`foundation`. That is exactly the typed cycle §2's registry-ownership invariant exists to prevent.
An app has no such problem, because an app may import any domain package. And a prop at each call
site is not available either: there are 34 `<Form` mount sites across 20 files inside the nine
packages, up to six components below the page — the indirection Amendment 7 refused for the manage
rows, at greater depth. So the app owns the list and injects it once. That is the smallest shape
that keeps the DAG.

**§2's `foundation` row, corrected.** The row read:

> `useFeatures`/`defineFeature` · the renderer registry + inject (`useFormRenderers`) · the
> form-host wrapper · `useRouting` (funnels)

It now reads: **the renderer inject (`FORM_RENDERERS`, `useFormRenderers`) · the form-host
wrapper.** `useFeatures`, `defineFeature`, the renderer registry and `useRouting` are gone.
`StorefrontRoute` — the only thing in `modules/routing/` that was not registry machinery — moved
to `modules/navigation/`, beside `Back` and `useBreadcrumbs`, where two of its three in-package
readers already lived.

**§2's port count, corrected.** The Admission-rule note says `foundation` "already owns three
ports that never met a count: the renderer registry, the routing socket and the shell socket."
Two of the three no longer exist. One port remains beside the shell socket: the renderer
**inject**, which is a different thing from the registry that sat behind it. The open question
that note raises — whether ports are exempt from the count as a class — is **still open**, and now
rests on two instances rather than three.

**§2's registry-ownership invariant, narrower now.** The invariant read: renderer/route/flow
entries live in the contributing package's `feature.ts`; `foundation` owns only the empty typed
registries plus the inject API; entries living in `foundation` instead would make it import
`product` and `domain`, and since every domain package already imports `foundation`, that is a
real typed cycle. `feature.ts` is gone, and the registry it fed is gone with it — there is nothing
left in `foundation` for an entry to "live in". What survives, narrower: **`foundation` may hold
the inject seam and nothing that flows through it.** It forbids exactly what it always forbade —
`foundation` importing a domain package in order to assemble a renderer, route or flow set on that
package's behalf — for exactly the same reason: every domain package already imports `foundation`,
so the reverse edge is a cycle whether the assembling code sits inside a registry or a plain
function. The entries themselves now live in each package's own renderers barrel as a plain
array; the app, which faces no such cycle, is what assembles the set (see "Why the app, and not
the package," above).

**§9, corrected.** The claim was *"The app's `nuxt.config` `modules: [...]` is the uniform feature
list — Nuxt's module system **is** the loader."* There is no feature list and nothing to load. All
nine per-package Nuxt modules and all nine plugins are removed; each plugin's only body was
`register(defineXFeature(options)); install();`. A Nuxt host writes nothing in their place: it
deletes the module from `modules`, deletes the `<pkg>: { … }` options block, deletes the
`/nuxt` alias, and keeps the bare source alias it already had. No package ships a `/nuxt` export or
a `nuxt` devDependency any more. Open Question 4's "starting shape" is answered by this amendment
rather than by validation: it was validated against the build-out and did not survive it.

The evidence that the one job those modules still did — pushing the package onto
`nuxt.options.build.transpile` — was not load-bearing either: `apps/portal-nuxt`'s own production
build. `nuxt build-only` runs with its type-check armed (`typescript.typeCheck: isBuild`, §3.5) and
completes clean, and no `build.transpile` entry for any of the nine packages exists anywhere in
the tree. `apps/cart-nuxt` is not this gate — its build is red before this work arrives, on
pre-existing errors unrelated to it (§3.5) — so `portal-nuxt`'s clean, type-checked build is the
one that stands as the measurement.

**Optionality is not weakened by that — it is strengthened.** §9 made listing the module the way a
Nuxt host declares it sells domain names. The declaration is now the dependency manifest plus the
imports, which `tsc -b` and `pnpm` both see and a module list did not. `packages/modules-domain`'s own
host-wiring spec already asserts the stronger half: `portal-nuxt` "declares no dependency on this
package" and "imports nothing of it anywhere in its source." §7's socket rule for the optional
`domain` case survives intact — `catalogue` still reaches the DAC widget through a typed port and
never imports `domain`.

**§7's DAC sentence, corrected.** §7 reads *"**`catalogue`'s DAC field uses the same socket** —
`catalogue` does **not** import `domain` either."* The principle stands and the import is still
absent, but the channel changes: the DAC widget is **not a form renderer** and no longer travels
in the renderer set. It reads no `control`, never calls `useJsonFormsControl`, and no schema in the
repo emits a `Dac` element — so its tester could never fire in production, while
`@jsonforms/vue` ran it on every control dispatch of every form. It now arrives through a typed
port of its own: `catalogue` publishes the key (`DAC_WIDGET: InjectionKey<Component>`), `domain`
publishes the component, and each app that ships `domain` connects the two with one `provide`
call. Still a socket; still no import; one fewer thing riding the form engine as transport. §7's
sentence should name the widget port rather than the renderer socket.

**A convention §8 never stated, now stated.** The design system's form host spreads its own
built-in renderers **before** the injected ones, and JSON Forms resolves with `maxBy`, where a tie
goes to the first entry. So a package renderer that ties a built-in on the same element silently
loses. The rule: **for every element a published entry claims, no built-in may return an equal
rank.** It is not a rank floor — `client`'s address renderer is correctly rank 2, matching the
design system's own three layout renderers, all of which sit at 2 because the bare-`isLayout`
renderer sits at 1. Measured across the whole set: no tie exists. The rule is recorded so the next
entry is not filed by its neighbours, and a spec holds it.

**One consequence worth naming: array order stops being load-bearing.** Several comments in the
tree called the pre-move renderer order "this move's oracle." They are gone now: once no entry can
tie a built-in, order cannot decide anything, and each host simply spreads the published array of
every domain package it depends on — which is the idiomatic JSON Forms shape and what `develop`'s
single static array was. A host cherry-picking entries by name was the only reason "an app could
forget a control" was a failure mode at all.

**§11's `sideEffects` caveat is discharged.** It warned that "§8's additive feature registration is
a deliberate side effect — `sideEffects` must list the `feature.ts`/entry modules, or an
over-eager `sideEffects: false` silently drops registered features from the bundle." With no
registration there is no side effect to preserve, and the footgun goes with it.

**What this does NOT change.**

- §2's admission rule. `foundation` still earns a thing on a measured count of two or more domain
  packages plus no single-domain knowledge.
- §7's socket rule for optional and cross-cutting packages. The renderer **inject** is the socket;
  only the registry behind it is gone.
- The roster, the DAG and every grant in §3's matrix.
- §10's state model, the SSR gate, and the scope-registry work. Untouched.
- **Amendment 1 change 3.** The page, layouts, header and footer stay app-owned — copied into each
  app that needs them, per Amendment 5's withdrawal. Nothing here reopens the shell question.
- Amendment 1 change 1. Every phase stayed deployable, and the shape of the run was set by
  honouring it: `packages/client-vue`'s `feature.ts` registered and installed itself as a
  module-level side effect, which was the only thing feeding four shipped hosts their domain
  renderers on every phase from Phase 2 to Phase 9a. So the **route** half retired per phase from
  the Phase 1 → Phase 2 merge, and the **renderer** half retired in one commit at the tip, after
  `client-vue` was deleted. A single sweeping deletion would have stranded `cart`, `cart-nuxt`,
  `velia-nuxt` and `labs-nuxt` for nine phases.

**Two things noted and deliberately not built.**

1. **`@jsonforms/core` exports `NOT_APPLICABLE`.** Several specs in this tree redefine it as a
   local `-1`. Use the export where a spec is being edited anyway; no sweep is opened for it.
2. **JSON Forms has two more registries of the same shape — `cells` and `uischemas`.** Both carry
   the same prop-plus-watcher wiring as `renderers`, and cells resolve by the same `maxBy`. The
   design system's form host wires neither. **The same seam question returns the day one is
   needed**, and it should be answered then, with a consumer in hand, rather than pre-built now.

**A question this amendment does not answer.** With `useFeatures` gone, nothing in the tree reports
which boxes a host has installed. Nothing asked for that today. If a surface ever needs to branch
on a package's presence, the answer is a host-owned capability flag or a brand setting — not a
revived registry, and not a lookup against a list the host itself wrote.

---

## Amendment 11 (2026-09-24) — Phase 0 holds only what Phase 0 needs

**Scope.** Narrows Amendment 1's "Unchanged and held" pre-flight list. The placements in §5 and in Amendment 1 change 6 stand; only the phase that lands them changes. Numbered after Amendment 10, which is recorded on a later phase's branch.

**The test.** A change belongs to Phase 0 only if a Phase 0 gate needs it. When no Phase 0 gate needs it, or a later phase moves or replaces the same code, it lands in that later phase. A change that no phase needs lands nowhere.

**Why three pre-flight items fail the test.** Phase 0 arms `import/no-cycle` on the ten domain packages only, and excludes `client-vue` by name. The two cycles and the eager renderer imports all sit inside `client-vue`, so at Phase 0 they fail no gate. Each of those files then moves again in the phase that extracts its package.

| Change | Lands in | Reason |
| --- | --- | --- |
| Cycle break 1: `Promotion.vue` into `product`'s pricing kit | Phase 4 | Phase 4 extracts `product` and moves the file into it. |
| Cycle break 2: the misfiled `product/Recommendations.vue` out of `product` | Phase 4 | `product` must leave it behind when it leaves `client-vue`. Phase 5 then moves it into `recommendations`. |
| STEP 0 lazy loading in `TermsRenderer` and `SubProductRenderer` | Phase 4 | Both renderers move into `product` in Phase 4. |
| STEP 0 lazy loading in `DomainRenderer` | Phase 6 | The renderer moves into `domain` in Phase 6, the phase that makes `domain` optional. |

The tests for each change move with it.

**Removed from Phase 0.**

- `sideEffects` in the ten shells. Each package declares it in the phase that fills the package. The `**/feature.ts` pattern it carried was retired by Amendment 9.
- The `*.tsbuildinfo` ignore. The stray files come from packages that develop already builds, so they are not a Phase 0 concern.
- A trailing-newline change to `eslint-suppressions.json`.
- `scripts/rename-domain-packages.mjs`. Its rename legs are complete on every branch, and the script stays in history. Its lint glob now lands with Phase 1's own script.

**Phase 0 keeps** the ten shells, their aliases and project references, `import/no-cycle` and `import/no-internal-modules` at ERROR, the per-package `@internal` barrier, the `typecheck:packages` CI job, and the import-cycle negative control.

## Amendment 13 (2026-09-25) — a domain package holds only UI concerns; the rest lives in `headless`

**Scope.** Sharpens §2's `headless`, `foundation` and domain-package rows, and §6. It binds the ten `packages/modules-*` packages: `foundation` and the nine domain packages. Supersedes Amendment 9 point 4: routes, guards and flows live in the app, not in a package and not in `headless`. `registerAuthFlows` was the only registrar, and it is deleted. Ruled by the operator on 2026-09-25.

> **Ratified by the operator on 2026-09-28.**

**The ruling.** *"It should only be in our packages if it is a UI concern."* A package holds markup, styles, variants, prop, emit and slot types, view state, presentation mapping, the wiring that passes `headless` values into components, and component gates that combine `headless` flags. Everything else lives in `headless`: a service or query, a cache, a machine or store, a domain rule, routing or funnel logic, static domain data, and a composable whose output is domain data.

**The test.** Would a second surface with a different design need the logic to behave the same way? Then `headless` owns it. If only this component's look needs it, the package keeps it.

**What changed.** An audit read every source file in the ten packages. A move keeps its behaviour unless its row says **Behaviour**. Where two copies of a rule differed, the row names the rule that survives. Each row lands in the phase it names, so on a lower phase's branch the later rows describe work still to come.

| Lands in | What changed | Result |
| --- | --- | --- |
| Phase 1 | `foundation`'s brand config read (`useBrandConfig`) and its brand-keyed cache | Deleted. `headless` `useBrand` and `useConfig` already serve every field; `apps/payment` reads its theme from `useConfig` (Phase 3). A §10 brand-keyed cache, when it is built, lives in `headless` `brand`. **Behaviour:** the payment app's theme follows a brand refresh; the cache kept the first value it saw. |
| Phase 2 | `auth`'s return-target reader and flow registrar | Deleted. `apps/auth/src/router.ts` hands back with two route guards; the portal's sign-in guard sends a signed-in client to its landing. **Behaviour:** the router keeps every `returnUrl` on this origin, so no origin check runs, and a target outside the app ends on its landing with no refusal message. The portal ignores `returnUrl`, which nothing in the portal sets. |
| Phase 2 | the funnel-or-route resolver the auth views share | `headless` `routing/useRoutingResolve.ts` |
| Phase 2 | the pattern-example rule for validation messages | `headless` `utils/useValidation.ts` (`withPatternExample`) |
| Phase 2 | the wait for the session to hold the user after a sign-in, which `Auth.vue` ran | `headless` `useAuth().resolve()`. `Account.vue`'s copy is deleted: `useAccount().register()` already settles after the user is written. **Behaviour:** `resolve()` settles once the session holds the signed-in user, and rejects when the user load fails. |
| Phase 3 | the account-credit default (the smaller of the amount due and the credit) | `headless` `defaultWalletAmount`, read by the schema, the parser and `usePaymentDetail().amountCreditDefault`. **Behaviour:** while the payment model is cleared, the default follows the invoice amount, not 0. |
| Phase 3 | the pay-later choice | an option in `headless`'s gateway schema; the renderer only maps options |
| Phase 4 | `canAddDirectly`, `isSingleSelection`, `toSubproductSelection`, `setSubproductQuantity` | `headless` `product/product.utils.ts` |
| Phase 4 | the save-with-fallback rule that `product`'s configure view ran | `headless` `basket-product/basket-product.utils.ts` (`commitProductUpdate`) |
| Phase 4 | hiding promotions on a custom price | `headless` `parsePromotionDetails` returns none. **Behaviour:** the basket upsell card stops showing promotions beside a custom price. |
| Phase 5 | `recommendations`' copy of the save-with-fallback rule | calls `commitProductUpdate` |
| Phase 6 | the DAC's added-results flag and its cache refresh | `headless` `domain/useDac.ts` and `domain/domain.services.ts` |
| Phase 6 | two hand-written query keys, `"catid"` and `"returnUrl"` | `headless` `QUERY_PARAMS` (existing constants) |
| Phase 8 | the order-transfer URL | `headless` `session-transfer/session-transfer.utils.ts` |
| Phase 8 | `invoice`'s unused `PAYMENT_STATE` re-export | Deleted (§6). |
| Phase 9 | the guest-checkout gate, the currency-country table and the billing form's two rules | `headless` `basket/basket.utils.ts`, `currency/currency.constants.ts`, `basket-billing/basket-billing.utils.ts`. The unused `currencies.json` copy is deleted. |
| Phase 9 | the billing tabs' six model rules | `headless` `basket-billing/basket-billing.utils.ts`, each kept exact. They are not folded into the form's rule, which answers a different question. |
| Phase 9 | `basket`'s copy of the save-with-fallback rule | calls `commitProductUpdate` |
| Phase 9 | the basket card's save rules (500 ms wait, flush on teardown, cancel on remove, forced save when invalid) and its config-spawn and error rules | save methods and flags on `headless` `useBasketProductInline`; its unused old quantity methods are deleted. **Behaviour:** a save queued at teardown fires as the card unmounts, not after it. |
| Phase 9 | the checkout's "next product to set up" | `headless` `useProductSetupCursor`, per caller. The setup page keeps its own rule. **Behaviour:** a product that needs setup after the checkout opens now shows its setup form. |

**Kept as UI.** Six items only arrange values that `headless` already serves, so they stay in their packages: `useBreadcrumbs` (`foundation`), the `PricingList` row filter (`product`), the `OrderProducts` rows (`invoice`), the summary price lines (`basket`), the payment-order signed-out gate (`payment`) and the checkout payment gate (`basket`).

## Amendment 14 (2026-09-28) — the theme belongs to the app; `useAnnouncement` lives in `foundation`; both ports are removed

**Scope.** Corrects §2's `ui` and `foundation` rows for the theme, and makes one exception to §2's admission count. Ruled by the operator on 2026-09-28.

**The rulings.**

1. **The theme belongs to the app.** An app applies the brand theme one time, at startup. A page does not apply a theme, and no package holds theme code. The brand's `theme` setting has one value for every screen (brand scope, all contexts), so the page calls only applied the same value again. `apps/cart`, `apps/cart-nuxt`, `playgrounds/labs-nuxt` and `apps/payment` already apply it at startup. `apps/auth` now does the same.
2. **`useAnnouncement` moves to `foundation` before it meets the count.** Today one domain package reads it: `invoice`'s `Order.vue`. The operator expects more readers, so it moves now. It knows no domain. The exception is for this composable only. The count stands for everything else.
3. **Both ports are removed.** The theme-engine port (`provideThemeEngine`, `useThemeEngine`) and the announcer port (`provideAnnouncer`, `useAnnouncer`) are deleted. A package imports `useAnnouncement` from `foundation` directly. An app reads the same singleton to draw its announcement bar.

**§2's rows, corrected.** The `ui` row keeps `useThemes` in `ui` because "primitives read the active theme config". The design-system `ui` has no `useThemes`, and no primitive reads the active theme. The `foundation` row lists "brand→theme selection". No package selects a theme now. Neither row lists theme code. The theme engine is app code.

**Why singletons, not ports.** Develop runs `useAnnouncement` as a module-level singleton (`client-vue`'s `components/announcement/useAnnouncement.ts`). The migration moves it unchanged. The ports added a provide at each app root, and an app that left one out got only a console warning.

**SSR.** An announcement is per-user state in module-level state. `cart-nuxt` runs with `ssr: false` today. Under SSR, the announcement state must move into the per-request context (§10).

| Lands in | What changed | Result |
| --- | --- | --- |
| Phase 1 | the theme-engine port | Deleted. No Phase 1 file reads it. |
| Phase 2 | the auth pages' theme calls, and each app's `provideThemeEngine` | Deleted. `apps/auth` applies the brand theme once in `App.vue`, as `apps/payment` does. The portal's `layouts/auth.vue` applies the portal theme at startup, as its sibling layouts `logged-out.vue` and `default.vue` do. **Behaviour:** the portal's sign-in pages no longer switch the portal's theme to the brand theme; they show the portal's own configured theme. |
| Phase 4, 8, 5, 6, 9 | the theme calls in `product`, `invoice`, `recommendations`, `catalogue` and `basket`, and in `playgrounds/labs-nuxt`'s `OrderView.vue` (from Phase 8) | Deleted, each on the leg that moves its package. **Behaviour:** a brand `theme` rule that depends on product or basket state no longer switches the theme on those pages; the labs order page keeps the labs startup theme. |
| Phase 8 | the announcer port | Deleted. `foundation` `announcements/useAnnouncement.ts` holds develop's singleton. `invoice`'s `Order.vue` and the app shell import it. |
| Phase 9c | the app copies of `useAnnouncement` (`apps/cart`, `playgrounds/labs-nuxt`) | Deleted. The shells import it from `foundation`. |

## Amendment 15 (2026-09-28) — a page takes its templates from the page that mounts it; `catalogue` imports `domain` when a category needs it; `headless` stays as `develop` has it; the shell socket and the DAC port are removed

**Scope.** Removes two injection ports the phased run added: the shell socket (`provideShellComponents`, `useShellComponents`, `SHELL_COMPONENTS`) and the DAC widget port (`DAC_WIDGET`, `useDomainWidget`, `catalogue`'s `products/dac.socket.ts`). Keeps one app-root injection, the renderer inject. Reverses §5's DAC reroute and §7's "`catalogue` does not import `domain`", and Amendment 9's §7 correction with them. Grants `catalogue → domain` in §3. Withdraws Amendment 13's moves into `headless`, except `commitProductUpdate`. Records that this migration fixes no bug, and that `apps/auth` does nothing after a sign-in. Restates Amendment 8's rule for props. Ruled by the operator on 2026-09-28: *avoid the provide/inject pattern; prefer props, slots and direct imports*, and *a `headless` change needs heavy justification; the migration moves code as `develop` has it*. Numbered after Amendment 14. Amendment 8 is recorded on Phase 9c's branch; on a lower branch, read its rule from this amendment.

**The rulings.**

1. **A page organism takes its page templates as a prop.** `templates` is required, and its type is a record over the package's template names. The page the app mounts passes it. No app root provides templates.
2. **A socket that fills part of a page becomes a named slot.** The app page fills it. `auth`'s three sockets become the `loading`, `summary` and `guest-checkout` slots, and `auth` owns their prop types.
3. **`catalogue` imports `domain` directly, as `develop` does, but only when a category needs it.** `catalogue`'s `products/WidgetDAC.vue` loads `domain`'s `UpmDacWidget` with a dynamic import (`defineAsyncComponent`), the pattern `domain`'s `DomainRenderer` and `product`'s `SubProductRenderer` and `TermsRenderer` already use. The catalogue mounts it only when the category asks for the domain search (`uiMeta.widgets.dac`, or the brand's product-list style is `DAC`), as `develop` does. No app provides the widget: wiring it is not the app's responsibility. `DAC_WIDGET`, `useDomainWidget`, `dac.socket.ts`, the "is a widget provided" check (`hasWidget`) and `domain`'s `dacWidgetEntry` are deleted.
4. **The renderer inject stays.** It is the one app-root injection (`FORM_RENDERERS`, `useFormRenderers`). `apps/auth`'s provide of an empty list is deleted, because the inject defaults to an empty list.
5. **The portal keeps its seven auth templates.** They are app code, and the portal's sign-in pages pass them as `templates`.
6. **`headless` stays as `develop` has it.** A `headless` change needs heavy justification: domain logic that more than one surface needs today and that cannot stay in its `develop` home. A behaviour change to an existing `headless` API needs the heaviest. The migration moves code as `develop` has it. Of the 22 changes the phased run made in `headless`, two pass: `commitProductUpdate` (Phase 4; additive, three importers in three packages, and §6 blocks a shared home outside `headless`) and one `usage.md` line that names the consumer's new path (Phase 3). The other 20 go back to their `develop` homes, each on the phase that added it: `useRoutingResolve`, `withPatternExample` and the post-sign-in wait in `useAuth().resolve()` (Phase 2); `defaultWalletAmount` with `usePaymentDetail().amountCreditDefault`, and the pay-later gateway option (Phase 3); `canAddDirectly`, `isSingleSelection`, `toSubproductSelection`, `setSubproductQuantity` and the custom-price guard in `parsePromotionDetails` (Phase 4); `buildOrderTransferUrl` (Phase 8); `useDac().meta.hasAddedResults`, `useDac().refreshSearch` and `removeDomainQueries` (Phase 6); `CURRENCY_COUNTRIES`, `useProductSetupCursor`, the save methods and flags on `useBasketProductInline`, the deletion of `useBasketProduct`'s unused methods (they come back), `offersGuestCheckout`, `resolveBillingType`, `composeBillingModel` and the six billing-tab rules (Phase 9). An auth page takes the funnel step when a funnel runs; with none, it emits `resolve` or `reject`, and the app page decides.
7. **This migration fixes no bug.** Where a move changed behaviour, the behaviour returns to `develop`'s: the basket upsell card shows promotions beside a custom price again; the checkout's setup section shows no form for a product flagged after the checkout opens; a save queued when a basket card closes flushes after the card unmounts. Each bug can be filed on `develop`.
8. **`apps/auth` does nothing after a sign-in.** Its routes mount the organisms as route components, with no listener, and it runs no funnel. It adds no page files.

**Amendment 8, in prop form.** A host that passes no templates, or a record that lacks a name, fails its type-check. At runtime the organism still throws and names the template. No package draws a template. The loading spinner is still the one exception: `auth`'s `loading` slot defaults to the package's own spinner.

**Why props, not ports.** Every template reader sits in an organism that an app page mounts, or one level below it. The page is app code, so it may import the app's templates; the prop adds no edge. The socket added a provide at each app root, and a host that left a name out found out only when a brand chose that name.

**Why the renderer inject stays.** One reader and five app-root provides. Thirteen package files mount the form, up to six levels below the page, and 39 components sit on those paths. The product and basket forms render `domain`'s controls, and §3 grants neither package an edge to `domain`. A prop would thread through every one of those components, and a missed hop drops a control with no error. A per-package import would need an edge §3 forbids. So the app assembles the list and injects it once, as Amendment 9 found.

**§3, §5 and §7, corrected.** §3's `catalogue` row gains `domain`: *May import* `+ product, recommendations, domain`. The edge is a dynamic import only. `domain` imports `product`, `foundation` and `headless`, and nothing of `catalogue`, so no cycle appears; §3's topological order puts `domain` before `catalogue`. §5's bullet "reroute it through the provision-field renderer socket" is withdrawn: the hard import comes back as a lazy one. §7's sentence "`catalogue` does **not** import `domain` either" is reversed, and Amendment 9's correction (the widget arrives through a typed port) is reversed with it. `domain` stays optional at run time: `catalogue` loads it only for a category that asks. It is not optional at install time for a host that mounts the catalogue, because `catalogue` declares it. In today's apps the app root already imports `domain`'s renderers for the form, so the lazy import makes no separate chunk there.

**Amendment 13, withdrawn in part.** Its ruling sentence, "everything else lives in `headless`", no longer moves code during this migration: ruling 6 applies instead. Its test ("would a second surface need it?") becomes "does a second surface import it today?". Its rows that moved code into `headless` are withdrawn, and so are their **Behaviour** notes: Phase 2 (the funnel-or-route resolver; the pattern-example rule; the wait for the session to hold the user), Phase 3 (the account-credit default; the pay-later choice), Phase 4 (the four product helpers; hiding promotions on a custom price), Phase 6 (the DAC's added-results flag and its cache refresh), Phase 8 (the order-transfer URL) and Phase 9 (the guest-checkout gate, the currency-country table and the billing form's two rules; the billing tabs' six rules; the basket card's save rules and the deleted quantity methods; the checkout's setup cursor). These rows stand: Phase 4's `commitProductUpdate`, and the Phase 5 and Phase 9 rows that call it; and the rows that moved nothing into `headless` (Phase 1's `useBrandConfig` deletion, Phase 2's return-target reader, Phase 6's query keys, Phase 8's `PAYMENT_STATE` re-export). Its "Kept as UI" list stands.

**§2's port note, corrected.** After Amendment 14 and this amendment, `foundation` owns one port: the renderer inject. The open question, whether ports are exempt from the count as a class, rests on one instance.

**§3, spent.** `basket` imports `auth` for one type: the guest-checkout offer's props are `auth`'s slot props. The edge points down, and `auth` imports nothing of `basket`.

**The portal.** Its sign-in, registration and forgotten-password pages keep the portal's seven templates, inside its `auth` layout. The brand's auth template picks one. The templates draw the portal's own chrome: the wordmark, the store shortcut, the legal footer and the platform line. They do not draw the brand's note: the auth page draws it in the template's `markdown` slot, so the portal's copy (`PortalAuthNote`) is deleted, and so is the `logged-out` layout's note block that no page reached. The store shortcut is one app component, shared by the templates and the `logged-out` layout. The portal no longer allows the `GUEST` scope.

**velia and hosting.** They do not build from Phase 2 until Phase 9a retires them. No release of either is cut while the stack is part-merged.

**What stays.** `develop`'s component-local string-key provides, and the design system's own form seams (`provideFormIcon`, `provideFormEngineData`).

| Lands in | What changed | Result |
| --- | --- | --- |
| Phase 2 | the shell socket; `auth`'s three pages; each auth host | The port is deleted. The pages take `templates` and three slots. `apps/auth` passes its templates through route props, and does not navigate after a sign-in. |
| Phase 2 | the portal's auth templates | Kept, passed as `templates`. `PortalAuthNote` is deleted. **Behaviour:** on the three templates that fill the `markdown` slot, the sign-in and registration pages show the brand's note once, not beside the portal's mock note. |
| Phase 2 | the portal's scopes | `GUEST` is removed. **Behaviour:** the portal opens no guest session, and registration sends no guest token. |
| Phase 2 | the guest-checkout offer | It fills `Register`'s `guest-checkout` slot, typed by `auth`. |
| Phase 2 | `apps/auth`'s renderer provide | Deleted. Five app-root provides remain. |
| Phase 2 | `headless`'s `auth`, `routing` and `useValidation.ts` changes | Back to `develop`'s bytes. `auth`'s `Auth` and `Account` wait for the session again, as `develop` does. The auth pages take the funnel step or emit to the app page. The pattern example lives in `foundation`'s form translator, with `randexp`. |
| Phase 3 | `headless`'s payment-details changes | Back to `develop`'s bytes, but for the one `usage.md` path line. `payment`'s `AccountCredit` and `GatewaysRenderer` hold `develop`'s credit figure and pay-later tile again. |
| Phase 4, 8, 5, 6, 9 | the page organisms of `product`, `invoice`, `recommendations`, `catalogue` and `domain` and `basket` | Each takes `templates`, each on the leg that moves its package. The host pages pass them. |
| Phase 4 | `headless`'s product changes | Back to `develop`'s bytes. `commitProductUpdate` stays. |
| Phase 6 | the DAC widget | `catalogue` loads `domain`'s `UpmDacWidget` lazily. `domain`'s renderer set no longer carries it. `catalogue` declares `domain`. |
| Phase 6 | `headless`'s DAC changes | Back to `develop`'s bytes; `domain`'s `Dac` holds its gate and its refresh again. |
| Phase 8 | `headless`'s order-transfer URL | Deleted; `invoice`'s `Order` builds the URL again. |
| Phase 9 | `basket`'s manifest | Declares `auth`. |
| Phase 9 | `headless`'s basket, billing, currency and setup changes | Back to `develop`'s bytes. `basket` holds its currency table, card save, setup section, guest-checkout gate and billing rules again. |
| Phase 9a | the DAC widget port | Deleted where it lands, with both app provides; Phase 6's lazy import replaces it. |
| Phase 9c | the app shells' template records | Each host page imports its own app's records. |

## References

- Module-foundation docs: `<agent-runner>/workshop-bundle/02-module-foundations/*`
- Headless reference: `docs/published-docs/developers/reference/headless/*` (`useOrder` = `useInvoice`, `useCheckoutFlows`, `useBasketFlows`, `useRoutingFlows`, …)
- ADR 001 (scope-based composables) — a separate `headless`-layer initiative; **implemented in `@next-legacy` (`modules/scope/`)**. Does not gate the *package cut*, but its registry's per-request lifetime **IS the SSR fix** (§10 Axis 2), so it **gates enabling SSR**.
- ADR 004 (monorepo structure), ADR 007 (headless architecture), ADR 012 (multi-theme architecture), ADR 017/018 (funnel navigation)
- **ADR 022 (UI library split — `ui-cart`/`ui-checkout`) — *superseded by this ADR.*** 022 split along a UI-component-library axis; 023 supersedes it with the domain-axis package cut. ADR 021 (testing pyramid) governs the test strategy the Migration leans on.
- cart-nuxt scout (2026-06-15): Nuxt 4.2, Vue 3.5, `ssr: false` today, funnels via `UpmindClient.init`, brand resolved client-side via `useBrand`.
- Design-council session, 2026-06-15 — `~/.claude/councils/2026-06-15-ui-package-architecture/`

# ADR 023: UI Domain Package Architecture

**Date:** June 15, 2026
**Updated:** June 15, 2026 — §10 rewritten as a two-axis SSR-safe state model (brand-invariant shared cache + per-user request scope), after reviewing the `@next-legacy` scope-based composables (`modules/scope/`). They are built and SPA-correct; the SSR gap is that the scope registry, `QueryClient`, and session-store are module-level (per-process) rather than per-request — fixable at one chokepoint (`ensure()`). **Accepted 2026-06-16** — all Open Questions (Q1–Q4) resolved.
**Status:** Accepted — amended 2026-08-25 (constraint 5 narrowed), 2026-09-07 (Amendment 1: a phased strangler replaces the big-bang wave) and 2026-09-08 (Amendment 2: four scope rulings, UNRATIFIED). See the Amendments below.
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

> **Admission rule** — a thing earns a place in `foundation` only if **≥2 domain packages depend on it AND it knows no single domain**. Domain-specific things register *into* foundation via the socket (§7); they don't live there.
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
| `basket` | in-flight order: basketProduct · billing · promo · currency · **checkout flow** | + `product`, `recommendations`, `auth`, `payment`, `invoice` |

Support: `i18n`, `types`, `icons`. *(`icons` (ADR 003) sits on the floor with `types`/`i18n`. Caveat: its current `@icons`-alias → built `dist/assets` model is per-package dist, which constraint 1 forbids under source-consumption — reconcile during build-out: either source-consume the assets or treat `icons` as the one allowed asset-only dist exception.)*

Topological order:

```text
types, i18n, icons (leaf floor) → ui, headless → foundation → product → recommendations → {catalogue, domain}
                                     auth → client
                                     payment → invoice
                                     basket (top of buy-funnel) → product, recommendations, auth, payment, invoice
```

Acyclic by construction. `product`, `recommendations`, `payment`, `auth` are low/shared; `basket` is the top of the buy-funnel.

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

1. **The Upmind-domain renderers ride their domain phase.** ADR 024's 2026-08-25 amendment leaves the domain renderers in `client-vue` to "move into their domain modules with the ADR 023 package cut", and named no phase. They are assigned per box: Gateways and PaymentDetails → `payment`; SubProduct and Terms → `product`; Domain and SLD → `domain`; the collection `Filter*` family → `catalogue`; Address and Manage → `client`; Image → `product`. No dedicated renderer phase.
2. **velia and hosting are retired in their own phase, before the delete.** Both still import `client-vue` (47 and 40 files), so the final phase's "no consumer imports `client-vue`" criterion cannot pass while they stand. A phase ahead of it re-homes velia's slot components and hosting's configuration into cart-nuxt per Open Question 1, then retires both apps.
3. **The standalone `auth` and `payment` apps stay in their phases** (Amendment 1 change 4), rather than deferring to a follow-up.
4. **`ui` means `design-system/packages/ui`.** Per ADR 024's 2026-08-19 amendment, the library's single home is the `design-system` submodule and the in-tree copies are deleted. The ten packages' project references target the submodule's workspace package; the leftover `packages/ui` working tree from the old library is removed.

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

## References

- Module-foundation docs: `<agent-runner>/workshop-bundle/02-module-foundations/*`
- Headless reference: `docs/published-docs/developers/reference/headless/*` (`useOrder` = `useInvoice`, `useCheckoutFlows`, `useBasketFlows`, `useRoutingFlows`, …)
- ADR 001 (scope-based composables) — a separate `headless`-layer initiative; **implemented in `@next-legacy` (`modules/scope/`)**. Does not gate the *package cut*, but its registry's per-request lifetime **IS the SSR fix** (§10 Axis 2), so it **gates enabling SSR**.
- ADR 004 (monorepo structure), ADR 007 (headless architecture), ADR 012 (multi-theme architecture), ADR 017/018 (funnel navigation)
- **ADR 022 (UI library split — `ui-cart`/`ui-checkout`) — *superseded by this ADR.*** 022 split along a UI-component-library axis; 023 supersedes it with the domain-axis package cut. ADR 021 (testing pyramid) governs the test strategy the Migration leans on.
- cart-nuxt scout (2026-06-15): Nuxt 4.2, Vue 3.5, `ssr: false` today, funnels via `UpmindClient.init`, brand resolved client-side via `useBrand`.
- Design-council session, 2026-06-15 — `~/.claude/councils/2026-06-15-ui-package-architecture/`

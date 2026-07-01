# ADR 023: UI Domain Package Architecture

**Date:** June 15, 2026
**Updated:** June 15, 2026 — §10 rewritten as a two-axis SSR-safe state model (brand-invariant shared cache + per-user request scope), after reviewing the `@next-legacy` scope-based composables (`modules/scope/`). They are built and SPA-correct; the SSR gap is that the scope registry, `QueryClient`, and session-store are module-level (per-process) rather than per-request — fixable at one chokepoint (`ensure()`). **Accepted 2026-06-16** — all Open Questions (Q1–Q4) resolved.
**Status:** Accepted
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
5. **`ui` stays presentational** (dumb by preference, may now know `headless`); `headless` is already cleanly modular.
6. **Nuxt is the de-facto app platform going forward.** **`cart-nuxt` is the de-facto app; the existing Vite apps (`cart`, `velia`, `hosting`) are *deprecated, not migrated*** — velia/hosting variation is re-homed as cart-nuxt config/layers (Q3). Every surviving app targets Nuxt, moving to **SSR/SSG** for speed and SEO. (cart-nuxt is SPA today; SSR is the direction — greenfield, not a migration. **Enabling SSR is a separate workstream from this package cut** — see §10.)
7. **Brand is always resolved from the path/domain**; the BE returns the brand's settings bundle **with its id** on every request.

This ADR is grounded in the module-foundation docs (`workshop-bundle/02-module-foundations/*`) and the headless reference (`docs/@upmind-automation/headless/*`) — the canonical domain taxonomy — not invented nomenclature.

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

- `Promotion.vue` → `ui` (a presentational badge; kills `product → basket-product`).
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
2. **Migration off `client-vue` (Q4) — resolved: a single big-bang wave.** The regression suite is the safety net (precedent: the FE-2820 lint/rename wave). Pre-flight (cycle fixes, package shells + aliases, `import/no-cycle` → ERROR), then all modules move in one **dependency-ordered, parallel-agent wave**; codemod the in-repo app imports; `tsc -b` + full suite as the **single gate**; delete `client-vue`. No strangler, no `@deprecated` shim (velia/hosting handled via Q3). See the *Migration* section above (GO-WITH-WATCHLIST audit).
3. **`product`'s public API surface — resolved (proposed barrel, lock during extraction).** Derived from actual cross-module usage — the public barrel is the cross-boundary-consumed set (~17 symbols): config/views kit (`Config`, `ConfigErrors`, `ConfigSkeleton`, `NotFound`), hero kit (`ProductHero`, `ProductHeroSkeleton`, `ProductImage`, `PRODUCT_HERO_DIRECTION`), pricing atoms + list (`CurrentPrice`, `ExPrice`, `Pricing`, `PricingSkeleton`, `PricingTotal`), `TermCard`, card kit (`ProductCard`, `ProductCardSkeleton`), and `PRODUCT_TEMPLATE`. **~22 components stay internal** (actions, card/term sub-components, layout templates, `product.config.ts`). Three edge cases resolve via §5, not a new decision: `SubproductCard`/`TermCard`'s `Promotion` import → `Promotion` moves to `ui`; the misfiled `product/Recommendations.vue` → `recommendations` (drop from barrel); `SubproductCardPricing` has no cross-boundary consumer → drop.
4. **Detailed Nuxt wiring — starting shape drafted; validate during build-out.** Proposed shape: each package ships `@upmind-automation/<pkg>/nuxt` = a `defineNuxtModule` that (a) registers the package's `defineFeature` contribution (renderers, routes/funnels, plugins) into the `foundation` registries, and (b) contributes its pages via `extendPages`. The app's `nuxt.config` `modules: [...]` is the uniform feature list, **ordered to mirror the DAG** (`foundation/nuxt` first → domains → `basket/nuxt` last). Brand variants: **velia = a Nuxt layer** (`extends`) overriding tokens + dropping its 9 slot components (Q1); **hosting = config-only**. Per-brand funnels: a module registers the *capability*; the **active** funnel/route set is **brand-resolved per request** from the brand bundle (§10 Axis 1), never baked at build. *Validate against cart-nuxt during build-out:* module-execution order vs registry population, layer `extends` order, and that build-time module registration composes with request-time brand-driven funnels (the §9 ↔ §10 seam).

---

## References

- Module-foundation docs: `workshop-bundle/02-module-foundations/*`
- Headless reference: `docs/@upmind-automation/headless/*` (`useOrder` = `useInvoice`, `useCheckoutFlows`, `useBasketFlows`, `useRoutingFlows`, …)
- ADR 001 (scope-based composables) — a separate `headless`-layer initiative; **implemented in `@next-legacy` (`modules/scope/`)**. Does not gate the *package cut*, but its registry's per-request lifetime **IS the SSR fix** (§10 Axis 2), so it **gates enabling SSR**.
- ADR 004 (monorepo structure), ADR 007 (headless architecture), ADR 012 (multi-theme architecture), ADR 017/018 (funnel navigation)
- **ADR 022 (UI library split — `ui-cart`/`ui-checkout`) — *superseded by this ADR.*** 022 split along a UI-component-library axis; 023 supersedes it with the domain-axis package cut. ADR 021 (testing pyramid) governs the test strategy the Migration leans on.
- cart-nuxt scout (2026-06-15): Nuxt 4.2, Vue 3.5, `ssr: false` today, funnels via `UpmindClient.init`, brand resolved client-side via `useBrand`.
- Design-council session, 2026-06-15 — `~/.claude/councils/2026-06-15-ui-package-architecture/`

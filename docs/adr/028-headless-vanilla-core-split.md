# ADR 028: Headless Vanilla Core Split (`headless` / `headless-vue` / `headless-svelte`)

**Date:** July 16, 2026
**Status:** Proposed
**Authors:** Dom da Costa
**Updated:** July 17, 2026 — amended per review panel (docs/reviews/2026-07-16-headless-split-plan/review_panel_report.md); Status: Proposed (pending owner sign-off; both owner decisions — delivery/licensing and customer surface — resolved 2026-07-17, see §9).

---

## Context

`@upmind-automation/headless` was originally a vanilla-JS core with a Vue wrapper (`Flow`/`Flow-vue`, renamed in FE-658). FE-1122 (July 2025) deliberately collapsed the pair into a single Vue-enabled library because the TanStack Query instance could not be shared between a vanilla core and the Vue binding at the time — the Vue package owned the cache, and the core couldn't reach it.

The re-split is already sanctioned, not new direction:

- **ADR 023 §2 (accepted):** headless "**will split → `headless` (pure-JS core) + `headless-vue` (reactive wrapper)**".
- **ADR 027:** "headless core is going Vue-agnostic" is a settled product-owner ruling, proven by a no-`vue` lint.

This ADR designs *how*. Two things force it now:

1. **A customer onboarding on Svelte** needs access to core logic within weeks — framework-agnosticism is no longer aspirational.
2. **The FE-1122 blocker is gone.** TanStack v5 ships `@tanstack/query-core` as a first-class public package; every framework adapter (including `@tanstack/vue-query`) is a thin observer layer over an externally-ownable `QueryClient`. The core can own the cache and hand it to the Vue adapter.

### Coupling inventory (verified 2026-07-16)

Headless's Vue coupling is concentrated in chokepoints we already own:

| Chokepoint | What it hides |
|---|---|
| `utils/useState.ts` | wraps `@xstate/vue` (`useActor`), but is **not** the only site — corrected 2026-07-17: **`@xstate/vue` is imported by ~20 `.ts` source files (26 direct `useActor` sites)**; `useState.ts`'s own `createActor` wraps `useXStateActor` at `:277`. (Raw `grep -rln 'from "@xstate/vue"'` yields **24**; the extra 4 are README doc-examples, `modules/{basket,brand,recommendations,system}/README.md`, which must take the same codemod. Actionable codemod scope = **20 `.ts` files**, 19 excluding the `useState.ts` seam.) The original "only call site" claim is false. |
| `modules/query/useQuery.ts` | the DSL chokepoint where `useQuery`/`useMutation`/`useInfiniteQuery` are called; the **47** consuming modules (Phase-9 count; the earlier "54" is unreproducible) go through this DSL |
| `modules/scope/scope.registry.ts` | the only lifecycle owner (`ensure()` + detached `effectScope`) |
| `modules/system-localisation/useI18n.ts` | ~90 of 93 `t()` consumers go through this wrapper, not vue-i18n |
| `computed()` projections | 256 call sites across 64 files — the one spread-out surface, but pure projection: a single `onUnmounted` exists in the whole package (`useOrder`) |

Stragglers: `vue-router` (type-only imports; instance injected by host), `vue-i18n` direct imports in 2 runtime files (`useMoney`, `usePersonalDetailsManager`) **+ 4 type-only files, 3 of them outside the §4 rewrite target** (corrected 2026-07-17), `@vueuse/core` (1 file, `useBreakpoints`), `@sentry/vue` (2 files, logging only), `@vue/devtools-api` (scope inspector), `provide`/`inject` (config module only), `nextTick` (1 file), `@tanstack/vue-store` (used as a vanilla cache — `useStore()` deliberately avoided, reactivity hand-bridged via `storeTick`).

---

## Decision

### 1. Packages

| Package | Contents | Framework deps |
|---|---|---|
| `@upmind-automation/headless` | everything it has today: machines, services, scoped composables, query DSL, i18n, utils | **none** (lint-enforced) |
| `@upmind-automation/headless-vue` | re-exports core 1:1 + Vue-only glue: `VueQueryPlugin`/devtools wiring, vue-i18n mirror, scope devtools inspector, lifecycle sugar | `vue`, `vue-i18n`, `@tanstack/vue-query`, `@vue/devtools-api` |
| `@upmind-automation/headless-svelte` | signal→Svelte-store bridge + the same wiring | `svelte` (peer) |

A future `headless-react` follows the same shape (`useSyncExternalStore` bridge). Vue consumers (`client-vue`, apps) re-point imports to `headless-vue` via codemod; the "composables come from headless" rule reads "from `headless-vue`" per ADR 023 §2.

### 2. Reactivity: engine vs contract

**Contract (the purist model, and the end state):** core owns a reactive primitive with read + subscribe semantics; adapters bind it to their framework. This is how TanStack and XState structure their cores — neither is reactivity-free; each owns an engine behind a subscribe contract.

**Engine (the pragmatic pick):** `@vue/reactivity` — the standalone signals package (no components, no DOM, no app instance; provenance is Vue, coupling is not). It is the only engine that is a **drop-in** for the existing 256 `computed()`s, 61 `ref()`s, and the `watch`/`effectScope`/`toValue`/`unref`/`toRaw` idioms (all exported from `@vue/reactivity` as of Vue 3.5). For the primary consumer (Vue), core signals **are** native refs — zero bridging.

**Binding rules (the corner-proofing — these are conditions of acceptance):**

1. **Single import point.** Core reactivity primitives are re-exported from one file, `src/signals.ts`. Nothing else in core may import `@vue/reactivity` directly (lint-enforced). Swapping the underlying implementation for another **ref-shaped** engine (e.g. a future `@vue/reactivity` rebuilt on alien-signals) is an edit to `signals.ts` plus a dependency bump — bounded and mechanical. Adopting a **differently-shaped** API (call-syntax alien-signals, TC39 Signals) would be a ~1,300-call-site migration and is neither planned nor claimed; until Phase 4 lands, the public boundary carries `@vue/reactivity` refs and every adapter is coupled to that shape. The scheduler proviso (rule 4) binds to this single import point.
2. **Own the type surface.** Core's public API speaks a core-owned `Signal<T>` alias, never `ComputedRef`/`Ref` by name.
3. **Target contract (Phase 4 — gated by hard triggers, see Migration §4):** tighten the package boundary to `getSnapshot()`/`subscribe()` so **no reactive object crosses it at all** — the engine becomes fully private and swappable without a breaking change; every adapter (including Vue's) bridges. The `@vue/reactivity`-refs-cross-the-boundary state is a deliberate waypoint chosen for the Svelte timeline, not the destination.
4. **Scheduler / batching contract (binds at Phase 1, before the engine cut — not Phase 2).** `signals.ts` exports `watch` with a documented, engine-stable contract: *(i)* callbacks are **microtask-batched and per-watcher deduped** — N synchronous mutations of watched sources fire exactly one callback per watcher, after the current synchronous block, observing final values (equivalent to runtime-core `flush:'pre'` without render anchoring); *(ii)* an explicit `flush:'sync'` escape hatch maps to the engine's synchronous watch (no caller passes `flush:` today — 10 sites / 6 files); *(iii)* first run executes synchronously. Phase 1 is a pass-through to `vue`'s `watch` (already `'pre'`) with the contract test recorded; Phase 2 re-implements it as `baseWatch` + a `Set`-deduped microtask scheduler (~20 lines, one file — a port, not an invention). Pinned by a torn-key test: `filter()` mutating `filters`+`pageIndex` back-to-back (`useQuery.ts:615-624`) must produce exactly one observer `setOptions`/fetch on the final key.

**Rejected alternatives:**

- *alien-signals / TC39 polyfill now* — call-syntax API (`count()` not `count.value`), no `reactive`/`unref`/`toRaw`/`MaybeRef`: thousands of call-site rewrites, plus a bridge tax imposed on the primary (Vue) consumer today to spare hypothetical consumers a ~10KB engine tomorrow. Note: Vue 3.6's reactivity is itself being rebuilt on alien-signals, so staying on `@vue/reactivity` converges on the same substrate for free.
- *Selector/store rewrite now (pure TanStack model in one step)* — re-authoring every `useX.context.ts`/`useX.meta.ts` in 46 modules with adapter-side memoization rebuilt per framework. Months of churn and regression risk before any consumer benefits; instead reached incrementally via Phase 4.

### 3. TanStack

- Core depends on **`@tanstack/query-core`** and owns the `QueryClient` (creation stays in `modules/query/client.ts`).
- The query DSL (`modules/query/useQuery.ts` — `query`/`list`/`listInfinite`/`mutate` + async helpers) is reimplemented on `QueryObserver` / `InfiniteQueryObserver` / `MutationObserver`, projecting results into core signals. **The DSL signature is frozen — the 47 consuming modules do not change.** This is **not a "seam swap — semantics preserved exactly"; it is a port of `useBaseQuery`/`useInfiniteQuery` onto core signals** and is the largest single work item in Phase 1. It carries **five named parity acceptance criteria**: (i) microtask-batched scheduler / torn-key protection (§2 rule 4); (ii) reactive-key re-subscription; (iii) function-form `enabled` parity (8 services, e.g. `invoices.service.ts:55` — while `enabled` resolves false, no guard rejection may enter the error state or retry pipeline); (iv) `promise` projected as a **live getter** over the observer's current result, never a destructured snapshot (4 in-core awaits: `useSystem.ts:165,180,188`, `useBrand.ts:271`); (v) observer disposal on scope teardown. **Definition-of-ready: a pre-rewrite characterization suite** at the DSL boundary (mocks HTTP only, green against `@tanstack/vue-query` first, **immutable through the rewrite MR**) — because the plan's named oracle `modules/query/__tests__/mocks.ts:44` mocks `@tanstack/vue-query`, the exact boundary the rewrite deletes, so it self-voids at the moment of maximum risk. One suite line pins **`mutate()` dropping mutation variables** bug-for-bug (`useQuery.ts:897-907`, current no-arg `mutationFn` behaviour).
- `headless-vue` installs `@tanstack/vue-query`'s `VueQueryPlugin` **with the same `QueryClient`** (`{ queryClient }` option) for devtools and any component-land hooks. One cache, two doors — the exact FE-1122 blocker, now supported.
- `@tanstack/vue-store` → `@tanstack/store` (same `Store` class). The hand-rolled `storeTick` reactivity bridge in `session-store.store.ts` is replaced by one generic store→signal helper.
- `@tanstack/pacer` and `@tanstack/query-persist-client-core` are already framework-agnostic and stay in core unchanged.

### 4. i18n

- Core translates via **`@intlify/core-base`** — vue-i18n's own runtime published Vue-free — behind the existing `useI18n` wrapper (`createCoreContext` + `translate`). **Catalogs are untouched**: pipe plurals, linked messages (`@:`), and the `@.markdown`/`@.html` modifiers are all intlify features, not Vue features. No ICU rewrite.
- Locale state (the `useLocale` precedence chain) and brand message overrides live in core, as today.
- `headless-vue` mirrors the same messages + locale into the host app's vue-i18n instance, so component-land `$t` and the `<i18n-t>` usages (12 occurrences across 10 files) keep working unchanged. One source of truth in core; vue-i18n is a mirror.
- The 2 files importing vue-i18n directly (`utils/useMoney.ts`, `client-personal-details/usePersonalDetailsManager.ts`) are redirected to the wrapper.
- A future non-Vue consumer gets `t()` from the same intlify context; a later catalog migration to ICU (if ever wanted) is a separate decision this ADR does not take.

### 5. Scope registry

Pattern unchanged — string scope keys + `Map` are already framework-neutral. `effectScope` comes from `@vue/reactivity` (import swap). `scope.devtools.ts` moves to `headless-vue`. The per-request registry required for SSR (ADR 023 §10 Axis 2) rides this same seam later; this ADR does not take that work on, but must not obstruct it.

### 6. Config: `provide`/`inject` replaced by the scope registry

The config module's `provideConfig`/`injectConfig` — the only Vue tree-DI in core, and a known source of `inject() outside setup()` warnings — is **deleted, not wrapped**. `useConfig` becomes a scoped composable resolved from the scope registry with an explicit scope key (e.g. the `UIContext`), consistent with ADR 001.

Accepted trade: implicit nearest-ancestor subtree inheritance is replaced by explicitly naming the scope. The `reactive()` template-unwrapping ergonomics move to the `headless-vue` wrapper. With 38 consuming files in `client-vue`, this is the one migration item that is real design work rather than a codemod — it is scoped as its own task.

**Timing (resolved 2026-07-17 — the two halves of this item live in different phases):** the scope-registry config **factory** lands in **Phase 1**, behind the existing public API (`provideConfig`/`injectConfig` become thin shims over the registry) — consumer-invisible, consistent with Migration §1. The **38-file `client-vue` consumer migration** (explicit scope keys, the real design work) is **Phase 2** work, landing with the cut's codemod wave. The earlier text filed both halves under Phase 1, which contradicted Phase 1's "no consumer-visible change" guarantee.

### 7. Stragglers

| Today | Becomes |
|---|---|
| `vue-router` types (10 files, type-only) | core-owned structural interfaces (`RouterPort` — only the fields we use); host still injects the instance |
| `@vueuse/core` `useBreakpoints` (1 file) | `matchMedia` signal util in core. **Scope note (2026-07-17):** the sole importer is `modules/config/useConfig.ts:1` — the **same file** as §6's config-DI rework, so the two items are one file's worth of coordinated work; and the "~15-line" estimate under-scopes it — the util must reproduce the full `breakpointsTailwind` preset (sm/md/lg/xl/2xl) **and** the reactive `.smaller(name)` comparator used at `useConfig.ts:45-49` |
| `@sentry/vue` (2 files, `logger.error` + `addBreadcrumb`) | injected telemetry/logger port; the app wires Sentry; core drops the dep |
| `@vue/devtools-api` scope inspector | `headless-vue` |
| `@xstate/inspect` (1 file, `useUpmind.ts:2` — browser devtools inspector, websocket + `window`) | moves to `headless-vue` (or is dropped); added to the §8 ban list. Previously un-inventoried |
| `import.meta.env` reads (6 files) → **`runtimeEnv.ts` config port** | one core-owned seam: guarded read (`(import.meta as any).env ?? {}`) + runtime override via the existing init/config port — de-bakes the published dist (today `usePOP.ts:17-19` bakes `upmind-production`/`api.upmind.io`/`euc1` and `usePlaces.ts:41` bakes the Google-Maps API key with no fallback or override — a secret-baking channel). The i18n dev-overlay `import.meta.glob` (`useI18n.ts:81`) gets an optional-chained guard and the auto-glob moves to `headless-vue` |
| `nextTick` (1 file, `useI18n`) | `queueMicrotask` |
| `onUnmounted` (1 file, `useOrder`) | explicit `destroy()` in core; lifecycle sugar in `headless-vue` |

### 8. Enforcement & proof

- **Lint boundary in core:** imports of `vue`, `@vue/*` (except `@vue/reactivity`, and that only from `src/signals.ts`), `vue-router`, `vue-i18n`, `@vueuse/*`, `@tanstack/vue-*`, `@sentry/vue`, **`@xstate/vue`, `@xstate/inspect`** are errors. **This rule is net-new work, not a reuse (corrected 2026-07-17):** ADR 027's "no-`vue` lint" was proposed-only and never implemented; the existing `@internal/no-cross-module-imports` plugin is a different rule shape (relative `@internal` cross-module reach, not package-name bans); and there is **no CI lint job at all today** — the rule *and* its CI gate must both be built (owned by FE-2998).
- **Dual-`@vue/reactivity`-instance prescription (condition of acceptance):** `@vue/reactivity` is an **exact-pinned direct dependency** of core (no caret; equal to the workspace `vue` version — vue's own chain is exact-pinned at every hop, so any caret makes divergence deterministic; peer becomes right only at the npm-publish milestone for Vue-host consumers). Consumers' `resolve.dedupe` arrays (`apps/{cart,hosting,velia}/vite.config.ts:80`, `cart-nuxt/nuxt.config.ts:157`) extend from `["vue-router"]` to `["vue-router", "vue", "@vue/reactivity"]`. A one-line lockfile CI check enforces a single resolved copy: `test "$(grep -oE "'@vue/reactivity@[0-9]+\.[0-9]+\.[0-9]+" pnpm-lock.yaml | sort -u | wc -l)" -eq 1`. `vue`/`@vue/reactivity` are treated as **one atomically-bumped unit** (Vue 3.6 rebuilds reactivity on alien-signals — the near-term trigger for silent dual-instance drift).
- **Vanilla CI proof (respecced 2026-07-17):** a vitest project with **`environment: "happy-dom"`** — *not* plain Node: core eager-crashes at import on a bare `localStorage` read (`query.utils.ts:164-168`) and the flow reaches `window`/`sessionStorage`; the "Node-only" label was a misnomer. The *no-vue* assertion stands and sharpens: the proof imports a **freshly built dist** (not source), drives the scripted basket flow, and asserts the resolved module graph contains none of `vue`, `vue-i18n`, `vue-router`, `@vueuse/*`, `@tanstack/vue-*`, `@sentry/vue`, `@vue/*` — **except exactly one copy each of `@vue/reactivity` and `@vue/shared`** (the allowlist without which the "no Vue in module graph" gate is unsatisfiable, since `@vue/reactivity` depends on `@vue/shared`; the "exactly one copy" clause doubles as the dual-instance check). Added gates: `grep -RE 'import\.meta\.(env|glob|hot)' dist --include='*.js'` must return empty, plus one plain-`node` import smoke of `dist/index.js`. Agnosticism can never silently regress to aspirational again.
- **External-consumer contract (customer surface resolved 2026-07-17 — the Svelte customer is on SvelteKit/Vite):** the customer consumes the **generic built dist** from npm with the `runtimeEnv.ts` config port (§7); the documented SvelteKit SSR requirements — `ssr.noExternal: ['@upmind-automation/headless*']` and the runtimeEnv port — are **mandatory ACs** of FE-2999, published as the consumer contract. (For any future *source*-consuming Vite user: `optimizeDeps.exclude` + a filesystem alias for the `@upmind-automation/i18n/**` bare-specifier glob.)
- Core's `type-check` drops `vue-tsc` for plain `tsc`.

### 9. Delivery & licensing

**Corrected framing (2026-07-17):** the panel's "no lawful delivery path" finding was **factually wrong against live state** — `.gitlab-ci/headless.yml` already implements a tagged `build → publish-internal (GitLab) → publish-public-npm (--access public)` pipeline, and `@upmind-automation/headless@0.0.8` is **public on npmjs.org today**. The delivery mechanism exists and is battle-tested; the residual work is narrow:

- **CI clone (FE-2999 path):** replicate the `headless.yml` job-set for `headless-vue`/`headless-svelte` and register them in `.gitlab-ci.yml` (the `include:` list and cache-path lists).
- **runtimeEnv de-baking (AC):** the published dist must be generic — no baked env/secrets (§7's `runtimeEnv.ts` port; `usePlaces.ts:41` Google-Maps key, `usePOP.ts:17-19` endpoints).
- **`exports` field:** add one to `package.json` (absent today; `main`/`types`/`files` only).
- **ADR-023 scoping note:** ADR 023 constraint 1 ("internal-only, source-consumed, no registry publishing") is scoped to the **client-vue → domain-package wave** — its opener deprecates `client-vue`, and constraint 5 treats headless as "already cleanly modular". The headless family inherits headless's existing publish regime, so this ADR creates **no new contradiction** (were constraint 1 read as global, the existing publish jobs would already violate it, independent of this ADR). Version/semver posture for the three externally-published packages folds into this work item.
- **DECISION (owner, 2026-07-17): public npm + commercial licence.** Keep the existing `.gitlab-ci/headless.yml` pipeline unchanged; replace `UNLICENSED` with a proprietary/commercial licence ("source-available, usage by agreement"); the customer installs from public npm.

---

## Migration

Four phases, each independently green on `develop` (full suite gate per phase; ADR 021 ceilings apply):

1. **Seam consolidation** — inside the current package, no consumer-visible change: introduce `src/signals.ts` (with the §2 rule-4 scheduler contract) and codemod all reactivity imports through it; replace `@xstate/vue` `useActor` with a vanilla actor→signal bridge in `useState.ts:277` **plus the ~19-file import codemod and the bridge-naming decision** (the wrapper's computed-shaped `useActor` has 2 live consumers, `usePaymentGateway.ts:39` / `usePaymentDetail.ts:70`, so the bridge export for the 19 cannot silently reuse the name — codemod-scale, not the one-file swap originally implied); rewrite the query DSL onto query-core observers (per §3 — a port with five parity ACs, characterization suite first); `@tanstack/vue-store` → `@tanstack/store` + store→signal helper; swap the i18n wrapper onto `@intlify/core-base`; **config → scope-registry *factory* behind the existing public API** (the client-vue consumer migration is Phase 2 — see §6 Timing); clear the stragglers (§7, incl. `runtimeEnv.ts` and `@xstate/inspect`). Each lands as its own MR.
2. **The cut** — `signals.ts` re-points `vue` → `@vue/reactivity` (dual-instance prescription per §8 applies); Vue-only files move to the new `headless-vue`; import codemod across `client-vue`/apps **and the wider consumer set (scoped 2026-07-17):** (a) **`apps/velia` and `apps/hosting` are external `git.upmind.io` submodule repos** pinned at SHAs, each aliasing headless→src in its own `vite.config.ts` — re-pointing them to `headless-vue` and extending their `dedupe` arrays means **MRs in two foreign repos + monorepo submodule-SHA bumps**, on the customer critical path; (b) **`playgrounds/labs-nuxt`** (13 files alias headless→src and consume `setupScopeDevtools`/`getRegistry`, which move to `headless-vue` — its `.client.ts` plugin + `Inspector.vue` break at the cut unless re-pointed in the same wave); (c) the **38-file `client-vue` `useConfig` migration** (§6 Timing). The cut also owns the **build/test-config surgery** beyond `vue-tsc→tsc`: `vite.config.ts` `vue()` plugin removal + `rollupOptions.external`/`globals` rewrite; vitest `jsdom`/`happy-dom` env changes + `.vue` coverage-glob removal; the `vue-library.json → @vue/tsconfig` extends chain (core needs a non-Vue base + an `import.meta.env` `.d.ts` replacement for `vite/client`); ~8 Vue devDep removals; re-scoping the `@internal` eslint barrier for the new `headless-vue` package. Plus a **docs-corpus repath step**: `typedoc.json` entryPoints (~300 generated `.md` under `docs/@upmind-automation/headless`), `PACKAGES.md`/per-package `CLAUDE.md`, and `graphify update` (1,322 `packages/headless` refs in `graphify-out/`); and a **size-limit budget** for the ~10KB `@vue/reactivity` cost claim. Lint boundary (net-new, §8) flips to error; `vue`/`vue-router`/`vue-i18n`/`@vueuse/core` leave core's `package.json`.
3. **Svelte + proof** — `headless-svelte` (signal→store bridge + wiring) for the onboarding customer; the vanilla CI proof job (§8 respec); the §9 delivery work items (CI clone, licence swap, runtimeEnv de-baking AC, `exports` field).
4. **Gated by hard triggers (replaces "later, unhurried")** — tighten the public boundary to snapshot/subscribe (§2 rule 3); per-request registry/runtime context per ADR 023 §10. **FE-3000 must complete before any of:** (a) any `headless-react` work begins (§1's `useSyncExternalStore` bridge presupposes the getSnapshot/subscribe contract); (b) `ssr: true` is enabled anywhere; (c) any external consumer beyond the Svelte customer onboards. If no trigger fires, the ref boundary is the de facto permanent contract — which §2 rule 1 now states honestly. Scope correction: the singleton eviction census (`queryClient` `client.ts:7`, `sessionStore` `session-store.store.ts:357`, i18n module state `useI18n.ts:49-53`) belongs to FE-3000 — these live **outside** the registry seam.

**Sequencing rule:** Phases 1–2 land **before** the ADR 023 client-vue → domain-packages wave, so the ten new packages are born importing `headless-vue` and the wave's own codemod does the re-pointing for free. The two workstreams do not otherwise conflict (this touches headless internals; the wave moves client-vue organisms).

---

## Consequences

### Positive

- Core is genuinely portable: the Svelte customer (weeks away) consumes real business logic; the `widgets` story (FE-236) unblocks; ADR 007's "could migrate to React/Solid without rewriting logic" becomes true instead of aspirational.
- The 47 modules, the scoped-composable pattern, the query DSL surface, and the i18n catalogs all survive unchanged — the migration is engine swaps behind seams we already own.
- The FE-1122 failure mode is structurally impossible: core owns the `QueryClient`; adapters are handed it.
- SSR groundwork (ADR 023 §10) is *partially* prepared: the registry/context seam this ADR reinforces carries the per-request registry later, **but** `queryClient` (`client.ts:7`), `sessionStore` (`session-store.store.ts:357`), and i18n module state (`useI18n.ts:49-53`) are singletons **outside** that seam — their eviction is FE-3000 scope (corrected 2026-07-17; the earlier "gets cheaper" claim overstated).
- `inject() outside setup()` warnings are eliminated (config tree-DI deleted).

### Costs / risks

- `@vue/reactivity` in a non-Vue consumer's bundle (~10KB gzipped) and dependency tree — cosmetic, bounded by §2's binding rules, and eliminated entirely at Phase 4.
- The config re-pattern (38 consumer files) is real design work — the one non-mechanical migration item.
- The query DSL rewrite onto observers must reproduce current retry/scope/reactive-key semantics exactly — mitigated by the frozen DSL surface, the existing integration suite, and the **pre-rewrite characterization suite** (§3). The previously named oracle — the vitest query mocks — self-voids: `mocks.ts:44` mocks `@tanstack/vue-query`, the boundary the rewrite deletes.
- Until Phase 4, engine refs cross the package boundary (documented waypoint, lint-bounded).

---

## References

- ADR 001 (scope-based composables) · ADR 006 (TanStack Query) · ADR 007 (headless architecture) · ADR 023 §2/§10 (package cut, SSR state model) · ADR 027 (Vue-agnostic ruling, no-`vue` lint precedent)
- Linear: FE-658 (original Flow/Flow-vue rename), FE-1122 (the 2025 collapse this ADR reverses), FE-223 (original vanilla+wrapper architecture), FE-236 (widgets on headless), FE-650 (npm publishing)
- Coupling inventory: session research 2026-07-16 (Vue API census, TanStack map, i18n map, scope mechanism, consumer map)
- TanStack v5 `query-core`/adapter architecture; `@intlify/core-base` (vue-i18n runtime, Vue-free); Vue 3.5 `@vue/reactivity` exports (`watch` included)

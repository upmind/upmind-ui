# Changelog — Routing Module

## [Unreleased] - 2026-07-27

### Added

- **Funnel inheritance (`extends`)** — `FunnelProps.extends` names a registered base funnel; a variant declares only what it adds or diverges on
- **`extendFunnel()`** — Flattens an `extends` chain base-first in `utils.ts`; nests to any depth, throws on an unregistered base or a circular chain
- **`FunnelContext.funnel`** — Handover slot read off `complete`'s final data, naming the funnel to load next instead of falling back to the default
- **`FunnelResponse.funnel`** — Lets a guard service request a funnel handover alongside its target route
- **`extendFunnel` unit tests** — `__tests__/extendFunnel.test.ts` covers single-level, nested, wholesale-override, non-mutation and cycle cases

### Changed

- **`prepare()`** — Resolves a funnel's `extends` chain before generating endpoint nodes, so overlay eligibility sees the full inherited state set

### Documentation

- **[ADR 023](../../../../../../docs/adr/023-funnel-inheritance.md)** — Funnel inheritance: rejected alternatives, merge semantics, and where the starting funnel is chosen
- **`architecture.md`** — Funnel Composition and Starting-Funnel sections
- **`gotchas.md`** — #3: an `extends` override owns the whole state node
- **`usage.md`** — `register()` / `switchFunnel()` notes on funnel selection vs runtime override

## [FE-1365] - 2026-04-21

### Added

- **Reactive watcher system** — `FunnelWatcher` interface and `watcherSubscription` invoked callback in funnel machine
- **Session logout watcher** — Detects auth state transitions via XState `subscribe()` and redirects to `SESSION_END`
- **Basket unavailable watcher** — Redirects when basket becomes unavailable during active session
- **Basket empty watcher** — Redirects when all products are removed from basket
- **`QUERY_PARAMS.RETURN_URL`** — Enum constant for `returnUrl` query parameter
- **`QUERY_PARAMS.CANCEL_URL`** — Enum constant for `cancelUrl` query parameter
- **`availableStateName` extraction** — Used in `resolve()` to prevent skipping RESOLVE when funnel state doesn't match target
- **`registerOverlayRoutes()`** — Function to register overlay routes on the router before initial navigation
- **Overlay route auth guard** — `guardBasket` rejects with SESSION route when BID present but user unauthenticated
- **Navigation mutex** — Prevents double-navigation race conditions in routing engine
- **Lifecycle callbacks** — `onAfterEnter`, `onBeforeLeave`, `onResolving`, `onResolved` hooks in routing engine
- **`isMounted()` method** — Waits for both funnel resolution AND page mount (equivalent to Nuxt's `page:finish`)
- **`mount()` method** — Called by RouteView to signal page component has mounted
- **Shell component tracking** — `useShell` composable to prevent cross-page layout bleed during transitions
- **PRE_RESOLVE event** — Pre-locks funnel before RESOLVE to close watcher race window (FE-2587)

### Changed

- **`useOverlayRoute.close()`** — Changed from `router.push()` to `router.replace()` for cleaner history
- **Overlay route params** — `close()` uses `RETURN_URL`, `dismiss()` uses `CANCEL_URL` (both via enum)
- **Watcher state tracking** — Moved before `isResolved` gate to prevent missed transitions
- **Query param access** — All apps (cart, cart-nuxt, hosting, velia) now use `QUERY_PARAMS` enum

### Fixed

- **Logout on `/basket/:bid`** — Session logout watcher now fires reliably using `subscribe()` instead of Vue `watch()`
- **BID loss during auth redirect** — `returnUrl` preserves full path including basket ID
- **`returnUrl` self-reference** — Fixed `const returnUrl = returnUrl` variable shadowing bug in `ensureBidAuth`
- **Missing `availableStateName`** — Added to `resolve()` using `stateValue()` (was referenced but never defined)
- **Headless import in cart** — Changed `@upmind-automation/headless` to `@upmind-automation/client-vue`

### Architecture Decisions

- **ADR-FE-001:** Use `subscribe()` over `watch()` for XState transitions in non-component contexts
- **ADR-FE-002:** `meta` objects contain boolean flags only — non-booleans extracted locally
- **ADR-FE-003:** Query parameters accessed via `QUERY_PARAMS` enum (single source of truth)

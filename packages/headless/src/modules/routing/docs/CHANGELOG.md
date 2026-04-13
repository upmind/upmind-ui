# Changelog — Routing Module

## [FE-1365] - 2026-04-10

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

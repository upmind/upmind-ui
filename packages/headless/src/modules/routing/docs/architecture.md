# Architecture — Routing Module

## Overview

The routing module consists of two XState machines working in tandem:

1. **Routing Engine** (`routingEngine.machine.ts`) — The broker that selects and invokes funnels
2. **Funnel Machine** (`funnel.machine.ts`) — The factory-built machine that runs a specific customer journey

## State Machine: Routing Engine

```mermaid
stateDiagram-v2
    [*] --> subscribing
    subscribing --> selectingFunnel: CONFIG_LOADED
    selectingFunnel --> guiding: FUNNEL_READY
    guiding --> selectingFunnel: SWITCH_FUNNEL
    guiding --> selectingFunnel: onDone (chaining)
    guiding --> error: onError
    error --> selectingFunnel: RETRY
```

### States

| State             | Purpose                                           |
| ----------------- | ------------------------------------------------- |
| `subscribing`     | Initial setup, loads config and default funnel ID |
| `selectingFunnel` | Picks the funnel machine config, runs factory     |
| `guiding`         | Invokes the active funnel sub-machine             |
| `error`           | Error state with retry capability                 |

## State Machine: Funnel (Factory-Built)

```mermaid
stateDiagram-v2
    [*] --> loading
    loading --> available: BASKET_LOADED
    loading --> unavailable: ERROR

    state available {
        [*] --> idle
        idle --> resolving: RESOLVE
        resolving --> resolved: GUARD_PASSED
        resolving --> rejected: GUARD_FAILED
        rejected --> resolving: RESOLVE (retry)
    }

    available --> [*]: COMPLETE (final)
```

### Key Design: Watcher Subscriptions

Watchers are **invoked callbacks** within the `available` state. They start when the funnel enters `available` and stop when it exits.

```mermaid
sequenceDiagram
    participant FM as Funnel Machine
    participant WS as watcherSubscription
    participant SW as Session Watcher
    participant BW as Basket Watcher

    FM->>WS: enter available → invoke
    WS->>SW: handler() → subscribe
    WS->>BW: handler() → subscribe
    Note over SW,BW: Watchers monitor state...
    SW-->>FM: navigate(SESSION_END) on logout
    BW-->>FM: navigate(BASKET_EMPTY) on empty
    FM->>WS: exit available → cleanup
    WS->>SW: unsubscribe()
    WS->>BW: stop()
```

## Data Flow: Auth Redirect

When a user hits a BID-gated route without authentication:

```mermaid
sequenceDiagram
    participant User
    participant Guard as guardBasket
    participant Funnel as Funnel Machine
    participant Overlay as Auth Overlay
    participant Session as Session Machine

    User->>Guard: Navigate to /basket/:bid
    Guard->>Guard: Check auth (isAuthenticated?)
    Guard-->>Funnel: reject → SESSION route + returnUrl
    Funnel->>Overlay: Show auth overlay
    User->>Overlay: Login
    Overlay->>Session: AUTHENTICATE
    Session-->>Overlay: Success
    Overlay->>Guard: router.replace(returnUrl)
    Guard->>Guard: Check auth ✅ + load basket
    Guard-->>User: Resolved → show basket
```

## Design Decisions (ADRs)

Architectural decisions for the routing module are documented in the centralized [`docs/adr/`](../../../../../docs/adr/) folder:

| ADR                                                                                                       | Decision                                                                    | Status   |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------- |
| [018 — Funnel Reactive Watchers](../../../../../docs/adr/018-funnel-reactive-watchers.md)                 | Watcher subscription mechanism, subscribe vs watch, state tracking patterns | Accepted |
| [017 — Funnel Navigation via State Meta](../../../../../docs/adr/017-funnel-navigation-via-state-meta.md) | Declarative meta-driven navigation                                          | Accepted |

## Integration Points

| Component          | Role                    | File                                         |
| ------------------ | ----------------------- | -------------------------------------------- |
| `useRoutingEngine` | Composable API for apps | `useRoutingEngine.ts`                        |
| `useRouting`       | Router integration      | `useRouting.ts`                              |
| `useOverlayRoute`  | Overlay close/dismiss   | `packages/client-vue/.../useOverlayRoute.ts` |
| `useQueryParams`   | Type-safe query access  | `useQueryParams.ts`                          |
| Funnel watchers    | Reactive navigation     | `apps/cart/src/router/funnels/watchers.ts`   |

# Routing Module

The routing module manages complex, context-sensitive customer journeys (funnels) using XState. Think of it as a **GPS for your app** — it figures out where the user should be, handles detours (like login), and watches for state changes that require rerouting.

## Quick Start

```typescript
import { useRoutingEngine } from "@upmind-automation/client-vue";

const { useMeta, useActions } = useRoutingEngine();
const { meta, navigate } = useRoutingEngine();

// Navigate to a named route
navigate({ name: "basket", params: { bid: "abc-123" } });

// Check routing state
if (meta.value.isResolved) {
  // Route is resolved and ready
}
```

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| Funnel-based routing | ✅ | Declarative state-driven navigation |
| Overlay routes | ✅ | Auth/session modals via named routes |
| Reactive watchers | ✅ | Auto-redirect on session/basket changes |
| Query param normalization | ✅ | `QUERY_PARAMS` enum for type-safe param access |
| BID preservation | ✅ | Basket ID survives auth redirects |
| Navigation mutex | ✅ | Prevents double-navigation race conditions |

## Key Concepts

### Funnels
A funnel is a set of routing rules for a specific customer journey (e.g., cart checkout, web hosting setup). The **Routing Engine** acts as a broker — it picks the right funnel and delegates.

### Watchers
Watchers are reactive subscriptions that monitor app state (session, basket) and trigger navigation when conditions change. They run while the funnel is in its `available` state.

### Overlay Routes
Named routes like `/auth` render as modals/drawers on top of the underlying page. They use `returnUrl` / `cancelUrl` query params to navigate back when dismissed.

## Documentation

- [Architecture](./architecture.md) — State machines, data flow, design decisions
- [Watchers](./watchers.md) — Reactive navigation watchers
- [Overlay Routes](./overlay-routes.md) — Auth overlay and route-based modals
- [Gotchas](./gotchas.md) — Edge cases and known issues
- [CHANGELOG](./CHANGELOG.md) — Version history

> **🔧 For Contributors:** The core machines are in `routingEngine.machine.ts` and `funnel.machine.ts`.

> **👩‍💻 For Developers:** See the [parent README](../README.md) for the full funnel broker architecture.

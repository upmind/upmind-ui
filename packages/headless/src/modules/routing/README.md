# XState Funnel Routing Engine: Developer Guide 🧭

This document outlines the architecture and conventions for the application's central routing machine, which manages complex, context-sensitive customer journeys (Funnels) using XState.

## 1. 🚀 Core Architecture: The Funnel Broker

The **Routing Engine** (`routingEngine`) is a headless XState machine that acts as a **Funnel Broker**. Its sole job is to determine **which** set of routing rules (the **Active Funnel Machine**) to invoke. It does not contain any specialized, hardcoded route logic.

- **Isolation:** Specialized routing logic is separated into individual Funnel Sub-Machines.
- **Factory Pattern:** Funnel Sub-Machines are built using a factory (`createFunnelMachine`) to guarantee a uniform input/output signature.
- **Dynamic Default:** The Engine uses a dynamically configured `defaultFunnelId` (set during registration) for fallbacks, ensuring flexibility for CMS-driven funnel naming.
- **Chaining:** Funnels can sequentially hand off control to the next specialized funnel using the completion data.

---

## 2. ⚙️ Parent Machine States and Context (`routingEngine`)

This machine manages the overall lifecycle and delegates all computational work.

| State                 | Role                                                                                              | Key Action                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------- |
| **`subscribing`**     | Initial setup; loads configuration (including `defaultFunnelId`).                                 | **`setContextAndDefaultFunnel`** (Assigns dynamic default ID and funnel configs). |
| **`selectingFunnel`** | The **Mandatory Decision Point**. Loads the machine config specified by `context.activeFunnelId`. | **`prepareActiveMachine`** (Runs the factory with the chosen config).             |
| **`guiding`**         | The operational state. **Invokes** the selected Funnel Sub-Machine and forwards user events.      | **`invoke: { src: activeFunnelMachine }`**                                        |

### Crucial Context Fields

| Field             | Type                            | Role                                                                             |
| :---------------- | :------------------------------ | :------------------------------------------------------------------------------- |
| `activeFunnelId`  | `string`                        | ID of the Funnel Machine currently being invoked (e.g., `'webHosting'`).         |
| `defaultFunnelId` | `string`                        | The ID registered as the application's fallback/standard flow (Dynamically set). |
| `funnels`         | `Record<string, MachineConfig>` | The master dictionary of all registered funnel machine configurations.           |

---

## 3. 🎯 Funnel Sub-Machines & Logic Injection

The factory pattern ensures that the Funnel Sub-Machines only worry about the business logic.

### A. The Factory (`createFunnelMachine`)

The factory acts as a **Dependency Injector**, wiring up the logic provided by the configuration.

| Injection Target           | Provided By Funnel Config | XState Implementation                                                  |
| :------------------------- | :------------------------ | :--------------------------------------------------------------------- |
| **Nodes** (States)         | `statesConfig`            | Merged into the static `FLOW` container state using `...statesConfig`. |
| **Guards** (Conditions)    | `guards` object           | Passed to the `createMachine` options object (second argument).        |
| **Services** (Async Logic) | `services` object         | Passed to the `createMachine` options object (second argument).        |

### B. Funnel Completion (`type: 'final'`)

Every funnel must conclude by transitioning to a state defined as `type: 'final'`. This is the signal for the parent machine to regain control.

| Data Returned                 | Purpose                                              | Parent Action                                                                                     |
| :---------------------------- | :--------------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `resolvedRoute`               | The final route object calculated by the funnel.     | Assigned to `context.currentRoute`.                                                               |
| **`nextFunnelId` (Optional)** | Explicitly names the next funnel to load (Chaining). | Sets parent's `activeFunnelId`. **If omitted, the parent defaults to `context.defaultFunnelId`**. |

---

## 4. 🔄 Funnel Flow Examples

| Scenario                   | Triggering Event/Condition                                                                    | Engine Flow                                                                                                                                                              |
| :------------------------- | :-------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Specialized Activation** | User adds Web Hosting product. Application emits `SWITCH_FUNNEL: { funnelId: 'webHosting' }`. | `selectingFunnel` sets `activeFunnelId: 'webHosting'` $\rightarrow$ `guiding` invokes **Web Hosting Funnel**.                                                            |
| **Funnel Chaining**        | Web Hosting Funnel hits `type: 'final'` state. It returns `{ nextFunnelId: 'express' }`.      | `guiding` receives `onDone`. `activeFunnelId` is set to `'express'`. $\rightarrow$ `selectingFunnel` invokes **Express Funnel**.                                         |
| **Fallback to Default**    | Specialized Funnel hits `type: 'final'`. It returns `{ nextFunnelId: undefined }`.            | `guiding` receives `onDone`. `updateFunnelContextOnDone` sets `activeFunnelId` to `context.defaultFunnelId`. $\rightarrow$ `selectingFunnel` invokes **Default Funnel**. |

---

## 5. 👁️ Reactive Watchers

Watchers are reactive subscriptions that run while the funnel is in `available`. They monitor app state and trigger navigation when conditions change.

| Watcher | Monitors | Triggers |
|---------|----------|----------|
| `session-logout` | Session machine (via `subscribe()`) | Navigate to `SESSION_END` on logout |
| `basket-unavailable` | Basket meta (via `watch()`) | Navigate to `BASKET_UNAVAILABLE` |
| `basket-empty` | Basket meta (via `watch()`) | Navigate to `BASKET_EMPTY` |

Watchers are registered per-funnel in the app's configuration and started/stopped automatically by the `watcherSubscription` invoked callback.

> See [docs/watchers.md](./docs/watchers.md) for patterns and implementation details.

---

## 6. 🪟 Overlay Routes

Named routes that render modals/drawers on top of the current page (e.g., `/auth` for login). They use `QUERY_PARAMS.RETURN_URL` and `QUERY_PARAMS.CANCEL_URL` to navigate back when the overlay is closed or dismissed.

> See [docs/overlay-routes.md](./docs/overlay-routes.md) for the full overlay route API.

---

## 7. 🔑 Query Parameter Conventions

All query parameter keys use the `QUERY_PARAMS` enum from `@upmind-automation/types`:

```typescript
import { QUERY_PARAMS } from "@upmind-automation/types";

query: { [QUERY_PARAMS.RETURN_URL]: route.fullPath }
```

---

## 📚 Documentation

| Document | Contents |
|----------|----------|
| [docs/README.md](./docs/README.md) | Overview and quick start |
| [docs/architecture.md](./docs/architecture.md) | State machines, data flow, ADRs |
| [docs/watchers.md](./docs/watchers.md) | Watcher patterns and implementation |
| [docs/overlay-routes.md](./docs/overlay-routes.md) | Auth overlay and route-based modals |
| [docs/gotchas.md](./docs/gotchas.md) | Edge cases and known issues |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Version history |

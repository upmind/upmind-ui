# useRoutingEngine API Reference

The `useRoutingEngine` composable provides the primary interface for interacting with the routing system.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

const routing = useRoutingEngine();
```

## State

### `isNavigating`

`Ref<boolean>` — True while a programmatic navigation is in progress. Used as a mutex to prevent double-navigation.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

const { isNavigating, navigateNext } = useRoutingEngine();

export function onContinue() {
  // Navigation already in progress — skip rather than queue a duplicate.
  if (isNavigating.value) return;
  return navigateNext();
}
```

### `isReady()`

`() => Promise<boolean>` — Resolves when the routing engine is initialized and the router is ready.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

const { isReady } = useRoutingEngine();

await isReady();
// Router and routing engine are now available
```

### `isResolved()`

`() => Promise<boolean>` — Resolves when the current funnel has finished resolving the route.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

const { isResolved } = useRoutingEngine();

await isResolved();
// Funnel has determined the correct route
```

### `isMounted(target)`

`(target: RouteLocation | string) => Promise<boolean>` — Resolves when both the funnel is resolved AND the target page component has mounted. Equivalent to Nuxt's `page:finish` hook.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

const { isMounted } = useRoutingEngine();

await isMounted("basket");
// Page has rendered and is ready for interaction
```

### `meta`

`ComputedRef<RoutingMeta>` — Reactive routing state flags.

| Property         | Type      | Description                            |
| ---------------- | --------- | -------------------------------------- |
| `isSubscribing`  | `boolean` | Engine is initializing                 |
| `isLoading`      | `boolean` | Funnel is loading                      |
| `isAvailable`    | `boolean` | Funnel is in available state           |
| `isGuiding`      | `boolean` | Funnel is actively guiding             |
| `hasErrors`      | `boolean` | Error state                            |
| `hasFunnels`     | `boolean` | Funnels are registered                 |
| `isResolved`     | `boolean` | Current route is resolved              |
| `isInitialRoute` | `boolean` | First navigation (no prior resolution) |
| `hasTarget`      | `boolean` | Target route is set                    |

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";
import { watch } from "vue";

const { meta } = useRoutingEngine();

watch(
  () => meta.value.isResolved,
  resolved => {
    if (resolved) {
      // Route is ready
    }
  }
);
```

## Context

### `router`

`Router` — The Vue Router instance (available after `init()` is called).

### `errors`

`ComputedRef<ResponseError | undefined>` — Any error from the routing engine.

## Methods

### `init(router)`

`(router: Router) => Router` — Initialize the routing engine with a Vue Router instance. Call once during app setup.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({ history: createWebHistory(), routes: [] });
useRoutingEngine().init(router);
```

### `register({ funnels, defaultFunnel, overlays, watchers })`

Register funnel configurations, the overlay registry and watchers with the engine.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";
import type { FunnelProps, FunnelWatcher } from "@upmind-automation/headless";

// Funnel configs and watchers are app-owned — see `apps/cart/src/router/funnels/`.
const cartFunnel = <FunnelProps>{
  id: "cart",
  states: { basket: { meta: { next: "checkout" }, entry: ["setBasket"] } }
};
const domainsFunnel = <FunnelProps>{
  id: "domains",
  states: { domains: { meta: { prev: "basket" } } }
};
const sessionLogoutWatcher: FunnelWatcher = {
  id: "session-logout",
  handler: () => () => {}
};
const basketEmptyWatcher: FunnelWatcher = {
  id: "basket-empty",
  handler: () => () => {}
};

const { register } = useRoutingEngine();

register({
  defaultFunnel: "cart",
  funnels: { cart: cartFunnel, domains: domainsFunnel },
  watchers: [sessionLogoutWatcher, basketEmptyWatcher]
});
```

`register()` runs after brand, system and session have resolved, so `defaultFunnel` may be derived from brand config rather than hardcoded. This is the single place a brand's starting funnel is chosen — do not re-derive it from inside a funnel state. Watchers are registered **once, engine-wide** here, not per funnel; the engine passes them into whichever funnel is active.

### `guard(route)`

`(route: RouteLocation) => Promise<RouteLocation>` — Run the funnel guard pipeline for a route. Used in router guards.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({ history: createWebHistory(), routes: [] });

router.beforeEach(async to => {
  return useRoutingEngine().guard(to);
});
```

### `switchFunnel(funnelId, route, event?)`

`(funnel: string, route: RouteLocation, event?: any) => Promise<void>` — Switch to a different funnel.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

const { switchFunnel, router } = useRoutingEngine();

await switchFunnel("domains", router.currentRoute.value);
```

`useRouting` calls this automatically when a route carries `?funnel=`, before guarding the route. It is ignored when the id is unregistered or already active.

The engine holds `currentFunnel` across navigations, so the switch persists without the query param being repeated — provided the target funnel can serve the routes the user then visits. A funnel that hits a route it does not declare completes and the engine reloads the default, undoing the switch; a variant should `extends` the base so it inherits those routes instead of evicting itself. See [ADR 034](../../../../../../docs/adr/034-funnel-inheritance.md).

### `refresh()`

`() => void` — Reload the current route without cache (`router.go(0)`).

### `stop()`

`() => void` — Stop the routing engine service.

## Navigation

### `navigate(target, data?)`

`(target: string | FunnelTarget, data?: any) => Promise<void>` — Navigate to a target route through the funnel pipeline.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

const { navigate } = useRoutingEngine();

// By route name
navigate({ name: "basket", params: { bid: "abc-123" } });

// With event data
navigate({ name: "checkout" }, { skipValidation: true });
```

### `navigateNext(event?)`

`(event?: any) => Promise<void>` — Navigate to the next route as defined by the funnel's `meta.next`.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

// In a page component
const { navigateNext } = useRoutingEngine();
const onContinue = () => navigateNext();
```

### `navigateBack(event?)`

`(event?: any) => Promise<void>` — Navigate to the previous route as defined by the funnel's `meta.prev`.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

// In a page component
const { navigateBack } = useRoutingEngine();
const onBack = () => navigateBack();
```

## Lifecycle Callbacks

### `mount(name?)`

`(name?: string) => void` — Signal that a page component has mounted. Called by `RouteView` on `@vue:mounted`.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";
import type { RouteLocation } from "vue-router";

const { mount } = useRoutingEngine();

// In RouteView
export function doPageFinish(el: Element, route: RouteLocation) {
  mount(route.name?.toString());
}
```

### `onBeforeLeave(callback)`

`(callback: () => void) => () => void` — Register a callback for navigation start. Returns unsubscribe function.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";
import { useShell } from "@upmind-automation/client-vue";
import { onUnmounted } from "vue";

const { onBeforeLeave } = useRoutingEngine();

const unsubscribe = onBeforeLeave(() => {
  useShell().reset();
});

onUnmounted(unsubscribe);
```

### `onAfterEnter(callback)`

`(callback: () => void) => () => void` — Register a callback for when a page mounts. Returns unsubscribe function.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

const { onAfterEnter } = useRoutingEngine();

onAfterEnter(() => {
  window.scrollTo(0, 0);
});
```

### `onResolving(callback)`

`(callback: () => void) => () => void` — Register a callback for when route starts resolving. Returns unsubscribe function.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

declare function showLoadingIndicator(): void;

const { onResolving } = useRoutingEngine();

onResolving(() => {
  showLoadingIndicator();
});
```

### `onResolved(callback)`

`(callback: () => void) => () => void` — Register a callback for when route finishes resolving. Returns unsubscribe function.

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";

declare function hideLoadingIndicator(): void;
declare function trackPageView(): void;

const { onResolved } = useRoutingEngine();

onResolved(() => {
  hideLoadingIndicator();
  trackPageView();
});
```

## `useRoutingResolve(options?)`

A view that ends in a resolve or a reject calls it. When the host registers funnels, it takes the funnel step. Else it pushes the route the view was given. Call it before the view's first `await`.

`(options?: RoutingResolveOptions) => { meta, navigateResolved, navigateRejected }`

| Option         | Type                                              | Used when the host has no funnels |
| -------------- | ------------------------------------------------- | --------------------------------- |
| `resolveRoute` | `MaybeRefOrGetter<RouteLocationRaw \| undefined>` | `navigateResolved()` pushes it    |
| `rejectRoute`  | `MaybeRefOrGetter<RouteLocationRaw \| undefined>` | `navigateRejected()` pushes it    |

| Return               | With funnels     | Without funnels                                   |
| -------------------- | ---------------- | ------------------------------------------------- |
| `meta.hasResolve`    | `true`           | `true` when `resolveRoute` has a value            |
| `meta.hasReject`     | `true`           | `true` when `rejectRoute` has a value             |
| `navigateResolved()` | `navigateNext()` | pushes `resolveRoute`; resolves at once when none |
| `navigateRejected()` | `navigateBack()` | pushes `rejectRoute`; resolves at once when none  |

```typescript
import { useRoutingResolve } from "@upmind-automation/headless";

const { meta, navigateResolved, navigateRejected } = useRoutingResolve({
  resolveRoute: () => "/dashboard",
  rejectRoute: "/login"
});

export async function onSignedIn() {
  if (!meta.value.hasResolve) return;
  await navigateResolved();
}

export async function onBack() {
  if (!meta.value.hasReject) return;
  await navigateRejected();
}
```

## Usage Examples

### Basic Navigation Setup

```typescript
// router/index.ts
import { useRoutingEngine } from "@upmind-automation/headless";
import { createRouter, createWebHistory } from "vue-router";
import type { FunnelProps, FunnelWatcher } from "@upmind-automation/headless";

// App-owned — see `apps/cart/src/router/funnels/`.
const cartFunnel = <FunnelProps>{
  id: "cart",
  states: { basket: { meta: { next: "checkout" } } }
};
const sessionLogoutWatcher: FunnelWatcher = {
  id: "session-logout",
  handler: () => () => {}
};

const router = createRouter({ history: createWebHistory(), routes: [] });
const { init, register, guard } = useRoutingEngine();

init(router);
register({
  defaultFunnel: "cart",
  funnels: { cart: cartFunnel },
  watchers: [sessionLogoutWatcher]
});

router.beforeEach(async to => guard(to));

export default router;
```

### Page Component with Navigation

```vue
<script setup>
import { useRoutingEngine } from "@upmind-automation/headless";

const { navigateNext, navigateBack, meta } = useRoutingEngine();
</script>

<template>
  <button @click="navigateBack" :disabled="!meta.isResolved">Back</button>
  <button @click="navigateNext" :disabled="!meta.isResolved">Continue</button>
</template>
```

### Coordinating with Shell

```typescript
import { useRoutingEngine } from "@upmind-automation/headless";
import { useShell } from "@upmind-automation/client-vue";

const { onBeforeLeave, onAfterEnter } = useRoutingEngine();
const shell = useShell();

// Reset shell tracking on navigation start
onBeforeLeave(() => shell.reset());

// Scroll to top after page mounts
onAfterEnter(() => window.scrollTo({ top: 0, behavior: "smooth" }));
```

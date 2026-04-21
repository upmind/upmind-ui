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
const { isNavigating } = useRoutingEngine();

if (isNavigating.value) {
  // Navigation already in progress, skip
  return;
}
```

### `isReady()`

`() => Promise<boolean>` — Resolves when the routing engine is initialized and the router is ready.

```typescript
await isReady();
// Router and routing engine are now available
```

### `isResolved()`

`() => Promise<boolean>` — Resolves when the current funnel has finished resolving the route.

```typescript
await isResolved();
// Funnel has determined the correct route
```

### `isMounted(target)`

`(target: RouteLocation | string) => Promise<boolean>` — Resolves when both the funnel is resolved AND the target page component has mounted. Equivalent to Nuxt's `page:finish` hook.

```typescript
await isMounted("basket");
// Page has rendered and is ready for interaction
```

### `meta`

`ComputedRef<RoutingMeta>` — Reactive routing state flags.

| Property | Type | Description |
|----------|------|-------------|
| `isSubscribing` | `boolean` | Engine is initializing |
| `isLoading` | `boolean` | Funnel is loading |
| `isAvailable` | `boolean` | Funnel is in available state |
| `isGuiding` | `boolean` | Funnel is actively guiding |
| `hasErrors` | `boolean` | Error state |
| `hasFunnels` | `boolean` | Funnels are registered |
| `isResolved` | `boolean` | Current route is resolved |
| `isInitialRoute` | `boolean` | First navigation (no prior resolution) |
| `hasTarget` | `boolean` | Target route is set |

```typescript
const { meta } = useRoutingEngine();

watch(() => meta.value.isResolved, (resolved) => {
  if (resolved) {
    // Route is ready
  }
});
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
const router = createRouter({ ... });
useRoutingEngine().init(router);
```

### `register({ funnels, defaultFunnel, watchers })`

Register funnel configurations and watchers with the engine.

```typescript
register({
  defaultFunnel: "cart",
  funnels: { cart: cartFunnel, domains: domainsFunnel },
  watchers: [sessionLogoutWatcher, basketEmptyWatcher]
});
```

### `guard(route)`

`(route: RouteLocation) => Promise<RouteLocation>` — Run the funnel guard pipeline for a route. Used in router guards.

```typescript
router.beforeEach(async (to) => {
  return useRoutingEngine().guard(to);
});
```

### `switchFunnel(funnelId, route, event?)`

`(funnel: string, route: RouteLocation, event?: any) => Promise<void>` — Switch to a different funnel.

```typescript
await switchFunnel("domains", currentRoute);
```

### `refresh()`

`() => void` — Reload the current route without cache (`router.go(0)`).

### `stop()`

`() => void` — Stop the routing engine service.

## Navigation

### `navigate(target, data?)`

`(target: string | FunnelTarget, data?: any) => Promise<void>` — Navigate to a target route through the funnel pipeline.

```typescript
// By route name
navigate({ name: "basket", params: { bid: "abc-123" } });

// With event data
navigate({ name: "checkout" }, { skipValidation: true });
```

### `navigateNext(event?)`

`(event?: any) => Promise<void>` — Navigate to the next route as defined by the funnel's `meta.next`.

```typescript
// In a page component
const onContinue = () => navigateNext();
```

### `navigateBack(event?)`

`(event?: any) => Promise<void>` — Navigate to the previous route as defined by the funnel's `meta.prev`.

```typescript
// In a page component
const onBack = () => navigateBack();
```

## Lifecycle Callbacks

### `mount(name?)`

`(name?: string) => void` — Signal that a page component has mounted. Called by `RouteView` on `@vue:mounted`.

```typescript
// In RouteView
function doPageFinish(el: Element, route: RouteLocation) {
  mount(route.name?.toString());
}
```

### `onBeforeLeave(callback)`

`(callback: () => void) => () => void` — Register a callback for navigation start. Returns unsubscribe function.

```typescript
const unsubscribe = onBeforeLeave(() => {
  useShell().reset();
});

onUnmounted(unsubscribe);
```

### `onAfterEnter(callback)`

`(callback: () => void) => () => void` — Register a callback for when a page mounts. Returns unsubscribe function.

```typescript
onAfterEnter(() => {
  window.scrollTo(0, 0);
});
```

### `onResolving(callback)`

`(callback: () => void) => () => void` — Register a callback for when route starts resolving. Returns unsubscribe function.

```typescript
onResolving(() => {
  showLoadingIndicator();
});
```

### `onResolved(callback)`

`(callback: () => void) => () => void` — Register a callback for when route finishes resolving. Returns unsubscribe function.

```typescript
onResolved(() => {
  hideLoadingIndicator();
  trackPageView();
});
```

## Usage Examples

### Basic Navigation Setup

```typescript
// router/index.ts
import { useRoutingEngine } from "@upmind-automation/headless";
import { createRouter } from "vue-router";

const router = createRouter({ ... });
const { init, register, guard } = useRoutingEngine();

init(router);
register({
  defaultFunnel: "cart",
  funnels: { cart: cartFunnel },
  watchers: [sessionLogoutWatcher]
});

router.beforeEach(async (to) => guard(to));

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

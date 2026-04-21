# System Module

The system module provides core UI infrastructure components for routing, page transitions, and loading states.

## Components

| Component | Purpose |
|-----------|---------|
| `RouteView` | Wraps RouterView with Suspense, transitions, and shell tracking |
| `Loading` | Interstitial loading indicator |
| `Empty` | Empty state placeholder |
| `Error` | Error state display |

## RouteView

The primary routing wrapper that coordinates page transitions, shell configuration, and the routing engine lifecycle.

### Quick Start

```vue
<template>
  <RouteView :loading-props="{ modal: true }" @resolve="onPageReady" />
</template>

<script setup>
function onPageReady(el: Element) {
  // Page has mounted and shell is configured
}
</script>
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `loadingProps` | `InterstitialProps` | Props passed to the Loading component |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `resolve` | `Element` | Emitted when page component mounts |

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│ RouteView                                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │ RouterView                                        │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ PageTransition                              │  │  │
│  │  │  ┌───────────────────────────────────────┐  │  │  │
│  │  │  │ Suspense                              │  │  │  │
│  │  │  │  ┌─────────────────────────────────┐  │  │  │  │
│  │  │  │  │ Page Component                  │  │  │  │  │
│  │  │  │  │  @vue:beforeMount → reset shell │  │  │  │  │
│  │  │  │  │  @vue:mounted → apply defaults  │  │  │  │  │
│  │  │  │  └─────────────────────────────────┘  │  │  │  │
│  │  │  │                                       │  │  │  │
│  │  │  │  #fallback → Loading                  │  │  │  │
│  │  │  └───────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Lifecycle Integration

RouteView bridges Vue's component lifecycle with the routing engine:

| Vue Event | RouteView Action | Routing Engine |
|-----------|------------------|----------------|
| `@vue:beforeMount` | `shell.reset()` | — |
| `@vue:mounted` | Apply shell defaults | `mount(routeName)` |

This enables:
- **Shell tracking reset** before each page's setup runs
- **Default shell config** for pages that don't explicitly configure it
- **Page mount signal** for scroll restoration and analytics

### Loading State Logic

The Loading component shows based on routing state:

```typescript
// Show loading when:
// 1. Initial route + resolved + debounce passed, OR
// 2. Subsequent route + debounce passed
v-if="
  (meta.isInitialRoute && meta.isResolved && shouldShow) ||
  (!meta.isInitialRoute && shouldShow)
"
```

This prevents:
- Loading flash on initial page load (waits for resolution)
- Loading flash on fast transitions (debounced)

## useRouteTransition

Manages transition animations by watching routing resolution state.

```typescript
import { useRouteTransition } from "@upmind-automation/client-vue";

const { shouldShow, shouldTransition, onEnter, reset } = useRouteTransition();
```

| Return | Type | Description |
|--------|------|-------------|
| `shouldShow` | `Ref<boolean>` | Whether to show loading UI (debounced) |
| `shouldTransition` | `Ref<boolean>` | Whether transition animation is active |
| `onEnter` | `() => void` | Call when Vue transition enter starts |
| `reset` | `() => void` | Reset transition state |

### Timing Constants

```typescript
ANIMATION_DELAY  // Delay before showing loader
DEBOUNCE_DELAY   // Delay before enabling transition
```

## Related

- [Shell Tracking](../../components/shell/docs/README.md)
- [Routing Engine](../../../../headless/src/modules/routing/docs/README.md)
- [ADR 019: Shell State Architecture](../../../../../docs/adr/019-shell-state-architecture.md)

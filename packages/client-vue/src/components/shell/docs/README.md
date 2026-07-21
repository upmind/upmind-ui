# Shell Component Tracking

The shell module tracks which shell components (header, footer, layout) have been configured during a navigation cycle. This prevents cross-page "bleed" where the outgoing page sees config changes from the incoming page during route transitions.

## Quick Start

```typescript
import { useShell, SHELL } from "@upmind-automation/client-vue";

const shell = useShell();

// Mark a component as configured (called by useLayout, useHeader, useFooter)
shell.mark(SHELL.LAYOUT);

// Check if a component was configured this cycle
if (!shell.has(SHELL.HEADER)) {
  useHeader({}); // Apply defaults
}

// Reset tracking for new navigation (called by RouteView)
shell.reset();
```

## The Problem It Solves

With Vue's Suspense wrapping page transitions, both the outgoing and incoming pages exist in the DOM simultaneously during the transition window:

1. User navigates from Page A to Page B
2. Page B's `<script setup>` runs, calling `useLayout({ variant: FULL })`
3. The singleton store mutates immediately
4. Page A is still mounted and re-renders with Page B's layout
5. User sees a broken frame for one paint cycle

## How Shell Tracking Fixes This

```
Navigation Start
    │
    ▼
RouteView: @vue:beforeMount
    │
    ├─► shell.reset()  ← Clear tracking
    │
    ▼
Page B: <script setup>
    │
    ├─► useLayout({ variant })
    │       └─► shell.mark(SHELL.LAYOUT)
    │
    ▼
RouteView: @vue:mounted
    │
    ├─► if (!shell.has(SHELL.HEADER)) useHeader({})  ← Apply defaults
    ├─► if (!shell.has(SHELL.FOOTER)) useFooter({})
    ├─► if (!shell.has(SHELL.LAYOUT)) useLayout({})
    │
    └─► mount(route.name)  ← Signal page ready
```

The key insight: shell config is only applied **after** the page component mounts, not during `<script setup>`. Components that weren't explicitly configured get defaults.

## API

### `useShell()`

Returns tracking methods for shell components.

```typescript
const shell = useShell();
```

| Method  | Signature                       | Description                                 |
| ------- | ------------------------------- | ------------------------------------------- |
| `reset` | `() => void`                    | Clear all tracking for new navigation cycle |
| `mark`  | `(component: Shell) => void`    | Mark a component as configured              |
| `has`   | `(component: Shell) => boolean` | Check if component was configured           |

### `SHELL` Enum

```typescript
enum SHELL {
  HEADER = "header",
  FOOTER = "footer",
  LAYOUT = "layout"
}
```

## Integration with RouteView

`RouteView.vue` orchestrates shell tracking:

```vue
<component
  :is="routerViewProps.Component"
  @vue:beforeMount="doPageStart"
  @vue:mounted="doPageFinish($event, routerViewProps.route)"
/>
```

```typescript
function doPageStart() {
  shell.reset(); // Clear tracking before page setup runs
}

function doPageFinish(el: Element, route: RouteLocation) {
  // Apply defaults for unconfigured components
  if (!shell.has(SHELL.HEADER)) useHeader({});
  if (!shell.has(SHELL.FOOTER)) useFooter({});
  if (!shell.has(SHELL.LAYOUT)) useLayout({});

  mount(route.name?.toString()); // Signal routing engine
}
```

## Related

- [ADR 019: Shell State Architecture](../../../../../../docs/adr/030-shell-state-architecture.md)
- [useLayout](../../layout/useLayout.ts)
- [useHeader](../../header/useHeader.ts)
- [useFooter](../../footer/useFooter.ts)

> **🔧 For Contributors:** The tracking mechanism is intentionally simple. The full XState machine solution described in ADR 019 remains available as a future enhancement if needed.

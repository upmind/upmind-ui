# ADR 030: Shell State Architecture (Layout / Header / Footer / Section)

**Date:** April 2026
**Status:** Accepted (Implemented April 2026, FE-1365)
**Authors:** Dominic da Costa
**Related:** [ADR 005: XState State Management](./005-xstate-state-management.md), [ADR 011: Composable Coding Standards](./011-composable-coding-standards.md), [ADR 017: Funnel Navigation via State Meta](./017-funnel-navigation-via-state-meta.md)

---

## Context

The cart apps (both `apps/cart` and `apps/cart-nuxt`) compose their shell — page layout variant, header config, footer config, section config — via four parallel composables in `packages/client-vue`:

- `useLayout({ variant })`
- `useHeader({ ... })`
- `useFooter({ ... })`
- `useSection({ ... })`

Each composable is a **module-level singleton** backed by `new Store()` (from `@upmind-automation/headless`). Every call mutates the same instance. Across the codebase, **42 page/template files** call these composables at top-level `<script setup>` — synchronously, before mount — to configure the shell for their page.

The pattern was designed to prevent FOUT (flash of unstyled/untemplated content) by setting shell state as early as possible: top-level script setup runs before the component renders, so the first paint uses the correct variant.

### The bug this causes

With Nuxt's Suspense (and the equivalent `<Suspense>` in `apps/cart`'s `RouteView`) wrapping page components, route transitions have a window where **both the outgoing and incoming pages are in the DOM simultaneously**:

1. User navigates from `/order/shop` (catalogue) to `/order/basket`.
2. Vue instantiates the incoming basket page; its `<script setup>` runs.
3. `useLayout({ variant: FULL })` fires synchronously → module store mutates.
4. The outgoing catalogue page is **still mounted** and still subscribed to the same module store. It re-renders with the NEW variant.
5. User sees: **old catalogue content in the new basket layout** for one paint cycle.
6. Eventually Suspense commits the swap; basket takes over.

Symptom: every route change flashes a broken frame. Diagnosed over a long debug session on branch `feature/FE-1365`.

### Hotfixes that were tried and failed

| Approach | Why it failed |
|---|---|
| Move `useLayout` to `onBeforeMount` | Fires during Suspense commit — outgoing page still re-renders |
| Move to `onMounted` | New page renders with old layout first (FOUT reappears) |
| `isResolved().then(...)` in setup | `isResolved()` resolves before DOM swap; same bleed |
| Top-level `await isResolved()` | Makes component suspensible; same bleed window |
| Vue page transition `mode: "out-in"` | Layout state still shared; swap doesn't prevent mutation visibility |
| Page-transition CSS (absolute leaving page) | Same; state mutation fires independent of transition classes |
| `:page-key` on `<NuxtPage>` | Forces remount but doesn't change when state mutation fires |
| `<Suspense timeout="0">` wrap | Fixed cart (custom RouteView) but not cart-nuxt (NuxtPage's internal Suspense absorbs the pending state) |

**Fundamental conclusion:** as long as shell state is **shared + mutable** between pages, any mutation timing either bleeds (before swap) or causes FOUT (after swap). No timing-based fix can escape this.

### How other ecosystems solve this

| Approach | Framework | Mechanism | Scoped? | Bleed-safe? |
|---|---|---|---|---|
| Named layouts via route meta | Nuxt 3 | `definePageMeta({ layout })` — router swaps declaratively | ✅ | ✅ |
| Nested route layouts | Next.js App Router, Remix | `layout.tsx` per route segment, tree-level | ✅ | ✅ |
| Provide/inject for shell config | Generic Vue | Page provides, layout injects, defaults for fallback | ✅ | ✅ |
| Slot composition | Vuetify, PrimeVue | Layout component exposes slots; pages fill them | ✅ | ✅ |
| **Global singleton store** (ours) | — | None widely recommended | ❌ | ❌ |

Our current approach is the one approach none of the major ecosystems use for shell composition, and it's the one approach with this exact bug.

---

## Decision

Replace the four singleton composables with a single **XState `shell.machine.ts`** driven by **declarative route meta**.

### Why XState (not provide/inject)

- **Debuggable.** XState Devtools shows current state, context, and transition history. Provide/inject is an opaque black hole during debugging.
- **Consistent.** The codebase already models auth, basket, product config, and funnel navigation as XState machines. Shell state joins the same pattern.
- **Accessible anywhere.** `useShell()` returns reactive context like Pinia — no tree coupling.
- **Predictable transitions.** `APPLY`, `RESET` events with guards if needed. No ad-hoc mutation.
- **Solves the bleed.** Transitions fire on `router.afterEach` (after navigation commits), not during incoming page `<script setup>`. The outgoing page is unmounted before the state change.

### Why declarative route meta (not imperative `useShell().apply()`)

- **FOUT prevention without timing tricks.** Route meta is known before the page component ever instantiates. Layout is resolved at navigation time, not render time.
- **Static analysis friendly.** Grepping `definePageMeta` shows which pages want which shell. No scattered `useLayout({...})` at module level.
- **Aligns with existing `decorateRoutes` infrastructure.** `packages/headless/src/modules/routing/useRouting.ts:54` already stamps `route.meta.template` from brand uischema. The new machine honours that as a fallback.

### Shape

```typescript
// shell.machine.ts
const shellMachine = createMachine({
  id: "shell",
  context: {
    layout: { variant: LAYOUT_VARIANTS.DEFAULT },
    header: defaultHeaderContext,
    footer: defaultFooterContext,
    section: defaultSectionContext
  },
  on: {
    APPLY: {
      actions: assign((ctx, e) => merge({}, defaultShellContext, e.data))
    },
    RESET: {
      actions: assign(defaultShellContext)
    }
  }
});

// useShell.ts
export function useShell() {
  const { state, send } = useActor(shellService);
  return {
    layout: computed(() => state.value.context.layout),
    header: computed(() => state.value.context.header),
    footer: computed(() => state.value.context.footer),
    section: computed(() => state.value.context.section),
    apply: (data: Partial<ShellContext>) => send({ type: "APPLY", data }),
    reset: () => send({ type: "RESET" })
  };
}

// Route-level wiring (packages/headless/src/modules/routing/useRouting.ts)
router.afterEach(to => {
  const shellService = getShellService();
  shellService.send({
    type: "APPLY",
    data: to.meta.shell ?? to.meta.template ?? defaultShellContext
  });
});

// Page declares shell (replaces 42 imperative callers)
definePageMeta({
  name: ROUTE.BASKET,
  shell: {
    layout: { variant: LAYOUT_VARIANTS.TWO_COLUMN_LTR },
    header: { background: HEADER_BACKGROUND.LTR, border: "none", items: "end" },
    footer: { layout: FOOTER_LAYOUT.FLAT, background: FOOTER_BACKGROUND.LTR }
  }
});
```

Layout consumers (`Layout.vue`, `Root.vue`, `Main.vue`, `UpmHeader`, `UpmFooter`, `UpmSection`) read from `useShell()` instead of the deprecated composables.

---

## Why Keep Slices Separate (layout / header / footer / section)

These concerns share a root cause (the shell) but will diverge:

- **Header** will grow to hold menus, user actions, branded logo slots
- **Footer** will grow to hold locale/currency selectors (already), legal links, branded links
- **Section** governs page-content chrome (cards, borders)
- **Layout** governs the macro structure (one-column, two-column, RTL, enclosed, etc.)

Collapsing them into one flat `useShell({ ... })` contract would lose the ability to reason about each independently as it grows. Keep them as named context slices on one machine.

---

## Consequences

### Positive

- Cross-page bleed is impossible — outgoing page never observes new shell state
- FOUT on cold load is impossible — route meta resolved before component instantiates
- Single source of truth, inspectable in XState Devtools
- Declarative routing config replaces 42 imperative call sites → easier to audit shell consistency across pages
- SSR-safe (would no longer leak across requests if SSR is adopted later)
- Aligns with the rest of the codebase's state-machine-first architecture

### Negative / costs

- Migration touches 42 files
- `definePageMeta` lives on Nuxt pages; `apps/cart` (Vite SPA) would need to declare shell meta via its vue-router route records (the `decorateRoutes` infra already supports meta mutation on route records)
- Public API change: the `useLayout` / `useHeader` / `useFooter` / `useSection` exports are deprecated, removed after migration
- Third-party brands that use the client-vue templates directly (if any) would need to migrate too — coordinate with a major version bump

### Neutral

- Keeps the existing `LAYOUT_VARIANTS`, `HEADER_*`, `FOOTER_*` enums — only the plumbing changes
- No effect on templates' rendering logic — `Layout.vue` still resolves the variant component; it just reads from a different source

---

## Out of Scope

- `useThemes` refactor — different concern (themes are user/brand-driven, not page-driven)
- Dynamic post-mount variant switching — not a current requirement
- SSR support adoption — the architecture is SSR-safe but we're not enabling SSR now
- Nuxt native named-layouts (`layouts/basket.vue`) — a follow-up ADR could consider adopting Nuxt's built-in mechanism in place of our `LAYOUT_VARIANTS` enum

---

## Implementation Notes (April 2026)

The full XState machine approach described above was **deferred** in favor of a lighter-weight solution that addresses the immediate bleed issue without requiring migration of 42 files.

### What Was Actually Implemented

Instead of the full `shell.machine.ts`, we implemented a **shell component tracking mechanism** (`useShell`) that works with the existing singleton stores:

```typescript
// packages/client-vue/src/components/shell/useShell.ts
const configured = new Set<Shell>();

export const useShell = () => ({
  reset: () => configured.clear(),
  mark: (component: Shell) => configured.add(component),
  has: (component: Shell) => configured.has(component)
});
```

**How it works:**

1. On navigation start (`onBeforeLeave`), `useShell().reset()` clears the tracking set
2. When a page calls `useLayout({ variant })`, it also calls `useShell().mark(SHELL.LAYOUT)`
3. The layout component checks `useShell().has(SHELL.LAYOUT)` before applying the outgoing page's config
4. This prevents the bleed: during the transition window, the layout ignores config mutations from the incoming page until navigation completes

### Why the Lighter Approach

| Factor | XState Machine | Shell Tracking |
|--------|---------------|----------------|
| Migration effort | 42 files | 0 files (additive) |
| Bleed prevention | ✅ | ✅ |
| FOUT prevention | ✅ | Partial (relies on transition timing) |
| Debug visibility | XState Devtools | Console logging |
| Future extensibility | High | Limited |

The tracking approach was chosen because:
- It solves the immediate bleed bug with minimal risk
- It doesn't require migrating existing page components
- It can coexist with the singleton stores
- The full XState solution remains available as a future enhancement

### Files Added

| Package | File | Purpose |
|---------|------|---------|
| `client-vue` | `components/shell/useShell.ts` | Component tracking composable |
| `client-vue` | `components/shell/types.ts` | `SHELL` enum |
| `client-vue` | `components/shell/index.ts` | Exports |

### Integration Points

- `useLayout()` calls `useShell().mark(SHELL.LAYOUT)` when config is provided
- `useRoutingEngine().onBeforeLeave()` triggers `useShell().reset()`
- Layout components check `useShell().has()` before applying pending config

---

## References

- Branch with discovery & failed patches (discarded): `feature/FE-1365`
- Existing `decorateRoutes` infrastructure: `packages/headless/src/modules/routing/useRouting.ts:54`, `packages/headless/src/modules/routing/utils.ts:171`
- Current composables to deprecate:
  - `packages/client-vue/src/components/layout/useLayout.ts`
  - `packages/client-vue/src/components/header/useHeader.ts`
  - `packages/client-vue/src/components/footer/useFooter.ts`
  - `packages/client-vue/src/components/section/useSection.ts`
- Example callers: `packages/client-vue/src/modules/basket/templates/Basket*.template.vue`
- Reference XState composable pattern: `packages/headless/src/modules/auth/useAuth.ts`

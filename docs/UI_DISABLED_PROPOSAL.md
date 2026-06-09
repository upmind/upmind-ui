# Proposal: Ambient UI Disabled Context

## The problem

When `isNavigating` is true (route transition in flight) we want every interactive control in the app — buttons, inputs, selects, checkboxes, radios, switches, etc. — to be **visually and functionally disabled**, matching the behaviour of the existing `disabled` prop.

The constraints that shape the solution:

1. **No per-element wiring.** Manually binding `:disabled="isNavigating"` on every button and input across the app is gap-prone — easy to forget when adding new screens, and we lose the property by attrition.
2. **Interactive controls only.** Content elements (images, carousels, links to product pages) should remain interactive. Users should still be able to swipe a gallery, zoom an image, or read content while the navigation completes.
3. **Match current `disabled` semantics exactly.** Real `:disabled` styling per component, correct ARIA, cursor changes, focus behaviour — not a generic CSS dim.
4. `**packages/ui` stays portable.** It is consumed by many apps. The library must not import application concepts like `routing` or `basket`.

## Recommendation

Add a **generic ambient disabled context** to `packages/ui` via Vue's `provide`/`inject`. The library exposes a neutral key and a small composable. Each consuming app provides whatever signal is meaningful for it (in our case, `isNavigating`). Interactive components opt into the inject and OR it into their existing `disabled` computed.

### Shape

**In `packages/ui`** (portable, app-agnostic):

```ts
// packages/ui/src/utils/injectionKeys.ts
export const UI_DISABLED_CONTEXT_KEY: InjectionKey<MaybeRef<boolean>> =
  Symbol("UPMIND.UI.DISABLED.CONTEXT");
```

```ts
// packages/ui/src/composables/useDisabledContext.ts
export function useDisabledContext() {
  const ctx = inject(UI_DISABLED_CONTEXT_KEY, ref(false));
  return computed(() => unref(ctx));
}
```

Interactive components (`Button`, `Input`, `InputPassword`, `Textarea`, `NumberField`, `Select`, `Combobox`, `Autocomplete`, `Checkbox`, `Radio`, `Switch`, `Toggle`) call `useDisabledContext()` and OR the result into their existing `disabled` computed. Content components (`Image`, `Carousel`, `Card`, `Link`, etc.) **do not** read the key and remain fully interactive.

**In the consuming app** (`packages/client-vue` or app shell):

```ts
// provides the navigation signal under the generic key
provide(UI_DISABLED_CONTEXT_KEY, useRoutingEngine().isNavigating);
```

That's it. One provider, mounted once near the root. Every interactive control in the tree now respects the global signal automatically. Future apps can provide any combination of signals appropriate to them.

### What stays the same

- The existing `:loading="… || isNavigating"` pattern on CTAs that trigger navigation **stays exactly as it is.** That binding exists to show a spinner on the specific button the user clicked — purely an affordance. The new disabled context is orthogonal: it handles every *other* interactive element on the page.
- The Form component's existing `meta.isProcessing` cascade is unchanged; its child controls will additionally pick up the ambient signal via the new inject.

## Industry precedent

This is not a novel pattern — it is the canonical way Vue UI libraries handle ambient form/disabled state. Concretely:

- **Vuetify** — `v-form :disabled` cascades to every descendant input via provide/inject. They expose a `useDisabled()` composable that is structurally identical to what we are proposing.
- **Element Plus** — `el-form` provides a form context; `el-input`, `el-checkbox`, etc. inject from it and respect a cascading `disabled` and `size`.
- **Naive UI** — `n-form` → child controls follow the same pattern.
- **Ant Design Vue** — `a-form` provides a `FormContext`; child fields inject from it.
- **PrimeVue** — uses provide/inject for `useConfirm`, `useToast`, and form contexts.
- **FormKit** — the entire library is built on a provide/inject context tree (`FormKitContext`).

The same mental model exists across the React ecosystem (React Aria, MUI, Mantine, Chakra, Radix) via React Context — different API, identical pattern.

**What is slightly extended here:** we provide at the app shell rather than at a `<Form>` boundary, so the signal is app-scoped instead of form-scoped. The mechanism is unchanged — only the position of the provider moves. This is a natural extension of the canonical pattern, not a new invention.

### Existing precedent in our own codebase

`packages/ui` already has one injection key (`ICON_VARIANT_KEY` in `packages/ui/src/utils/injectionKeys.ts`) used to thread icon variant context, and uses provide/inject in `portalTarget.ts`. This proposal sits next to those existing entries and follows the same shape. We are not introducing a new pattern — we are using an established one a second time.

## Future extensions (out of scope for this change)

Once the pattern is established, the same shape unlocks several other cross-cutting concerns. These are **not** part of this proposal — listed here only to show that the investment generalises and so we are not designing a one-off mechanism:

- **Readonly context** — direct sibling of disabled. Same shape, different semantic: "this is information, not a form." Useful for order review / confirmation screens.
- **Size / density context** — let a parent set `size="sm"` once and cascade. Reduces prop duplication in compact contexts (mobile, modals).
- **Direction (LTR / RTL)** — only if we add RTL locale support.

Each future extension is an additive `InjectionKey` next to `UI_DISABLED_CONTEXT_KEY`, following the same pattern. No retroactive churn.

## Alternatives considered

### A. Per-element wiring — `:disabled="… || isNavigating"` on every interactive component

Rejected: gap-prone. We will forget on at least one screen, then attrition kicks in as new features add new buttons. The whole motivation for this proposal is to eliminate this class of bug.

### B. Global `inert` attribute on the route container

Rejected: `inert` blocks **all** interaction in the subtree including images and carousels, violating constraint 2. It also does not trigger the `:disabled` pseudo-class on form controls, so we lose the per-component visual treatment we get for free with `disabled`. We would need to bolt on a CSS opacity rule that does not match the design system.

### C. Body-level CSS class with selectors

Rejected: same `:disabled` semantics problem as `inert`. `pointer-events: none` is not a substitute for the `disabled` attribute — it bypasses ARIA, does not block keyboard activation, and does not change cursor in a way screen readers understand. It also requires selector maintenance for any new interactive element.

## Implementation scope


| Component                                           | Change                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/ui/src/utils/injectionKeys.ts`            | Add `UI_DISABLED_CONTEXT_KEY`                                          |
| `packages/ui/src/composables/useDisabledContext.ts` | New file, ~10 lines                                                    |
| Each interactive `*.ce.vue` (~12 files)             | Two-line change: call composable, OR into existing `disabled` computed |
| `packages/client-vue` or app shell                  | One-line provider sourcing `isNavigating`                              |
| Other apps                                          | Each provides whatever signal makes sense for them                     |


No changes to content components, no changes to consumer call sites, no changes to existing `Form` cascade, no changes to existing `:loading="… || isNavigating"` CTA bindings.

## Summary

- Use Vue's provide/inject — the canonical mechanism for cross-cutting state in Vue UI libraries.
- Generic key in `packages/ui`, app-specific signal provided by the consuming app. Library stays portable.
- Only interactive components inject; images and carousels stay interactive.
- Real `:disabled` semantics — visual, ARIA, cursor — identical to the existing prop.
- ~12 small component changes, 1 provider, 1 key. Matches Vuetify / Element Plus / Naive UI / Ant Design Vue / PrimeVue / FormKit. Sits next to the existing `ICON_VARIANT_KEY` precedent.
- The same pattern can later be reused for readonly, size, direction, etc., without re-architecting.


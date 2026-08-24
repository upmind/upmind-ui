# Client-Vue Module Structure Rules

These rules apply to ALL modules in `packages/client-vue/src/modules/`. Follow these patterns when creating new modules.

---

## Standard Folder Structure

```text
modules/{module-name}/
├── index.ts                        # Public exports (required)
├── types.ts                        # Type definitions (required)
├── {Module}.vue                    # Main view component(s) (PascalCase)
├── variants.ts                     # cva class variants (if needed)
├── {module}.utils.ts               # Utility functions (if needed)
├── components/                     # Internal components (folder)
│   ├── {ModulePart}.vue           # Component files (PascalCase)
│   └── {subfolder}/               # Sub-feature folders (optional)
│       ├── {Component}.vue
│       ├── variants.ts            # Sub-component cva variants
│       └── types.ts               # Sub-component types
├── templates/                      # Layout templates (folder)
│   ├── {Module}Full.template.vue
│   ├── {Module}Enclosed.template.vue
│   ├── {Module}LTR.template.vue
│   └── {Module}RTL.template.vue
└── layouts/                        # Layout wrappers (optional)
    └── {Module}Widget.layout.vue
```

---

## index.ts Export Pattern

```typescript
// -----------------------------------------------------------------------------
/**
 * @module {module-name}
 * @description Brief description of module purpose.
 */

// --- Export Views
export { default as Upm{ModuleName} } from "./{ModuleName}.vue";
export { default as Upm{ModuleName}Secondary } from "./{SecondaryView}.vue";

// --- Export Components
export { default as Upm{ComponentName} } from "./components/{ComponentName}.vue";

// --- Export Types
export { {MODULE}_TEMPLATE } from "./types";
export type { {Module}Props, {Module}FormProps } from "./types";
// OR use: export * from "./types";
```

**Rules:**

- Views are prefixed with `Upm` (e.g., `UpmBilling`, `UpmCheckout`)
- Use `default as` pattern for Vue component exports
- Section comments: `// --- Export Views`, `// --- Export Components`, `// --- Export Types`
- 80-char separator line at top

---

## types.ts Pattern

```typescript
// -----------------------------------------------------------------------------
/**
 * @module {module-name}/types
 * @description Type definitions for {module} components.
 */

import type { ... } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export enum {MODULE}_TEMPLATE {
  FULL = "full",
  DRAWER = "drawer",
  WIDGET = "widget",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed"
}

export interface {Module}Props {
  template?: {MODULE}_TEMPLATE;
  modelValue?: string;
  touched?: boolean;
  disabled?: boolean;
}

export interface {Module}FormProps {
  touched?: boolean;
  modelValue?: {Model}Model;
  autoUpdate?: boolean;
}
```

**Rules:**

- Template enum uses SCREAMING_SNAKE_CASE
- Props interfaces named `{Module}Props`, `{Module}FormProps`
- Import types from headless package when available

---

## Views vs Components Organization

| Type | Location | Naming | Export Prefix |
|------|----------|--------|---------------|
| **Views** | Module root | `{Module}.vue` | `Upm{Module}` |
| **Components** | `components/` folder | `{Part}.vue` or `{Module}{Part}.vue` | `Upm{Module}{Part}` (if exported) |
| **Templates** | `templates/` folder | `{Module}{Variant}.template.vue` | Not exported |
| **Layouts** | `layouts/` folder | `{Module}{Layout}.layout.vue` | Not exported |

**Views:** Main entry points users import and use directly
**Components:** Internal building blocks, may or may not be exported
**Templates:** Layout variants (Full, Enclosed, LTR, RTL)
**Layouts:** Wrapper components for positioning

---

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Module folder | kebab-case | `billing/`, `basket-product/` |
| View files | PascalCase.vue | `Billing.vue`, `Domain.vue` |
| Component files | PascalCase.vue | `BillingForm.vue`, `DomainCard.vue` |
| Template files | PascalCase.template.vue | `BillingFull.template.vue` |
| Layout files | PascalCase.layout.vue | `DomainWidget.layout.vue` |
| Variants files | variants.ts (always) | `variants.ts` |
| Utils files | kebab-case.utils.ts | `session.utils.ts` |
| Types file | types.ts (always) | `types.ts` |
| Index file | index.ts (always) | `index.ts` |
| Export prefix | Upm{ModuleName} | `UpmBilling`, `UpmDomain` |
| Template enum | {MODULE}_TEMPLATE | `BILLING_TEMPLATE`, `DOMAIN_TEMPLATE` |

---

## Class Variants (`variants.ts`)

> ⚠️ **`*.config.ts` styling is gone.** The `useStyles` / `uiConfig` / `*.config.ts`
> override layer has been removed from client-vue (ADR 024 §D-3). Do not
> reintroduce it. **Style with token-driven Tailwind utilities** directly in the
> template (`bg-surface`, `text-body`, `rounded-slot`) + `cn()` for conditional
> classes — see `.claude/rules/code-ui.companion.md`.
>
> **Class placement (operator ruling, 10 Aug 2026):** a class string lives in a template (on the element, or as a `class`/`:ui` value at a call site) or in a UI-library `variants.ts` — never in a script const, record, or computed. Inline `cn()` conditionals carry at most two named toggles; a one-of-N look is a variant — compute the variant *name* in script and let the library component own the classes.

A class string that can't sit on the element — one reused across siblings, or
carrying real variants — goes in the module's `variants.ts` as a named `cva`
export, imported and called at the point of use.

```typescript
import { cva } from "class-variance-authority";

export const summaryRowVariants = cva("flex items-center justify-between");
export const summaryTotalVariants = cva("text-display font-medium");
```

**Naming:** `{element}Variants`, flat exports — no nested default-export object.

---

## Template Variants

Standard templates each module should support:

| Template | Description |
|----------|-------------|
| `Full` | Single column, full width |
| `Enclosed` | Card/box enclosed layout |
| `LTR` | Two column, content left |
| `RTL` | Two column, content right |
| `Drawer` | Slide-out panel (optional) |
| `Widget` | Compact embedded (optional) |

---

## Component Subfolders

For complex components, create subfolders with their own variants/types:

```text
components/
├── card/
│   ├── ProductCard.vue
│   ├── ProductCardSkeleton.vue
│   ├── variants.ts
│   └── types.ts
├── pricing/
│   ├── Pricing.vue
│   ├── variants.ts
│   └── types.ts
```

---

## Root modules/index.ts

Each module must be re-exported from the root modules index:

```typescript
export * from "./billing";
export * from "./checkout";
export * from "./domain";
// ... etc
```

---

## Checklist for New Modules

- [ ] Folder uses kebab-case naming
- [ ] `index.ts` with section comments and `Upm` prefixed exports
- [ ] `types.ts` with `{MODULE}_TEMPLATE` enum and Props interfaces
- [ ] Main view(s) in module root as PascalCase.vue
- [ ] `components/` folder for internal components
- [ ] `templates/` folder with at least Full, Enclosed, LTR, RTL variants
- [ ] `variants.ts` for cva class variants (if needed)
- [ ] Module added to root `modules/index.ts` exports
- [ ] Types imported from `@upmind-automation/headless` where applicable

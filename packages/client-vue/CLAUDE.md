# Client-Vue Module Structure Rules

These rules apply to ALL modules in `packages/client-vue/src/modules/`. Follow these patterns when creating new modules.

---

## Standard Folder Structure

```text
modules/{module-name}/
├── index.ts                        # Public exports (required)
├── types.ts                        # Type definitions (required)
├── {Module}.vue                    # Main view component(s) (PascalCase)
├── {module}.config.ts              # CVA styles configuration (if needed)
├── {module}.utils.ts               # Utility functions (if needed)
├── components/                     # Internal components (folder)
│   ├── {ModulePart}.vue           # Component files (PascalCase)
│   └── {subfolder}/               # Sub-feature folders (optional)
│       ├── {Component}.vue
│       ├── {component}.config.ts  # Sub-component CVA config
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
| Config files | kebab-case.config.ts | `billing.config.ts` |
| Utils files | kebab-case.utils.ts | `session.utils.ts` |
| Types file | types.ts (always) | `types.ts` |
| Index file | index.ts (always) | `index.ts` |
| Export prefix | Upm{ModuleName} | `UpmBilling`, `UpmDomain` |
| Template enum | {MODULE}_TEMPLATE | `BILLING_TEMPLATE`, `DOMAIN_TEMPLATE` |

---

## Config Files (CVA Styles)

```typescript
import { cva } from "class-variance-authority";

// -----------------------------------------------------------------------------

export default {
  {module}: {
    {section}: {
      root: cva("base-classes"),
      {element}: cva("element-classes")
    }
  }
};
```

**Structure:** `{module}.{section}.{element}` hierarchy

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

For complex components, create subfolders with their own config/types:

```text
components/
├── card/
│   ├── ProductCard.vue
│   ├── ProductCardSkeleton.vue
│   ├── card.config.ts
│   └── types.ts
├── pricing/
│   ├── Pricing.vue
│   ├── pricing.config.ts
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
- [ ] `{module}.config.ts` for CVA styles (if needed)
- [ ] Module added to root `modules/index.ts` exports
- [ ] Types imported from `@upmind-automation/headless` where applicable

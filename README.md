# @upmind-automation/upmind-ui

Vue 3 component library built with Tailwind CSS v4 and CVA for consistent, themeable UI primitives.

## What Is This?

This package provides the **foundational UI components** used across all Upmind applications:

- **Primitives** - Button, Input, Select, Dialog, etc.
- **Form components** - JSONForms renderers for dynamic forms
- **Layout components** - Cards, Sections, Navigation
- **Feedback components** - Alerts, Toasts, Skeletons

All components use **Tailwind CSS v4** for styling and **CVA (Class Variance Authority)** for variant management.

## Installation

```bash
pnpm add @upmind-automation/upmind-ui
```

## Quick Start

```typescript
import { createApp } from "vue";
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";

const app = createApp(App);

// Register UI plugins (includes Sonner for toasts)
uiPlugins.forEach(plugin => app.use(plugin));

app.mount("#app");
```

Import components as needed:

```vue
<template>
  <Button variant="primary" size="md" @click="handleClick">
    Click me
  </Button>
</template>

<script setup>
import { Button } from "@upmind-automation/upmind-ui";
</script>
```

## Component Categories

### Primitives

| Component | Description |
| --------- | ----------- |
| `Button` | Primary action buttons with variants |
| `Input` | Text input with validation states |
| `Select` | Dropdown selection |
| `Checkbox` | Boolean input |
| `Dialog` | Modal dialogs |
| `Popover` | Contextual overlays |
| `Tooltip` | Hover information |

### Form Components

| Component | Description |
| --------- | ----------- |
| `FormField` | Form field wrapper with label/error |
| `NumberField` | Numeric input with stepper |
| `DatePicker` | Date selection |
| `Combobox` | Searchable select |

### Layout

| Component | Description |
| --------- | ----------- |
| `Card` | Content container |
| `Tabs` | Tabbed navigation |
| `DescriptionList` | Key-value display |
| `Skeleton` | Loading placeholder |

### Feedback

| Component | Description |
| --------- | ----------- |
| `Alert` | Inline messages |
| `Badge` | Status indicators |
| `Sonner` | Toast notifications |

### JSONForms Renderers

Custom renderers for dynamic form generation:

```typescript
import { renderers } from "@upmind-automation/upmind-ui";

// Use with JSONForms
<JsonForms :renderers="renderers" ... />
```

## Styling with CVA

Components use CVA for type-safe variants:

```typescript
// Button.styles.ts
import { cva } from "class-variance-authority";

export const buttonStyles = cva("base-classes", {
  variants: {
    variant: {
      primary: "bg-primary text-white",
      secondary: "bg-secondary text-foreground"
    },
    size: {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4",
      lg: "h-12 px-6 text-lg"
    }
  },
  defaultVariants: {
    variant: "primary",
    size: "md"
  }
});
```

## Theming

Components use CSS custom properties for theming:

```css
@import "@upmind-automation/upmind-ui/vars.css";

:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-foreground: #0f172a;
  --color-background: #ffffff;
}
```

## Package Exports

| Export | Description |
| ------ | ----------- |
| `.` | All components and utilities |
| `./style.css` | Base component styles |
| `./vars.css` | CSS custom properties |

## Storybook

Browse all components in Storybook:

```bash
cd playgrounds/storybook
pnpm dev
```

Or visit: https://storybook.upmind.dev/

## Related Packages

| Package | Relationship |
| ------- | ------------ |
| `@upmind-automation/client-vue` | Consumes UI components |
| `@upmind-automation/icons` | Icon assets |

## Development

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

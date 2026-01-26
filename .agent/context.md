# UI Package Context

## Purpose

`@upmind-automation/upmind-ui` is a Vue 3 component library built with Tailwind CSS v4 and CVA (Class Variance Authority).

## Architecture

```
src/
├── ui/                # Component library
│   ├── button/
│   ├── card/
│   ├── dialog/
│   ├── form/
│   └── ...
├── utils/             # Shared utilities
├── assets/            # Styles, fonts
└── plugins/           # Vue plugins
```

## Component Pattern

Each component follows:

```
ui/{component}/
├── {Component}.vue         # Main component
├── {Component}.styles.ts   # CVA variants
└── index.ts                # Exports
```

## CVA Styling

```typescript
// Button.styles.ts
import { cva, type VariantProps } from 'class-variance-authority'

export const buttonStyles = cva('base-classes', {
  variants: {
    variant: { primary: '...', secondary: '...' },
    size: { sm: '...', md: '...', lg: '...' }
  },
  defaultVariants: { variant: 'primary', size: 'md' }
})

export type ButtonStyleProps = VariantProps<typeof buttonStyles>
```

## Key Dependencies

- `radix-vue` - Headless UI primitives
- `tailwind-merge` - Class merging
- `lucide-vue-next` - Icons
- `embla-carousel-vue` - Carousels
- `@floating-ui/vue` - Positioning

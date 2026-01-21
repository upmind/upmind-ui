# ADR 012: Multi-Theme Architecture

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

The Upmind platform supports:

1. Multiple branded storefronts for different use cases
2. Client-specific themed applications
3. Shared business logic across all themes
4. Independent deployment per theme

---

## Decision

Support **multiple themed applications** in the monorepo, all consuming shared packages but with theme-specific assets and configuration.

---

## Application Types

### Core Applications

Maintained by Upmind, continuously developed:

| App | Purpose | Framework |
| --- | ------- | --------- |
| `cart` | Shopping cart / storefront | Vite + Vue |
| `cart-nuxt` | Shopping cart with SSR | Nuxt 3 |

### Client Applications

Developed for specific clients, may be handed over:

| App | Purpose |
| --- | ------- |
| `hosting` | Hosting provider portal |
| `velia` | Velia-branded portal |
| `webcentral` | Webcentral-branded portal |

> [!NOTE]
> Client apps are git submodules for clean handover. See [ADR 004: Monorepo Structure](./004-monorepo-structure.md).

---

## Theme Architecture

```
apps/
├── cart/
│   ├── src/
│   │   ├── assets/         # Theme-specific assets
│   │   │   ├── styles/     # Theme CSS/tokens
│   │   │   └── images/     # Theme images
│   │   ├── components/     # Theme overrides
│   │   └── config/         # Theme configuration
│   └── vite.config.ts
│
└── hosting/
    ├── src/
    │   ├── assets/         # Different theme assets
    │   ├── components/     # Theme-specific components
    │   └── config/         # Different configuration
    └── vite.config.ts
```

---

## Shared vs Theme-Specific

| Concern | Shared | Theme-Specific |
| ------- | ------ | -------------- |
| Business logic | ✅ @upmind-automation/headless | — |
| Base UI components | ✅ @upmind-automation/ui | — |
| Icons | ✅ @upmind-automation/icons | — |
| Types | ✅ @upmind-automation/types | — |
| Translations | ✅ @upmind-automation/i18n | — |
| Design tokens | — | ✅ Per-app CSS variables |
| Color palette | — | ✅ Per-app configuration |
| Logo/branding | — | ✅ Per-app assets |
| Layout overrides | — | ✅ Per-app components |

---

## Theming Approach

### CSS Custom Properties

```css
/* apps/cart/src/assets/styles/tokens.css */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #10b981;
  --font-family: 'Inter', sans-serif;
  --border-radius: 0.5rem;
}
```

```css
/* apps/hosting/src/assets/styles/tokens.css */
:root {
  --color-primary: #8b5cf6;
  --color-secondary: #f59e0b;
  --font-family: 'Roboto', sans-serif;
  --border-radius: 0.25rem;
}
```

### Component Overrides

Theme-specific components can wrap or replace shared ones:

```vue
<!-- apps/hosting/src/components/ThemedButton.vue -->
<template>
  <UiButton v-bind="$attrs" class="themed-button">
    <slot />
  </UiButton>
</template>
```

---

## Build and Deploy

Each app builds independently:

```bash
# Build specific app
pnpm --filter cart build
pnpm --filter hosting build

# Deploy to respective hosts
# Firebase, Cloudflare, etc.
```

### Environment Configuration

```typescript
// apps/cart/src/config/index.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  brandId: import.meta.env.VITE_BRAND_ID,
  features: {
    socialLogin: true,
    guestCheckout: true,
  },
}
```

---

## Consequences

### Positive

1. **Flexibility** — each theme fully customizable
2. **Shared core** — business logic maintained once
3. **Independent deploy** — themes deploy separately
4. **Client isolation** — client apps cleanly separated
5. **Scalable** — easy to add new themes

### Negative

1. **Build time** — each app builds separately
2. **Drift risk** — themes can diverge from core patterns
3. **Testing overhead** — must test each theme

### Neutral

1. **Configuration duplication** — some config repeated per app

---

## Related Documents

- [ADR 004: Monorepo Structure](./004-monorepo-structure.md)
- [ADR 007: Headless Architecture](./007-headless-architecture.md)
- [ADR 003: Shared Icons Package](./003-shared-icons-package.md)

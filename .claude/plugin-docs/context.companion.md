> Companion to [context.md](../../../monorepo-agent/context.md) — Upmind-monorepo-specific bindings/examples.

# Repository context — Upmind bindings

## The real package map

Where the base doc uses generic layering placeholders (`<core-package>`, `<framework-package>`, `<ui-package>`, `<app>`), this monorepo's concrete tree is:

```
monorepo/
├── packages/           # Shared libraries
│   ├── headless/       # <core-package> — XState state machines & business logic (framework-agnostic)
│   ├── client-vue/     # <framework-package> — Vue composables wrapping headless
│   ├── ui/             # <ui-package> — Vue component library (Tailwind + CVA)
│   ├── types/          # <types-package> — TypeScript types (git submodule)
│   ├── i18n/           # <i18n-package> — Internationalization
│   └── icons/          # <icons-package> — Icon assets
├── apps/               # Deployable applications
│   ├── cart/           # <app> — Main shopping cart (Vue + Vite)
│   ├── cart-nuxt/       # <app-variant> — Nuxt.js cart variant
│   ├── hosting/         # <app-variant> — Client-specific cart
│   ├── velia/           # <app-variant> — Client-specific cart
│   └── webcentral/      # <app-variant> — Client-specific cart
└── playgrounds/         # Development/demo environments
    └── labs/            # <playground> — UI exploration playground
```

Dependency flow: `types → headless → client-vue → ui → apps`, with `i18n` feeding in alongside `headless`.

## NPM package names

| Base placeholder | Real package | NPM name |
|---|---|---|
| `<core-package>` | headless | `@upmind-automation/headless` |
| `<framework-package>` | client-vue | `@upmind-automation/client-vue` |
| `<ui-package>` | ui | `@upmind-automation/upmind-ui` |
| `<types-package>` | types | `@upmind-automation/types` |
| `<i18n-package>` | i18n | `@upmind-automation/i18n` |
| `<app>` | cart | `@upmind-automation/cart` |

## Headless modules (concrete)

The base doc's generic "modules organized by business domain" are, concretely: `basket`, `basketProduct`, `brand`, `client`, `domain` (DAC — Domain Access Controller), `payment` / `paymentDetails`, `product` / `productCatalogue`, `session`, `system`.

## Issue tracker & install source

The base README's generic "issue tracker" binds to **Linear** in this monorepo — see `agent-labels.companion.md` for the label/status taxonomy this plugin drives. The plugin is installed from `git@git.upmind.io:upmind/groups/frontend-team/monorepo-agent.git` as the `upmind-agent` marketplace plugin.

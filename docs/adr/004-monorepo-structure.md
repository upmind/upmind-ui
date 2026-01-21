# ADR 004: Monorepo Structure with pnpm Workspaces

**Date:** January 2024 (Retroactive)
**Status:** Accepted
**Authors:** Upmind Engineering Team

---

## Context

As the Upmind platform grew, we needed a solution to:

1. Share code across multiple applications (cart, hosting portal, client areas)
2. Maintain type safety across packages
3. Enable independent versioning while keeping dependencies synchronized
4. Simplify developer onboarding with a single repository

---

## Decision

Adopt a **pnpm monorepo** structure with workspaces.

### Repository Structure

```
upmind-monorepo/
├── packages/           # Shared libraries
│   ├── headless/       # Business logic, state machines, services
│   ├── ui/             # Vue UI components
│   ├── client-vue/     # Vue integrations (headless + ui)
│   ├── types/          # Shared TypeScript types
│   ├── i18n/           # Internationalization
│   └── icons/          # Shared icon assets
│
├── apps/               # Deployable applications
│   ├── cart/           # Shopping cart (Vite)
│   ├── cart-nuxt/      # Shopping cart (Nuxt)
│   ├── hosting/        # Hosting portal
│   ├── velia/          # Velia theme
│   └── webcentral/     # Webcentral theme
│
├── playgrounds/        # Development environments
│   └── labs/           # Component playground
│
└── tests/              # E2E and visual regression tests
```

### Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'playgrounds/*'
```

### Internal Dependencies

Packages reference each other using `workspace:*`:

```json
{
  "dependencies": {
    "@upmind-automation/headless": "workspace:*",
    "@upmind-automation/types": "workspace:*",
    "@upmind-automation/i18n": "workspace:*"
  }
}
```

### Package Naming Convention

All packages use the `@upmind-automation/` scope:

- `@upmind-automation/headless`
- `@upmind-automation/ui`
- `@upmind-automation/types`
- `@upmind-automation/i18n`
- `@upmind-automation/icons`

---

## Consequences

### Positive

1. **Single source of truth** — all code in one repository
2. **Atomic commits** — changes across packages are atomic
3. **Simplified CI/CD** — single pipeline for all packages
4. **Shared tooling** — ESLint, Prettier, TypeScript configs shared
5. **Type safety** — TypeScript references work across packages
6. **Efficient dependencies** — pnpm's hard linking saves disk space

### Negative

1. **Repository size** — larger clone times for new developers
2. **Lock file complexity** — `pnpm-lock.yaml` is 800KB+
3. **Build orchestration** — must build packages in dependency order

### Neutral

1. **Learning curve** — developers must understand pnpm workspaces
2. **IDE setup** — requires proper tsconfig references

---

## Shared Tooling

### TypeScript

Shared base configurations in `tsconfig/`:

- `tsconfig.base.json` — common settings
- `tsconfig.node.json` — Node.js targets
- `tsconfig.app.json` — Vite app targets

### Linting

Root-level configuration:

- `.eslintrc.cjs` — shared ESLint rules
- `.prettierrc` — shared Prettier config
- `.lintstagedrc` — pre-commit hooks

### Git Hooks

Husky for pre-commit quality:

- Lint-staged for changed files
- Type checking on commit

---

## Node.js Requirements

```json
{
  "engines": {
    "node": "^20.19.0 || >=22.12.0"
  },
  "packageManager": "pnpm@10.28.0"
}
```

---

## Git Submodules Strategy

Certain packages and apps are maintained as **git submodules** rather than direct folders. This enables independent consumption and clean handover scenarios.

### Independently Consumable Packages

The following packages are submodules so they can be consumed by external projects without requiring the full monorepo:

| Package | Reason |
| ------- | ------ |
| `packages/ui` | UI components usable independently of headless logic |
| `packages/types` | Type definitions consumable by any TypeScript project |

**Why submodules over npm?**

- Avoids npm publishing complexity and versioning overhead
- Better developer experience during active development
- External projects can reference the submodule directly
- No need for consumers to understand the monorepo structure

### Client Handover Apps

Some apps are submodules because they were developed for specific clients and may need to be cleanly handed over to client-owned repositories:

**Benefits:**

- Clean separation of client-specific code
- Easy handover — just transfer the submodule repository
- Client can continue development independently
- Upmind retains ability to contribute upstream if needed

> [!NOTE]
> Any app that may need future handover to a client should be set up as a submodule from the start.

---

## Related Documents

- [ADR 007: Headless Architecture](./007-headless-architecture.md)
- [ADR 003: Shared Icons Package](./003-shared-icons-package.md)

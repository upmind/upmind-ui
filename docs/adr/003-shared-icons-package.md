# ADR 003: Shared Icons Package

**Date:** January 20, 2026
**Status:** Accepted
**Authors:** Dom da Costa, AI Assistant

---

## Context

All Upmind products duplicated a large set of SVG icons in their own `assets/icons` folders. This caused:

- Increased repository size
- Inconsistent icon updates across apps
- Maintenance overhead when adding or fixing icons

The goal is to have a single source of truth for icons that can be consumed by any package or app.

---

## Decision

Create a dedicated package `@upmind-automation/icons` that contains the canonical icon set (copied from `apps/cart/src/assets/icons`). The package will expose the icons as static assets under `dist/assets`.

**Key architectural principles:**

1. `packages/ui` **must not** contain any icons – it only provides the `Icon.vue` component that renders icons.
2. All consuming apps and packages resolve the alias `@icons` to the shared package (`../../packages/icons/assets`).
3. The icons are bundled as static assets via `vite-plugin-static-copy` and can be tree‑shaken by importing only the needed SVGs.

---

## Consequences

### Positive

- Single source of truth, easier updates.
- Reduced repo size and duplication.
- Consistent API: developers import icons via `@icons` alias.
- `packages/ui` stays lightweight and reusable.

### Negative

- Requires a one‑time migration of existing icon folders.
- Build pipelines need to include the new package.

### Neutral

- Bundle size impact is negligible because icons are static assets.

---

## Alternatives Considered

1. **Keep duplicated icons** – rejected due to maintenance burden.
2. **Symlink icon folders** – rejected because symlinks are fragile across OSes and CI.
3. **Publish icons as a separate NPM package** – unnecessary complexity; a monorepo package suffices.

---

## Implementation Plan

1. Create `packages/icons` with `package.json`, `vite.config.ts`, and `src/assets` containing the icons.
2. Copy the canonical icon set from `apps/cart/src/assets/icons`.
3. Update `@icons` alias in all apps (`cart`, `cart-nuxt`, `hosting`, `velia`, `webcentral`), client‑vue, and playgrounds to point to the new package.
4. Remove `@icons` alias from `packages/ui`.
5. Delete the now‑redundant icon folders from each app/package.
6. Verify by rebuilding the icons package and running the cart dev server.

---

## Related Documents

- [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md)
- [ARCHITECTURE_PROPOSAL.md](../ARCHITECTURE_PROPOSAL.md)

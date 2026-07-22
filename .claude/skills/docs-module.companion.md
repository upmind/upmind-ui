> Companion to the upmind-agent skill /docs-module — Upmind-monorepo-specific bindings/overrides.

Shared documentation bindings — the foundation-doc path, canonical types/enums packages, dependency-graph location, fixtures location, the client-only `.meta` / `object_meta` envelope, and the hot-keys / dependants-table filters — are homed in the rule companion `docs-modules.companion.md` (auto-injected at session start). This file binds only what is specific to the `/docs-module` procedure.

## Modules root & output

- `<modules-root>` = `packages/headless/src/modules`.
- Foundation doc output: `packages/headless/src/modules/<name>/docs/foundation.md` (the module `README.md` is internal-facing and stays untouched).

## Module source files (base Required-read 4 → concrete filenames)

Read every one that exists under `packages/headless/src/modules/<name>/`:

- Public entry / barrel: `index.ts`
- Type declarations: `types.ts` (or `<name>.types.ts`)
- Service / data-access layer: `services.ts` (or `<name>.services.ts`), plus the **per-actor variants** `.client` / `.staff` when present.
- Primary composable + sub-units: `use<Name>.ts`, plus `.actions`, `.context`, `.meta`, `.internals` when present.
- Mappers: `mappers.ts` (if present).
- State machine: `<name>.machine.ts` (if present).

## Workshop input docs (base Required-reads 2 & 3)

- Locked documentation decisions: `docs/workshop/contabo.md`.
- Section-template / doc-shape definition: `docs/workshop/contabo-doc-shape-proposal.md` (also linked from the rule).

## Config-key filter (base Producer-step 2)

The concrete keys to omit (cart-UI-only, admin-only, vendor-app-only) are enumerated under "Hot-keys to omit" in the rule companion `docs-modules.companion.md`.

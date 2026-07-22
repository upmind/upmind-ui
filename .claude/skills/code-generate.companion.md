> Companion to the upmind-agent skill /code-generate — Upmind-monorepo-specific bindings/overrides.

## Exemplar files (Study Existing Patterns First)

Concrete anchors to copy from in this repo:

- **Composables:** `useSessionStore.ts` and its `useSessionStoreActions.ts` (and the other `useSessionStore*` sub-composables) are the canonical factory-pattern exemplar.
- **Services / types / schemas:** use the nearest existing `.services.ts` / `.types.ts` / `.schemas.*.ts` file in the same module.

## Import surface (Service Structure)

The generic service-file import block binds to:

- Types: `@upmind-automation/types`.
- Shared utility composables via the module barrel `../index` — e.g. `useQuery`, `useBrand`.
- General utilities: `lodash-es`.

## State-read utilities (Pre-Flight Check)

The "existing shared utilities" the pre-flight requires are the Upmind state-read helpers: `stateMatches`, `useContext`, `contextValue` (referenced under `code-xstate.md`). Reach for these rather than re-deriving machine state by hand.

---
id: mod-state-once
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Upmind binding

The module's setup function is the scope factory in `use<Module>.ts`. It never resolves a value and passes it down to the layers.

Read the client id through `resolveClientId(scopeContext)` from `../session-store` (`session-store/session-store.utils.ts`). Call it where the request needs the id. It is the one resolver. A module-local copy of it is a second home.

The scope-context id wins when a `.for()` context is present. The session's active user supplies the self case. A request URL built from `activeUser` with no scope-context check drops `.for('client', id)` retargeting.

Read a brand setting from the brand module: `useBrand().ensureConfig` in a guard, `getConfigValue` in `enabled` and meta.

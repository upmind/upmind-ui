---
id: comp-query-precondition
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.services.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Upmind binding

The `useQuery()` wrapper adds a guard beside `enabled`. Check the precondition in the guard and in `enabled`. The meta layer reads the same owner when it shows the precondition.

A brand setting is owned by the brand module. The guard awaits `useBrand().ensureConfig(...)`. The `enabled` option and meta read `useBrand().getConfigValue(key)`.

Auth is owned by the session store (`modules/session-store`).

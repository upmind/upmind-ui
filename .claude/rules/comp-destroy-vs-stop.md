---
id: comp-destroy-vs-stop
when: a composable that is not a singleton
paths:
  - 'packages/headless/src/modules/**/use*.ts'
---
# A non-singleton composable is destroyed, not stopped

A non-singleton composable exposes `destroy()` in its actions layer. `destroy()` calls `stopService(service)` and then `remove(scopeKey)` from `scope/scope.registry.ts`.

Do not use `stop()` alone. The registry keeps the stopped instance, and the next call returns it, unusable. A singleton has no `destroy()`. A component that creates a non-singleton calls `destroy()` when it unmounts.

Exemplar: `destroy` in `packages/headless/src/modules/auth/useAuth.actions.ts`.

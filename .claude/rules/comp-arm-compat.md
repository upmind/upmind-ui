---
id: comp-arm-compat
when: per-actor arms of a composable layer
paths:
  - 'packages/headless/src/modules/**/use*.ts'
  - 'packages/headless/src/modules/**/*.services.*.ts'
---
# Shared members stay key-compatible across actor arms

Give a shared member the same key in every actor arm, such as `use<Module>.actions.client.ts` and `use<Module>.actions.staff.ts`. When an actor lacks a capability, its arm still has the member. The member throws or returns `false`, and a `canX` flag shows the capability.

Put a member that only one scope has on that scope's own arm type, and reach it by narrowing. Never add it to the shared type as optional. Different keys across arms make every divergent member unreliable on the merged type.

Exemplar: the arms `useAuth.actions.client.ts` and `useAuth.actions.staff.ts` in `packages/headless/src/modules/auth/`.

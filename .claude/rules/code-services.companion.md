---
paths:
  - '**/modules/**/*.services.ts'
  - '**/modules/**/*.services.*.ts'
---
> Companion to `code-services.md` — Upmind-monorepo bindings.

## Actor set

The base's generic `ActorTypes` resolves to two repo enums, by site:

- Factory / scoping (`scopedServices`, machine-services wiring) → `ScopeActorTypes.CLIENT` / `ScopeActorTypes.STAFF`. Guest flows through the same machinery.
- Permission guards and actor-check branches → `AccessRoleTypes.CLIENT` / `AccessRoleTypes.STAFF`.

User → `.CLIENT`. Admin / privileged → `.STAFF`.

## Grant types

Client → `GrantTypes.PASSWORD`. Staff → `GrantTypes.ADMIN`.

## Reference implementation

`packages/headless/src/modules/auth/`: the `auth.services.ts` factory plus `auth.services.client.ts` / `auth.services.staff.ts`. Worked examples and the decision flowchart: `docs/reference/service-splitting-examples.md`. The `.as(actor)` composable side is bound in `code-composables.companion.md`.

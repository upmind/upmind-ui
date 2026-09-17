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

## File-responsibility rules (FE-3249)

Four `error` rules in the root `eslint.config.mjs` pin each concern to its named file over `packages/headless/src/modules/**`:

- `file-responsibility/query-only-in-services` — `useQuery` / `useMutation` are called only in a `*.services.ts`. The `query` module that defines them is exempt.
- `file-responsibility/services-purity` — every exported function in a `*.services.ts` is one of four shapes: a **request** (calls `useQuery`/`useMutation`), a **machine service** (`async fn(context, event)`), a **factory** (returns an object of services, as `createClientAuthServices`), or a **delegate** (calls a services/sibling-module function, imported or in-file). Anything else is a misplaced util → move it to `*.utils.ts`.
- `file-responsibility/schemas-in-schema-file` — a `*Schema` / `*Uischema` export (JSONForms) lives only in a `*.schemas.ts`.
- `file-responsibility/mappers-in-mapper-file` — a `map*` / `parse*` export lives only in a `*.mappers.ts`, except a machine-service `parse(context, event)` in a services file.

Every exception is structural, so no rule needs an `eslint-disable`.

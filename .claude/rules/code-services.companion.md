---
paths:
  - '**/modules/**/*.services.ts'
  - '**/modules/**/*.services.*.ts'
---
> Companion to [code-services.md](./code-services.md) — Upmind-monorepo-specific bindings/examples.

## Actor set

The base rule's generic "user / admin" split is, in this monorepo, the **`ScopeActorTypes`** actor set: `ScopeActorTypes.CLIENT` and `ScopeActorTypes.STAFF` (the guest/anonymous actor also flows through the same scoped-service machinery).

The base writes a single generic `ActorTypes` at every site, but it resolves to **two different repo enums** depending on where it appears — disambiguate by site so the two mappings never collapse into one:

- **Factory / scoping** — the `scopedServices` factory and the machine-services wiring → **`ScopeActorTypes`**. So the base's `ActorTypes.USER` / `ActorTypes.ADMIN` inside `scopedServices` read as `ScopeActorTypes.CLIENT` / `ScopeActorTypes.STAFF`.
- **Permission guards / actor-check branches** — e.g. the `deleteInvoice` guard (criterion 5) and the `updateItem` branch (Pattern 2) → **`AccessRoleTypes`**. So the base's `ActorTypes.ADMIN` in those guards reads as `AccessRoleTypes.STAFF`.

Actor mapping (both enums expose the same CLIENT/STAFF members):

- User → `.CLIENT`
- Admin/privileged → `.STAFF`

## Grant types

The OAuth grants in the split examples bind to this repo's `GrantTypes`:

- Client → `GrantTypes.PASSWORD`
- Staff → `GrantTypes.ADMIN`

Grant-type divergence cascades to token handling, 2FA, and session management — see `packages/headless/.../auth` for the live cascade.

## Reference implementation

`packages/headless/src/modules/auth/` demonstrates the full split pattern (`auth.services.ts` factory + `auth.services.client.ts` / `auth.services.staff.ts`). The worked examples, the decision flowchart, and the feature-by-feature summary table live in [`docs/reference/service-splitting-examples.md`](../../docs/reference/service-splitting-examples.md).

## Staff example (verbatim)

The canonical "different business logic → always split" example in this repo is client-vs-staff registration:

```typescript
// Client: Registration is allowed
async function register(context: AuthContext<RegisterModel>) {
  // Full registration flow with custom fields, tracking, recaptcha
  return post({ url: "clients/register", data: mapRegisterData(model) });
}

// Staff: Registration is forbidden
async function register(context: AuthContext): Promise<never> {
  throw new DetailedError(
    "Staff registration not available",
    responseCodes.Forbidden
  );
}
```

The scoped-composable / four-layer `.as(actor)` variant these services back is bound in `code-composables.companion.md` (actor set, ADR-001).

> Companion to [code-services.md](./code-services.md) — Upmind-monorepo-specific bindings/examples.

## Actor set

The base rule's generic "user / admin" split is, in this monorepo, the **`ScopeActorTypes`** actor set: `ScopeActorTypes.CLIENT` and `ScopeActorTypes.STAFF` (the guest/anonymous actor also flows through the same scoped-service machinery). Wherever the base says `ActorTypes`, read `ScopeActorTypes`; wherever it says `AccessRoleTypes` in a permission guard, use the repo's `AccessRoleTypes` enum.

- User → `ScopeActorTypes.CLIENT`
- Admin/privileged → `ScopeActorTypes.STAFF`

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

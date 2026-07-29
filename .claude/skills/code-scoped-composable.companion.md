> Companion to the upmind-agent skill /code-scoped-composable — Upmind-monorepo-specific bindings/overrides.

**Read the canonical first:** `useAuth` at `packages/headless/src/modules/auth/` — end-to-end, before scaffolding anything. **The rules and the docs are the authority; `useAuth` is one worked example of them, not a match target.** Where the base workflow's templates and the canonical disagree, that is a surfaced finding — say so out loud, never silently resolve toward the example.

## Actor model

- Actor enum (`ActorType` in the base): **`AccessRoleTypes`**, whose members are the actor set **`GUEST`, `CLIENT`, `STAFF`**.
- Per-actor arm bindings in the canonical: services `auth.services.client.ts` / `auth.services.guest.ts` / `auth.services.staff.ts`; actions `useAuth.actions.client.ts` / `useAuth.actions.staff.ts` (the tree's only actions split); context and meta are single factories today (`createAuthContext` in `useAuth.context.ts`, `createAuthMeta` in `useAuth.meta.ts`) — no per-actor meta/context file exists in the tree yet.
- Actor-scope enum (`ActorScope` in the base): **`ScopeActorTypes`**; `ScopeActorTypes.SELF` resolves to `activeActor.value`.
- Base Step 5 service matrix binds concretely to:

  ```typescript
  const servicesMatrix = {
    DEFAULT: clientServices,
    [AccessRoleTypes.GUEST]: guestServices,
    [AccessRoleTypes.CLIENT]: clientServices,
    [AccessRoleTypes.STAFF]: staffServices
  } as const satisfies Record<"DEFAULT" | AccessRoleTypes, ModuleServices>;
  ```

  `DEFAULT` maps to `clientServices`.
- Base Step 7 actions type export binds to the canonical's merged shape: `UseAuthActions = ReturnType<typeof createAuthActions>` (`useAuth.actions.ts`), actor arm spread into the shared return. The live union-health receipt (`registerAsGuest`) is bound in `code-composables.companion.md`.

## Paths

- `{modules-root}` (base Step 2 directory tree) = **`packages/headless/src/modules`** — i.e. modules live at `packages/headless/src/modules/{module-name}/`.
- Canonical example module (base "Example Reference"): **`packages/headless/src/modules/auth/`** — use it as the reference for all patterns.

## Parity gate bindings (base Step 1.5)

- The actor-model decision record that fixes the actor × context cell grid is **ADR-001**.
- "Actor-retargeting" is expressed in this repo as **`.for(actor, id)`** (e.g. `.for('client', id)`); a "cross-actor capability delta" is a **staff-vs-client** capability delta.
- The `legacy:` disposition citation must point into the legacy codebase at **`repos/vue-app`**.
- Drop dispositions that require a `reason:` + operator `signoff:` include the issue-tracker-referenced drop rows (issue tracker = Linear).

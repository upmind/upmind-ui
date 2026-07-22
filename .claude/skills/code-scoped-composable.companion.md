> Companion to the upmind-agent skill /code-scoped-composable — Upmind-monorepo-specific bindings/overrides.

## Actor model

- Actor enum (`ActorType` in the base): **`AccessRoleTypes`**, whose members are the actor set **`GUEST`, `CLIENT`, `STAFF`**. Create per-actor variants (`.services.{actor}.ts`, `.actions.{actor}.ts`, `.context.{actor}.ts`, `.meta.{actor}.ts`) for exactly these.
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
- Base Step 7 actions union example binds to: `UseModuleActions = ClientActions | StaffActions`.

## Paths

- `{modules-root}` (base Step 2 directory tree) = **`packages/headless/src/modules`** — i.e. modules live at `packages/headless/src/modules/{module-name}/`.
- Canonical example module (base "Example Reference"): **`packages/headless/src/modules/auth/`** — use it as the reference for all patterns.

## Parity gate bindings (base Step 1.5)

- The actor-model decision record that fixes the actor × context cell grid is **ADR-001**.
- "Actor-retargeting" is expressed in this repo as **`.for(actor, id)`** (e.g. `.for('client', id)`); a "cross-actor capability delta" is a **staff-vs-client** capability delta.
- The `legacy:` disposition citation must point into the legacy codebase at **`repos/vue-app`**.
- Drop dispositions that require a `reason:` + operator `signoff:` include the issue-tracker-referenced drop rows (issue tracker = Linear).

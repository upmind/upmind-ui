> Companion to [code-composables.md](./code-composables.md) — Upmind-monorepo-specific bindings/examples.

## Decision record & reference implementation

- The architectural rationale for the scoped pattern is [ADR-001: Scope-Based Composables](../../docs/adr/001-scope-based-composables.md) — cite it, never restate it.
- **Reference implementation (scoped):** `useAuth` at `packages/headless/src/modules/auth/` is the canonical example. **Read it first** — before writing or reviewing any scoped composable — and where any doc's template and the canonical disagree, the canonical wins.

## Exemplars (Pre-Generation Requirement)

- **Flat utility composables:** `useDomain`, `useBasket`, `useBrand`.
- **Scoped (actor-aware) composables:** `packages/headless/src/modules/auth/`.
- The legacy single-`meta`-object form still exists in older modules (e.g. `useBrand`) — leave it where it works, do not add it to new code.

## Actor set & identifiers

- **Actor set:** guest / client / staff. Scoped composables are for modules where guest / client / staff have different capabilities — Auth (client vs staff login), Basket (guest vs authenticated actions), Client Management (staff acting on behalf of clients).
- **Actor enum:** `ScopeActorTypes` (with `ScopeActorTypes.SELF` resolving to the active actor, and concrete `ScopeActorTypes.STAFF` / `ScopeActorTypes.CLIENT`).
- **Scoped factory:** `createScopedComposable<ReturnType, Matrix>(...)`.
- **Scope-key generator:** `generateScopeKey("module-name", { ...config, actor: actorScope })`.
- **Scope matrix example:** `AUTH_SCOPE_MATRIX`.
- **Per-actor arm bindings:** services `auth.services.client.ts` / `auth.services.guest.ts` / `auth.services.staff.ts` (resolved by `scopedServices` in `auth.services.ts`); actions `useAuth.actions.client.ts` / `useAuth.actions.staff.ts` (merged by spread in `useAuth.actions.ts` — the tree's only actions split); meta/context are single factories today (`createAuthMeta` / `createAuthContext`) — no `.meta.{actor}.ts` / `.context.{actor}.ts` exists in the tree yet. Type exports: `UseAuthActions` / `UseAuthContext` / `UseAuthMeta` = `ReturnType` of the factories.
- **Union-health receipt:** `registerAsGuest` is implemented only in `auth.services.client.ts` — the services-arm divergence behind the optional `AuthServices.registerAsGuest` in `auth.types.ts` and the `registerAsGuest!` assertion in `auth.services.ts`; the client actions arm (`useAuth.actions.client.ts`, sends `GUEST`) makes `UseAuthActions` key-incompatible across arms.

## TanStack Query worked examples

The data-fetching lifecycle variant is exemplified by the **auth / product-catalogue** modules.

## Machine-node sweep receipt

Nesting `registering` under `available` made `useSession.completeRegistration`'s `waitFor(["available","done"])` resolve immediately, so the submit was never awaited and the form navigated on — the silent-resolve failure the base rule's sweep exists to catch.

## Singleton examples

Long-lived singletons in this monorepo: **brand, basket, session-store**. Non-singletons that need `destroy()`: flow/wizard composables (auth, checkout).

## Related bindings

- The `@internal` + barrel Module Visibility Law is bound in `code-quality.companion.md`.
- State-read utilities (`stateMatches` / `useContext` / `contextValue`) are the Upmind state utilities referenced under `code-xstate.md`.

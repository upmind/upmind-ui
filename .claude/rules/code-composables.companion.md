---
description: Upmind-monorepo bindings for the composable contract — actor set, ADR-001 reference implementation, and the variance law governing scoped-composable structure
paths:
  - '**/modules/**/use*.ts'
  - '**/modules/**/use*.actions.ts'
  - '**/modules/**/use*.context.ts'
  - '**/modules/**/use*.meta.ts'
  - '**/composables/**/*.ts'
  - 'packages/headless/src/modules/**'
---

> Companion to `code-composables.md` — Upmind-monorepo bindings.

## Decision record & reference implementation

- Rationale: ADR-001 (Scope-Based Composables). Cite it, never restate it.
- Reference (scoped): `packages/headless/src/modules/auth/`. Read it first. The rules are the authority; `useAuth` is one worked example, not a match target — where they disagree, say so out loud.

## Exemplars

- Flat utility composables: `useDomain`, `useBasket`, `useBrand`.
- Scoped (actor-aware): `packages/headless/src/modules/auth/`.
- The legacy single-`meta`-object form survives in older modules (`useBrand`). Leave it; never add it to new code.

## Actor set & identifiers

- Actors: guest / client / staff. Scoped composables are for modules where the actors have different capabilities.
- Actor enum: `ScopeActorTypes` (`SELF` resolves to the active actor; concrete `STAFF` / `CLIENT`).
- Factory: `createScopedComposable<ReturnType, Matrix>(...)`. Scope key: `generateScopeKey("module-name", { ...config, actor: actorScope })`. Matrix example: `AUTH_SCOPE_MATRIX`.
- Per-actor arms: services `auth.services.{client,guest,staff}.ts` resolved by `scopedServices`; actions `useAuth.actions.{client,staff}.ts` merged by spread in `useAuth.actions.ts`. Meta and context are single factories today.

## TanStack Query worked examples

The data-fetching lifecycle variant is exemplified by the auth and product-catalogue modules.

## Platform seams every composable consumes, never re-derives

- **Query types** — `modules/query/query.types.ts` exports `ListQuery<TQueryFnData, TData>` and `MutationResult<TData, …>`. A module-local `type XQuery = ReturnType<typeof localServiceFn>` over a query result is the defect.
- **Identity / target resolution** — the scope builder owns actor resolution (`resolveSelfActor`, `scope/scope.utils.ts`). The request target id follows the live convention: scope-context id wins when a `.for()` context is present; the session `activeUser` id supplies the self case. A services file that ignores the scope context and hardwires the session id drops `.for('client', id)` retargeting — the FE-2824 defect. Tell: a request URL built from `activeUser` with no scope-context check upstream.
- **Instance keying** — `createScopedComposable` owns registration; `generateScopeKey` owns the key (actor + context + `.withId()` id + brand). A module never mints its own axis: no per-variant registration name (`"module@<variant>"`), no module-local `Map` of registrations, no hand-derived cache key. Where the platform blocks the native shape, stop and escalate in plain language — never mint a private axis.

## Singletons

Long-lived singletons: brand, basket, session-store. Non-singletons that need `destroy()`: flow/wizard composables (auth, checkout).

## Variance law (scoped composables)

Mechanically enforced by the `scope-based/*` ESLint rules in `pnpm lint` over `packages/headless/src/modules/**`. Cite base Part B for the four-layer shape. The deltas a diff is judged against:

1. Uniform four-layer return regardless of actor.
2. Fresh modules start armless (exemplar `account/`). An arm is folded in by a spread into the shared factory file — `useAuth.actions.ts`'s `...actorActions`, spread last — never a `.base` file.
3. A per-actor `.{actor}.ts` arm exists only for members exclusive to that scope or overriding the shared implementation, never as an empty scaffold. Applies to all five layers.
4. `.as('self')` resolution belongs to the scope builder (`scope/scope.builder.ts` → `resolveSelfActor`). A SELF branch inside a module's own factory or services file breaks the clause; a consumer's `.as('self')` call and an `as const` matrix key are the documented API. One standing exception awaits operator-gated removal: `auth/auth.services.ts` `case ScopeActorTypes.SELF` in `getSession`.
5. Deviations carry an adjacent `@decision` block with `what:` / `why:` / `rejected:`. Any field missing blocks.

## Related bindings

- The `@internal` + barrel Module Visibility Law: `code-quality.companion.md`.
- State-read utilities (`stateMatches` / `useContext` / `contextValue`): `code-xstate.md`.

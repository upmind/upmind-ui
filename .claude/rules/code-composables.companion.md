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

> Companion to [code-composables.md](./code-composables.md) — Upmind-monorepo-specific bindings/examples.

## Decision record & reference implementation

- The architectural rationale for the scoped pattern is [ADR-001: Scope-Based Composables](../../docs/adr/001-scope-based-composables.md) — cite it, never restate it.
- **Reference implementation (scoped):** `useAuth` at `packages/headless/src/modules/auth/` is the canonical example. **Read it first** — before writing or reviewing any scoped composable. **The rules and the docs are the authority; `useAuth` is one worked example of them, not a match target.** Where a doc's template and the canonical disagree, that is a surfaced finding — say so out loud, never silently resolve toward the example.

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

## Platform seams every composable consumes (never re-derives)

Two platform surfaces touch EVERY composable; consuming them is mandatory, re-deriving them is a defect:

- **Query types** — `modules/query/query.types.ts` exports **`ListQuery<TQueryFnData, TData>`** and **`MutationResult<TData, …>`** precisely so a module never derives `ReturnType<typeof localServiceFn>` from its own instantiated service (the `ListQuery` docblock states this ban verbatim). A module-local `type XQuery = ReturnType<...>` alias over a query/mutation result is the tell.
- **Identity/target resolution** — the scope builder owns ACTOR resolution (clause 4 above; `resolveSelfActor`, `scope/scope.utils.ts`); the request TARGET id follows the live convention (client-phone / client-address): **scope-context id wins when a `.for()` context is present; the session's `activeUser` id supplies the self case** (`const { activeUser } = useActiveSession().useContext()`). The FE-2824 defect is a services file that **ignores the scope context** and hardwires the session id for every call — dropping `.for('client', id)` retargeting — not the session read itself. Tell: a request URL built from `activeUser` with no scope-context check upstream.

## Machine-node sweep receipt

Nesting `registering` under `available` made `useSession.completeRegistration`'s `waitFor(["available","done"])` resolve immediately, so the submit was never awaited and the form navigated on — the silent-resolve failure the base rule's sweep exists to catch.

## Singleton examples

Long-lived singletons in this monorepo: **brand, basket, session-store**. Non-singletons that need `destroy()`: flow/wizard composables (auth, checkout).

## Variance law (scoped composables, deltas only)

Cite base Part B for the shared four-layer shape — not restated here. This is what a diff under `packages/headless/src/modules/**` is judged against beyond it.

1. **Uniform four-layer default.** Every scoped composable returns the same four sub-composables regardless of actor — base Part B "Four-Layer Return Shape."
2. **Fresh modules start armless.** A module is born with zero `.{actor}.ts` files until a scope earns one — exemplar `account/` (no arm files anywhere in the tree). The merge seam that later folds an arm in is a spread into the shared factory file, never a `.base` file: `auth/useAuth.actions.ts`'s `return { destroy, onDone, onError, reject, resolve, set, ...actorActions }`, where `actorActions` is chosen by `actorScope` and always spreads last.
3. **Per-actor arm ONLY for exclusive/overriding members.** Base Part B, "Actor-Specific Sub-Composables" (section name, not a line number — the base rule's line numbers move between plugin versions): an `.{actor}.ts` arm exists only when that scope has members exclusive to it or overriding the shared implementation, never as an empty scaffold. See also this file's union-health receipt above (`registerAsGuest`).

   **Layer-scope note (added `docs/sdd/FE-2966-FE-2967` task 7c, operator ruling 2026-07-28):** clause 3 applies to any of the five sub-composable layers — services, actions, context, meta, schemas — not only the layers with a pre-existing exemplar in this tree. `code-composables.md` Part B states the arm pattern is "the same pattern for every layer"; `scoped-composable-factory`'s templates scaffold an opt-in arm for all five so a developer doesn't hand-invent shape when clause 3 first triggers on a layer this tree has no receipt for yet (today: context, meta, schemas). A layer earning its first real arm is a receipt to add here, not a reason the templates should have waited.
4. **`.as('self')` resolution is owned by the scope builder.** A module factory receives an already-resolved, concrete actor and never branches on `SELF` itself — cite ADR-001. Resolution lives at `scope/scope.builder.ts:276`, which calls `resolveSelfActor` (`scope/scope.utils.ts:54`). What breaks the clause is a SELF branch inside a module's own factory/services file; a consumer's `.as('self')` / `.as(ScopeActorTypes.SELF)` call site and an `as const` scope-matrix computed key are the documented API, not a branch. One in-tree exception stands: `auth/auth.services.ts:83`'s `case ScopeActorTypes.SELF:` inside `getSession`'s actor switch, awaiting operator-gated removal.
5. **Deviations need `@decision`.** A comment block adjacent to the deviating construct with `what:` / `why:` / `rejected:`. Any field missing is unjustified and blocks.

### Loader scoping (this file's frontmatter)

The `paths:` block above narrows when *the Claude Code host* treats this rule pair as contextually relevant. It does NOT guarantee SessionStart injection: the installed `hooks/inject-laws.sh` is an allowlist that injects only the always-on rule companions, and `code-composables` is not among them — so this companion is not auto-injected at SessionStart, and `paths:` governs only the host-native context-assembly channel. (An earlier note here claimed `inject-laws.sh` `cat`s every companion unconditionally at `:82-100`; that described a superseded version of the hook.) Enforcement does not depend on either channel — the variance law is mechanically enforced by the `@upmind-automation/eslint-plugin-scope-based` rules in `pnpm lint` / CI over `packages/headless/src/modules/**`.

**Empirical finding (T1.3):** of the 24 `.claude/rules/*.companion.md` files in this repo, this was the only one a fresh session's initial context omitted from the always-loaded set — correlating exactly with `code-composables.md` being the only paired base rule that already carries its own `paths:` frontmatter. A live in-session check — opening `packages/headless/src/modules/auth/useAuth.ts` (a match) versus `packages/headless/package.json` (a non-match) — surfaced no additional context for either; the scoping decision reads as fixed at context-assembly time, not re-evaluated per tool call within a running session. Net effect for a **net-new** module (files that don't exist yet when a session starts): this channel won't retroactively pick it up either. Neither the host channel nor SessionStart injection is the enforcement backstop — that is the `scope-based` ESLint plugin in CI. Scoping is kept because it costs nothing and narrows correctly for the majority case — an agent already working inside an existing matching module (conversion, review).

## Related bindings

- The `@internal` + barrel Module Visibility Law is bound in `code-quality.companion.md`.
- State-read utilities (`stateMatches` / `useContext` / `contextValue`) are the Upmind state utilities referenced under `code-xstate.md`.

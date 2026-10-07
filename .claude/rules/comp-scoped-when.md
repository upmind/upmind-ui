---
id: comp-scoped-when
when: choosing between a flat and a scoped composable
paths:
  - 'packages/headless/src/modules/**/use*.ts'
---
# Use a scoped composable only when actors differ

Use the scoped four-layer form only when the actors of a module have different capabilities. Examples: a guest and a signed-in client, or a staff user who acts for a client.

Use a flat composable for plain data fetching or a utility. ADR-001 (`docs/adr/001-scope-based-composables.md`) holds the rationale. Cite it. Do not restate it.

The actors are guest, client and staff. The actor enum is `ScopeActorTypes`. `SELF` resolves to the active actor in the scope builder.

The scoped factory is `createScopedComposable<ReturnType, Matrix>(...)`. The scope key comes from `generateScopeKey("module-name", { ...config, actor: actorScope })`. A matrix example is `AUTH_SCOPE_MATRIX`.

Exemplars:

- Scoped: `packages/headless/src/modules/auth/`. Read it first. Where it disagrees with a rule, the rule wins. Say so.
- A fresh scoped module with no arms: `packages/headless/src/modules/account/`.
- Flat: `useDomain`, `useBasket`, `useBrand`. `useBrand` keeps the legacy single `meta` object. Do not copy that form into new code.

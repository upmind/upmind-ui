> Companion to the upmind-agent skill /code-test-unit — Upmind-monorepo-specific bindings/overrides.

## Actor model (base worked examples)

- Base `ActorType` = **`AccessRoleTypes`**, members **`GUEST`, `CLIENT`, `STAFF`**; base `ActorScope` = **`ScopeActorTypes`**.
- The base examples' neutral `PRIMARY` member maps to **`CLIENT`** here. When authoring real tests, assert against these enums, not placeholders — e.g. `setSession(AccessRoleTypes.CLIENT, …)`, `useAuth().as(ScopeActorTypes.CLIENT)`, `expect(context.scope.value).toBe(ScopeActorTypes.CLIENT)`.

## Hard Rule — governing decision record

- The decision record that fixes "test-writer must not read implementation source / do not infer behaviour from implementation" (base Hard Rules) is **ADR-021 §Core Principles**.
- The base note "see that decision record's open items" (mechanical enforcement is a future enhancement) points to **ADR-021 §Open items**.

## Gherkin scenario path (base Hard Rules)

- The tagged Gherkin feature file for a layer lives at **`tests/Playwright/features/<flow>/*.feature`**.

## Fixtures (base "Test Data: Use Fixtures")

- Fixture helper `getFixtureBody` is imported from the repo fixtures module at **`tests/fixtures`** (e.g. `../../../../../../tests/fixtures` relative to a test under `packages/…`).
- Fixture-key convention: e.g. **`oauth-access_token-${actorType}`**; the fixture body type is the real domain type (e.g. `getFixtureBody<IToken>(…)`).
- The base "fixture-record command" is **`pnpm dev:record`**; the missing-fixture throw message should direct the reader to run it (e.g. ``throw new Error('Missing fixture. Run `pnpm dev:record` to capture.')``).

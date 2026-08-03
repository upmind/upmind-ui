> Companion to the upmind-agent skill /code-test-unit — Upmind-monorepo-specific bindings/overrides.

## Actor model (base worked examples)

- Base `ActorType` = **`AccessRoleTypes`**, members **`GUEST`, `CLIENT`, `STAFF`**; base `ActorScope` = **`ScopeActorTypes`**.
- The base examples' neutral `PRIMARY` member maps to **`CLIENT`** here. When authoring real tests, assert against these enums, not placeholders — e.g. `setSession(AccessRoleTypes.CLIENT, …)`, `useAuth().as(ScopeActorTypes.CLIENT)`, `expect(context.scope.value).toBe(ScopeActorTypes.CLIENT)`.

## Hard Rule — governing decision record

- The decision record that fixes "test-writer must not read implementation source / do not infer behaviour from implementation" (base Hard Rules) is **ADR-021 §Core Principles**.
- The base note "see that decision record's open items" (mechanical enforcement is a future enhancement) points to **ADR-021 §Open items**.

## Gherkin scenario path (base Hard Rules)

- The e2e journey feature (`@layer-e2e`) lives at **`tests/features/<flow>/*.feature`**.
- **Module business-logic feature — bindings for the base *Anchor every test to the feature (TDD)* rule.** Feature location: co-located at **`packages/headless/src/modules/<name>/__tests__/<name>.feature`** or in the SDD dir (**`docs/sdd/<story>/*.feature`**). Scenario-id scheme: **`@AC-<cell><n>`** (the `design.md` §6 ids). Enforcement: the co-located **`<name>.traceability.test.ts`** (Vitest, rides the module suite). NOTE: the `/code-test-bdd` skill that authored this feature was retired in the skill-doors restructure with no direct replacement door — its home post-restructure is an open operator decision (see `sdd-bdd.companion.md`).

## Fixtures (base "Test Data: Use Fixtures")

- Fixture helper `getFixtureBody` is imported from the repo fixtures module at **`tests/fixtures`** (e.g. `../../../../../../tests/fixtures` relative to a test under `packages/…`).
- Fixture-key convention: e.g. **`oauth-access_token-${actorType}`**; the fixture body type is the real domain type (e.g. `getFixtureBody<IToken>(…)`).
- The base "fixture-record command" is **`pnpm dev:record`**; the missing-fixture throw message should direct the reader to run it (e.g. ``throw new Error('Missing fixture. Run `pnpm dev:record` to capture.')``).

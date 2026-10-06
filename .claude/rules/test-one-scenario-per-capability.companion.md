---
id: test-one-scenario-per-capability
paths:
  - 'packages/**/__tests__/*.feature'
  - 'tests/journeys/**/*.feature'
---
# Scenarios — monorepo bindings

- A module's driven scenario carries the capability's `@AC-N` tag. A declarative scenario carries `@todo` and names its blocker (ADR 035, Amendment 1).
- An editor is a second scenario key. `replayFeature({ composables })` boots the module's manager beside its collection: `{ actor }` for a new record, `{ actor, context: { type, id } }` for an existing one.
- Token and transport behaviour belong to the `query`, `session-store` and `auth` modules, not to each module that uses them.
- The journey features in `tests/journeys/**/*.feature` are declarative and are not executed (ADR 020, `docs/adr/020-gherkin-test-planning.md`). Do not add `@cucumber/cucumber`.
- Exemplar: `packages/headless/src/modules/client-email/__tests__/client-email.feature`.

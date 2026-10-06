---
id: test-fixtures-recorded
paths:
  - 'packages/**/__tests__/**/*.{ts,js}'
  - 'packages/**/*.{test,spec}.{ts,js}'
  - 'tests/**/*.{ts,js}'
---
# Recorded fixtures — monorepo bindings

- The generator is the module's own `__tests__/<module>.fixtures.ts`. It records through `Generator`.
- There are two kinds of recording (ADR 035, Amendment 1). A fixture is one request, in flat `__tests__/fixtures/*.json`. A scenario is a multi-step flow, in `__tests__/scenarios/<scenario-slug>/<NN>/`. A test that needs a sequence of requests is a scenario.
- Record from a real run with `pnpm dev:record` in `apps/cart`.
- Read a recording with `getFixtureBody<T>(key)` from `tests/fixtures/index.ts`. The actor token fixture key is `oauth-access_token-${actorType}`, typed `IToken`.
- When staging does not hold a state, the generator arranges it with the staff account, records it, then resets it. Never change a value inside a recording.
- A state that only an import makes uses `tests/fixtures/imports/`. Read its README.
- Exemplar: `packages/headless/src/modules/client-email/__tests__/`.

---
paths:
  - '**/*.spec.ts'
  - '**/*.test.ts'
  - '**/*.spec.js'
  - '**/*.test.js'
  - '**/__tests__/**'
  - '**/tests/**'
---
> Companion to `code-tests.md` — Upmind-monorepo bindings.

## Test ids

The `data-test-key` / `data-test-value` / `dataAttrs` contract lives in `code-tests-e2e.companion.md`. One home.

## Fixture recording

Record from a real run with `pnpm dev:record`. The actor-parametrised token fixture key is `oauth-access_token-${actorType}`, typed `IToken`.

Hand-rolled integration fixtures are denied mechanically by the ESLint rule `scope-based/no-hand-rolled-int-fixture` over `**/*.int.test.ts`: journey bodies come from `getFixture`/`getFixtureBody` over co-located `__tests__/fixtures/*.json`, never from a local builder. Control and error responses are exempt.

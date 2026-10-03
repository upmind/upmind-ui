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

## Every answer is a recording of that exact request (ADR 035)

A test never fakes an answer. It serves no body it wrote, filters or merges no recorded rows, and keeps no collection it changes itself. Every request gets a verbatim staging recording of that exact request, matched by exact identity (`tests/fixtures/fixture-handlers.ts`). A request no recording holds is a capture gap, and it fails the test by name.

- **Fixtures are one-offs:** flat `__tests__/fixtures/*.json`, one file per request, read by pure unit tests and the labs forced states.
- **Scenarios are multi-step flows:** `__tests__/scenarios/<scenario-slug>/<NN>/`, one folder per step. Any test that needs a sequence IS a scenario.
- **Every module capability is a driven `.feature` scenario** (operator ruling 2026-09-24). A module keeps no capability `*.int.test.ts`; its only integration test is `<module>.replay.int.test.ts`. Token and transport behaviour belong to the `query`, `session-store` and `auth` modules.
- **One scenario per capability.** The driven scenario carries the `@AC-N` tag. A capability no scenario can drive keeps ONE declarative scenario, tagged `@todo` with the named blocker.
- **An editor is a second scenario key.** `replayFeature({ composables })` boots the module's manager beside its collection: `{ actor }` for a new record, `{ actor, context: { type, id } }` for an existing one.
- Both kinds are recorded by the module's own `<module>.fixtures.ts` through `Generator`.
- A new step exists only when the SAME request must answer differently: a page, a sort, a re-read after a write.
- Assertions check the business outcome from the recorded rows and totals, never a computed count, a masked literal name or only the request state.
- Boot reads a signed-in test makes are answered by the recordings of the modules that own them (`brand`, `system`, `basket`, `session-store`).
- A state staging does not hold (a verified address, a forbidding brand setting) is ARRANGED by the generator with the staff account, recorded, then reset to its original value (operator ruling 2026-09-24). Never flip a value inside a recording.
- A state that only an import makes (imported invoices with chosen numbers, dates, statuses) is arranged with `tests/fixtures/imports/` (see its README).

Canary: `packages/headless/src/modules/client-email/__tests__/`.

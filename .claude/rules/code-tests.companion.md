---
paths:
  - '**/*.spec.ts'
  - '**/*.test.ts'
  - '**/*.spec.js'
  - '**/*.test.js'
  - '**/__tests__/**'
  - '**/tests/**'
---
> Companion to [code-tests.md](./code-tests.md) — Upmind-monorepo-specific bindings/examples.

## Test-id / `dataAttrs` contract

The base rule's generic "explicit stable test-id" binds, in this repo, to the precise attribute contract in `code-tests-e2e.companion.md`: the explicit test-id attribute is **`data-test-key`**, exposed through the component's **`dataAttrs`** prop; dynamic values are read via the single **`data-test-value`** attribute. The label-derived-fallback offenders are `Button.ce.vue:8`, `Link.ce.vue:8`, and `RadioCard`. See `code-tests-e2e.companion.md` for the full contract and the FE-2874 audit reference.

## Fixture recording

The base rule's "record it from a real run" is, in this repo, `pnpm dev:record`; the actor-parametrised token fixture key is `oauth-access_token-${actorType}` typed as `IToken`.

**Mechanical enforcement — `scope-based/no-hand-rolled-int-fixture` via `pnpm lint`.** The base rule's "Never hand-rolled mocks" (`code-test-integration/SKILL.md:80`), which that skill itself marks "enforced by skill-level audit" only (`:49`), is gated by the **`scope-based/no-hand-rolled-int-fixture`** AST ESLint rule (`packages/eslint-plugin-scope-based/rules/no-hand-rolled-int-fixture.mjs`, wired in `eslint.config.mjs` over `**/*.int.test.ts`) — the re-homed successor to the bespoke regex scanner this bound to originally (`tests/fixtures/lint-int-test-provenance.mjs`, retired). It errors on an `*.int.test.ts` that feeds `HttpResponse.json(...)` from a **local builder** (directly, or via a `const` bound to its result) instead of `getFixtureBody`/`getFixture`, or that wires a replay server with no co-located `__tests__/fixtures/*.json` (the `vestigialReplay` message). Journey data must come from recorded fixtures; control/error responses (`data:null` acks, `{error}`, status ≥ 400) are exempt because they never reference a builder in the first place. RuleTester specs: `packages/eslint-plugin-scope-based/scope-based.test.mjs`.

> **Provenance (2026-07-29 · incident-fixture-provenance).** Added after the `client-phone-dry` factory smoke test shipped green integration tests whose phone bodies were hand-built inline (`listEnvelope([phoneFixture()])`) behind a replay server pointed at a `fixtures/` dir that was never created — `lint:fixtures` stayed vacuously green (no dir = nothing to lint) and the factory Tests gate reads only exit codes. The behaviour was already law (4× codified); this binds the missing mechanical gate. Re-homed from the original bespoke regex scanner to this AST rule (2026-07-30) once the `scope-based` ESLint plugin existed as the idiomatic host — same detection semantics, real scope analysis instead of bracket-counting regex. Follow-up (plugin repo, cross-repo): upgrade `code-test-integration/SKILL.md:49`'s "future enhancement" wording to cite this gate.

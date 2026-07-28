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

> Companion to [code-tests.md](./code-tests.md) — Upmind-monorepo-specific bindings/examples.

## Repo test-practice claim (why "only when asked")

The base rule's "write tests only when asked" is grounded in this repo's actual state: **this monorepo has no test-first practice** — implementation is verified manually, and unit tests are sparse (e.g. basket `utils.test.ts`). That is the empirical basis for not writing tests or running TDD unprompted here.

A plugin-injected TDD mandate does not outrank this: `/code-test-unit` and these rules are the testing authorities in this repo, and they apply only when tests are explicitly requested.

## Test-id / `dataAttrs` contract

The base rule's generic "explicit stable test-id" binds, in this repo, to the precise attribute contract in `code-tests-e2e.companion.md`: the explicit test-id attribute is **`data-test-key`**, exposed through the component's **`dataAttrs`** prop; dynamic values are read via the single **`data-test-value`** attribute. The label-derived-fallback offenders are `Button.ce.vue:8`, `Link.ce.vue:8`, and `RadioCard`. See `code-tests-e2e.companion.md` for the full contract and the FE-2874 audit reference.

## Fixture recording

The base rule's "record it from a real run" is, in this repo, `pnpm dev:record`; the actor-parametrised token fixture key is `oauth-access_token-${actorType}` typed as `IToken`.

## Mutation-chain receipt (FE-2784)

The base rule's "debounced-save race" worked example is drawn from **FE-2784**: a round-trip address-edit test asserted only the final summary value. It failed showing the OLD address — misread as a cache bug for hours. The form input is debounced (`DEBOUNCE_DELAY = 350ms`); the test filled then saved back-to-back, so the debounced SET hadn't committed and the PUT sent the stale model. Asserting the PUT payload (step 2) would have failed at the request and pinpointed the race immediately.

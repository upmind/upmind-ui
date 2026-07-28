---
paths:
  - '**/e2e/**/*.spec.ts'
  - '**/e2e/**/support/**/*.ts'
  - '**/*.feature'
---
> Companion to [code-tests-e2e.md](./code-tests-e2e.md) — Upmind-monorepo-specific bindings/examples.

## Governing ADRs (the policy that wins)

The base rule says "where a local testing policy and this rule disagree, the policy wins." In this monorepo that policy is three ADRs, and **they win over the base rule**:

- **ADR-020** — Gherkin test planning: `.feature` files are spec-only, declarative, authored before the `.spec.ts`. Do **not** add `@cucumber/cucumber`; `.feature` files stay non-executable.
- **ADR-021** — Testing Trophy, Agentic Workflow & Coverage Policy: most coverage at unit/integration; the P1 runtime target/ceiling is a hard CI ceiling here; "shadow implementations" is ADR-021's name for the P4/P5 anti-pattern; two flakes → quarantine, 30 days → delete.
- **ADR-022** — UI testing strategy: stories are the canonical UI-test artefact; don't add new visual coverage until the visual-regression tool decision lands.

Full paths: [020](../../docs/adr/020-gherkin-test-planning.md), [021](../../docs/adr/021-testing-pyramid-and-agentic-workflow.md), [022](../../docs/adr/022-ui-testing-strategy.md).

### ADR conflicts (T1–T6)

Where this rule and the ADRs disagree, the ADR wins. Track the tension by its T-code:

| Code | Tension | Resolution |
|------|---------|------------|
| **T1** | E2E was the dominant test layer; now it's the smallest. | ADR 021 Trophy — most coverage at unit/integration. New e2e gated on "must be e2e — not unit/integration in disguise." |
| **T2** | Shadow implementations (hand-rolled HTTP setup) were a speed hack; now named debt. | ADR 021 §68 — retire shortcut helpers as soon as the layer beneath covers what they masked. |
| **T3** | Planning used to be implicit in the spec; now a paired `.feature` exists first. | ADR 020 — `.feature` files spec-only, declarative, authored before the `.spec.ts`. |
| **T4** | Component-level UI checks drifted into Playwright. | ADR 022 — stories are the canonical UI test artefact. Tolerated for now; don't multiply. |
| **T5** | Visual regression is Playwright today; future tool is open. | ADR 022 — don't add new visual coverage until tool decision lands. |
| **T6** | Cucumber/Gherkin runner was on the table; deferred. | ADR 020 — don't add `@cucumber/cucumber`. `.feature` files stay non-executable. |

## Field guide and doc paths

- The base rule distils the load-bearing principles of [`tests/Playwright/docs/12-pseudo-nathan.md`](../../tests/Playwright/docs/12-pseudo-nathan.md) — the full evidence + worked examples live there, per-principle anchors `#p1`…`#p9` and the tensions section `#7`. (This monorepo field-guide doc is distinct from the base rule's `pseudo-nathan` reviewer seat at `../agents/pseudo-nathan.md`.)
- **Workflow:** [code-test-e2e.md](../workflows/code-test-e2e.md) (Gherkin → `.spec.ts`).
- The e2e support tree is rooted at `tests/Playwright/e2e/support/`; specs at `tests/Playwright/e2e/e2e-tests/**`; features at `tests/Playwright/features/**`. The base rule's generic `support/` directory table maps 1:1 onto these paths.
- Failure screenshots are auto-saved under `test-output/test-results/**/test-failed-1.png` in this repo.

## Real modules

"The app's real modules" in the base rule = the **`headless`** and **`client-vue`** packages. API-driven setup is legitimate only when it drives `headless`/`client-vue`; hand-rolled HTTP that replicates their business logic is the shadow implementation.

## Test-id attribute contract (`data-test-key` / `data-test-value` / `dataAttrs`)

The base rule's generic "explicit stable test-id" is, in this repo, a precise contract:

- The explicit test-id attribute is **`data-test-key`** (not the generic `data-testid`).
- Every explicit test-id is exposed through the component's **`dataAttrs`** prop (`dataAttrs?: Record<\`data-${string}\`, string | number | boolean>`), v-bound onto the rendered element — it overrides the primitive's fallback id. Add a `dataAttrs` passthrough to a shared ui primitive that lacks one rather than bolting on wrappers/slots.
- **One value read → one `data-test-value`**; collapse bespoke `data-*` names to it.
- **Two object `v-bind`s on one element** crash `vite-plugin-vue-inspector` and are invisible to `tsc` — banned.
- Dynamic test-ids go through `kebabCase()` from `tests/Playwright/e2e/support/helpers/strings.ts` (the intentional non-lodash copy), composed from stable data only.

The concrete label-derived-fallback offenders are `Button.ce.vue:8`, `Link.ce.vue:8`, and `RadioCard`, which default `data-test-key` to `` `{type}-${kebabCase(label ?? "default")}` ``. Full standard + worked examples: the FE-2874 audit (`.agent/audits/testid-standard.md`).

## Sanctioned test-mode divergence

The single sanctioned PROD-path divergence is the **FE-2865 `useTestAttrs`** carve-out (enforced by `ci/lint-scope-purity.mjs`) — the mechanism that strips `data-test-*` in production while keeping them in test mode.

## Canonical route-cleanup example

[error-handling.spec.ts:22-25](../../tests/Playwright/e2e/e2e-tests/errors/error-handling.spec.ts#L22-L25).

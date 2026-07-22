> Companion to the upmind-agent skill /code-test-e2e — Upmind-monorepo-specific bindings/overrides.

## Paths (features / specs / page objects)

The base's generic path placeholders bind to:

- Gherkin features (`<features-dir>`): `tests/Playwright/features/<flow>/<feature-name>.feature`
- E2E specs (`<e2e-specs-dir>`): `tests/Playwright/e2e/e2e-tests/<flow>/<feature-name>.spec.ts`
- Page objects support dir: `tests/Playwright/e2e/support/page-objects/` — existing templates under `.../templates/` (e.g. `checkout.ts`, `basket.ts`, `login.ts`); add to these before creating new POs.

## Real production modules

The base's "real production modules" are `headless` and `client-vue` in this repo. Seed and drive state through them and their composables — `useBasket`, `useCheckout`, `useAuth`. `headless` clients are the last-resort seeding path (only with a comment explaining why the UI can't reach the state).

## Governance citations (these gate the base's rules)

- Gherkin-as-spec / spec-first STOP gate (Phase B): **ADR 020** — `docs/adr/020-gherkin-test-planning.md`.
- Testing pyramid, Core Principles (#2), Shortcut debt, Open items, CI strategy: **ADR 021** — `docs/adr/021-testing-pyramid-and-agentic-workflow.md`.
- Every-UI-permutation → component / Storybook: **ADR 022** (future).

## Locale-stable locators — the concrete mechanism

Binds the base's "never target a label-derived testid" rule:

- The suite runs across **~28 locales**.
- The stable-test-id attribute is **`data-test-key`**. `Button` / `Link` / `RadioCard` auto-generate it from the **translated** label as `{type}-${kebabCase(label)}` — so `button-add-to-basket` (en) becomes `button-ajouter-au-panier` (fr). A PO targeting `button-add-to-basket` passes in English and silently times out in the other 27 locales (surfaces only in the i18n / vis-reg matrix, looks like flake).
- A passed `data-test-key` **overrides** the label-derived default on `<Button>` and `<Link>`. Use a deliberate semantic id (`show-more-payment-options`), not the English-label kebab (`link-show-more-options`).
- Confirm the locator resolves in a **non-English** locale before relying on it.
- Has bitten repeatedly: add-to-basket, login submit, gateway radio-cards, the "show more options" expander.

## CI budget (ADR 021 §CI strategy)

Binds the base's CI Expectations numbers:

| Property | Target |
|----------|--------|
| Critical-journey subset (~22 tests) | Runs on merges into `develop` |
| Full e2e suite | Nightly + pre-release |
| Critical subset duration | < 10 minutes |
| Full suite duration | < 60 minutes |
| Flake budget | Zero on first occurrence; quarantine on second; delete at 30 days |

Any test that adds **> 1 minute** to the critical subset needs justification; otherwise the scenario probably belongs at a lower layer.

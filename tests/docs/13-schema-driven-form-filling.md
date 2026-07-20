# 🧩 Schema-driven form filling

> How the buying-journey tests configure a product's required options **without
> hand-coding which options that product has** — so staging product-config drift
> stops breaking tests.

Related: [ADR 021 — testing pyramid & data policy](../../docs/adr/021-testing-pyramid-and-agentic-workflow.md) ·
[pseudo-Nathan field guide](12-pseudo-nathan.md) (P4 mock policy, brittle-assertion anti-pattern).

---

## The problem it solves

A configurable product (a `.com` domain, a hosting plan, a T-shirt) renders a
set of **option / attribute categories** on its config page. Some are
**required** — the basket will reject an add if they are left unset. Which
categories are required, how many values they have, and which value is the
default are all **staging configuration**, not app code. They drift.

The old pattern hand-coded that knowledge into the spec:

```ts
// ❌ brittle: encodes today's staging config into the test
await page.getByTestId("checkbox-group").locator('[value="the-known-id"]').click();
```

When someone adds a new required category on staging — or renames an option, or
flips a default — every spec that hand-coded the old shape breaks, even though
nothing in the app regressed.

## The rail: `applySchemaDefaults(page, rawProduct)`

`support/flows/products.ts` exports one helper. Give it the product's **captured
raw schema** and it fills every *required* option/attribute category with the
same default the headless configurator would choose — by clicking the option
card in the UI.

```ts
import { applySchemaDefaults } from "../../support/flows";
import { captureProduct } from "../../support/mocks/products";

// Attach the capture BEFORE the navigation that fetches the product.
const rawProductPromise = captureProduct(page);
await page.goto(URLs.comDomain);
const rawProduct = await rawProductPromise;

// ...fill any provision fields the product needs (SLD, registrant, etc.)

await applySchemaDefaults(page, rawProduct); // required options: done
await productConfig.addToBasket.click();
```

## How it works

For every entry in `products_options` + `products_attributes` whose
`category.required` is `true`, grouped by category:

1. **Order** the values by `pivot.order` — the same canonical order headless
   `parseSubproductDetails` uses, so "first" means the same thing everywhere.
2. **Pick the default**: the value flagged `pivot.default`, else the first in
   order. This mirrors headless `buildSubproductGroupSchema`
   (`packages/headless/src/modules/product/product.schemas.ts`) — the source of
   truth for what the machine auto-selects.
3. **Pick the primitive**: single-select (`RadioCards`) when the category is
   not `multiple` **or** is `required` with a single value; otherwise
   multi-select (`CheckboxCards`). This mirrors client-vue
   `SubproductCards.mapComponent`.
4. **Click the option card by its unique id** —
   `[data-test-key="radio-card-item"|"checkbox-item"][data-test-value="<option id>"]`
   — unless it is already selected (idempotent: re-clicking a checkbox would
   deselect it).

The helper re-derives (rather than imports) that default rule on purpose: the
headless `parseSubproductDetails` / `buildSubproductGroupSchema` pipeline depends
on the app's `useBrand()` runtime and cannot execute inside the Playwright Node
process. The rule is tiny and its source of truth is cited in the code so it
stays in sync.

## What it covers

| Category shape | Behaviour |
| --- | --- |
| `required + multiple`, >1 value (the `.com` domain canary) | Selects the default / first checkbox card so `minProperties: 1` is satisfied. |
| `required + single`, no explicit default | Auto-picks the first value in canonical order — matching the schema's `first(values)` fallback. |
| `required + single`, explicit default | Ensures the flagged default is selected (no-op if the machine already pre-selected it). |
| `required + multiple`, single value | Renders single-select + `const`; ensured selected. |
| Optional categories | **Left untouched** — they are the user's choice to skip. |
| Product with no required categories | **Safe no-op.** |

## When to use it

- Any **buying-journey** test that adds a configurable product to the basket.
  Reach for the rail before hand-coding an option click.
- It is a **rail other tests consume** — keep its API and this doc in step when
  you extend it.

## When to hand-code (the exceptions)

`applySchemaDefaults` deliberately does **not** try to be a universal form
filler. Hand-code the interaction (and leave a comment saying why) when:

- **The category renders as a native `<select>`** (brand `optionSelector: "select"`),
  a collapsed accordion, or any control that is not a visible radio/checkbox
  card. The helper waits briefly for the card and then skips — a genuinely
  unfilled required field surfaces at submit rather than hanging.
- **You are asserting a *specific* non-default choice** — e.g. a test that must
  pick the second term, a particular add-on, or a quantity. The helper only
  ever picks the default; asserting a deliberate non-default is spec-specific.
- **Provision fields** (domain SLD, registrant details, phone) — those are not
  option categories; use the dedicated `ProductConfig` page-object methods.

## The drift guarantee

Because the helper reads the product's own live schema, **adding a new required
option category to a tested product on staging does not require any spec
change** — the next run derives and fills it automatically. That is the whole
point.

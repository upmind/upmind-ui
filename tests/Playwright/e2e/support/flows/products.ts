import type { Page } from "@playwright/test";
import type {
  IProduct,
  IProductAttribute,
  IProductCategory,
  IProductOption
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// Schema-driven product-config form filling (FE-2781)
//
// The single job of this module is to satisfy a product's *required* option and
// attribute categories on the product-config page WITHOUT any hand-coded,
// per-product field knowledge in the spec. Everything it does is derived from
// the product's own captured raw schema (see `captureProduct` in
// `support/mocks/products.ts`), so when staging product-config drifts — a new
// required category is added, an option is renamed, defaults change — the
// canary buying-journey tests keep passing untouched.
//
// See `tests/Playwright/docs/13-schema-driven-form-filling.md` for the full
// how/when/when-to-hand-code guide.
// -----------------------------------------------------------------------------

/** A raw subproduct — an option or attribute — from the captured product schema. */
type RawSubproduct = IProductOption | IProductAttribute;

/**
 * The two card primitives a required option category can render through, and
 * the `data-state` value each uses to mark an option as selected.
 *
 * - `radio-card-item` (upmind-ui `RadioCards`): single-select. The selected
 *   option's `<Label>` carries `data-state="checked"`.
 * - `checkbox-item` (upmind-ui `CheckboxCards`): multi-select. The pressed
 *   radix `ToggleGroupItem` carries `data-state="on"`.
 *
 * Both primitives tag every option with `data-test-value="<option id>"`, and
 * option/attribute ids are globally unique, so a single option is addressable
 * by id alone — no need to scope to its group.
 */
const RADIO = { key: "radio-card-item", selected: "checked" } as const;
const CHECKBOX = { key: "checkbox-item", selected: "on" } as const;

/**
 * How long to wait for a required option's card to render before treating the
 * category as "not a supported card control" (e.g. a native `<select>`) and
 * skipping it — those are the documented hand-code cases.
 */
const OPTION_CARD_TIMEOUT = 5_000;

/**
 * Fills every REQUIRED option/attribute category of `rawProduct` with the same
 * default the headless configurator would pick, by clicking the option card in
 * the UI. Optional categories are left untouched, and the call is a safe no-op
 * for products that have no required categories.
 *
 * Idempotent: an option that is already selected (because the machine's schema
 * default pre-selected it) is never re-clicked.
 *
 * @param page - the page sitting on the product-config form for `rawProduct`.
 * @param rawProduct - the raw product payload captured via `captureProduct`,
 *   fetched BEFORE navigation to the config page.
 *
 * @example
 *   const rawProductPromise = captureProduct(page);
 *   await page.goto(URLs.comDomain);
 *   const rawProduct = await rawProductPromise;
 *   // ...enter any provision fields the product needs (SLD, registrant, etc.)
 *   await applySchemaDefaults(page, rawProduct);
 *   await productConfig.addToBasket.click();
 */
export async function applySchemaDefaults(
  page: Page,
  rawProduct: IProduct
): Promise<void> {
  if (!rawProduct) return;

  // Options and attributes render through the same card primitives, so treat
  // them uniformly — the per-option id we target is unique across both.
  const subproducts: RawSubproduct[] = [
    ...(rawProduct.products_options ?? []),
    ...(rawProduct.products_attributes ?? [])
  ];

  // Group by category so each category's `required`/`multiple` flags are read
  // once and the whole option set is reasoned about together. Only required
  // categories need us to act — optional ones are the user's choice to skip.
  const categories = new Map<string, RawSubproduct[]>();
  for (const subproduct of subproducts) {
    if (!subproduct.category?.required) continue;
    const bucket = categories.get(subproduct.category_id) ?? [];
    bucket.push(subproduct);
    categories.set(subproduct.category_id, bucket);
  }

  for (const values of categories.values()) {
    const category = values[0]!.category;

    // Canonical order — mirrors headless `parseSubproductDetails`
    // (`orderBy(data, "pivot.order")` in product.utils.ts) so "first" here is
    // the same option the configurator and add-to-basket flows treat as first.
    const ordered = [...values].sort(
      (a, b) => (a.pivot?.order ?? 0) - (b.pivot?.order ?? 0)
    );

    // Default resolution mirrors headless `buildSubproductGroupSchema`
    // (product.schemas.ts): a value flagged `pivot.default` wins; otherwise a
    // required category falls back to the first option in canonical order —
    // which covers `required + single` categories that ship no explicit default.
    const target = ordered.find(value => !!value.pivot?.default) ?? ordered[0];
    if (!target) continue;

    // Which primitive renders this category mirrors client-vue
    // `SubproductCards.mapComponent`: single-select (RadioCards) when the
    // category is not `multiple`, OR is `required` with a single value;
    // otherwise multi-select (CheckboxCards).
    const hasMultipleValues = ordered.length > 1;
    const isSingleSelect =
      !category.multiple || (category.required && !hasMultipleValues);

    await ensureOptionSelected(
      page,
      isSingleSelect ? RADIO : CHECKBOX,
      target.id,
      category
    );
  }
}

/**
 * Clicks a single option card by its (unique) id, unless it is already
 * selected. If no card for that id appears within `OPTION_CARD_TIMEOUT` the
 * category is assumed to render through an unsupported control and is skipped —
 * a required field left unfilled surfaces later at submit rather than hanging.
 *
 * The skip stays deliberate (the documented hand-code cases), but it is no
 * longer silent: a timed-out REQUIRED category is `console.warn`-named at the
 * source (category + control kind + option), so schema drift is diagnosable
 * instead of vanishing into a bare `catch {}`.
 */
async function ensureOptionSelected(
  page: Page,
  primitive: typeof RADIO | typeof CHECKBOX,
  optionId: string,
  category: IProductCategory
): Promise<void> {
  const item = page
    .locator(
      `[data-test-key="${primitive.key}"][data-test-value="${optionId}"]`
    )
    .first();

  try {
    await item.waitFor({ state: "visible", timeout: OPTION_CARD_TIMEOUT });
  } catch {
    // The option card never rendered within OPTION_CARD_TIMEOUT. This remains a
    // deliberate SKIP (the documented hand-code path: a native <select> or a
    // collapsed group — see docs/13-schema-driven-form-filling.md); semantics
    // are unchanged and a required field left unfilled still surfaces at submit.
    // But NAME the drift at the source so a silently-unfilled required category
    // is diagnosable rather than invisible.
    console.warn(
      `[applySchemaDefaults] required category "${category.name}" ` +
        `(${category.id}) rendered no ${primitive.key} for option ` +
        `${optionId} within ${OPTION_CARD_TIMEOUT}ms — skipping (likely a ` +
        `native <select> or collapsed group that needs hand-coding).`
    );
    return;
  }

  // Re-clicking a checkbox would deselect it, and re-clicking a required radio
  // is a wasted interaction that can race the model update — so only click when
  // the option is not already in its selected state.
  const alreadySelected =
    (await item.getAttribute("data-state")) === primitive.selected;
  if (alreadySelected) return;

  await item.click();
}

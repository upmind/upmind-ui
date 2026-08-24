import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import {
  CONFIGURED_PRODUCT,
  PRICE_OVERRIDE_PRODUCT,
  QUANTIFIABLE_PRODUCT,
  SUMMARY_DETAILS_KEYS,
  VISIBILITY
} from "../../support/constants/summary-breakdown";
import { interceptUISchema } from "../../support/mocks/brand";
import { addProductViaHeadless } from "../../support/flows/basket-setup";
import { readSummaryProduct } from "../../support/flows/basket-summary-data";
import type { SummaryProductData } from "../../support/flows/basket-summary-data";
import {
  BasketSummary,
  SUMMARY_LINE_KINDS
} from "../../support/page-objects/templates/basket-summary";

/**
 * @fileoverview FE-2943 — the basket summary's two presentations.
 *
 * ## Job To Be Done
 * A customer reviewing what they are about to buy can see what each product's
 * price is made of: one block per product, one priced line per configuration
 * detail worth summarising (term, option, attribute) and nothing else. A brand
 * setting chooses between that itemised presentation and a plain-totals one.
 *
 * Implements `docs/sdd/FE-2943/summary-breakdown.feature` (one test per
 * Scenario); the capability ids cited per test are docs/sdd/FE-2943/design.md's.
 *
 * ## What breaks if these fail
 * The itemised presentation had NO test handles and NO recorded acceptance
 * (parity GAP-01), which is how the whole presentation could stop rendering
 * with every gate green. These tests select the rendered breakdown by its own
 * handle and read the per-product lines out of it, so its absence is red.
 *
 * ## The oracle
 * Expected line counts come from the live basket product's CONFIGURATION model
 * (the selections the server committed) and expected figures from its SERVED
 * details — never from the rendered summary. Each test seeds the brand setting
 * it depends on; none reads whichever way the brand happens to be configured.
 */

const BRAND_SETTINGS = /\/api\/brand\/settings/;

const parseMoney = (text: string): number =>
  Number(text.replace(/[^\d.,-]/g, "").replace(/,/g, ""));

/**
 * Sets the basket presentation and proves the setting reached the app.
 *
 * Asserting the served brand meta carries the override is what makes a later
 * failure attributable: the summary was ASKED for this presentation and did or
 * did not render it. Without this the same red could be a lost override.
 */
async function openBasketAskingFor(
  page: Page,
  context: BrowserContext,
  presentation: (typeof VISIBILITY)[keyof typeof VISIBILITY]
) {
  interceptUISchema(context, {
    [SUMMARY_DETAILS_KEYS.BASKET]: presentation
  });
  const settings = page.waitForResponse(response =>
    BRAND_SETTINGS.test(response.url())
  );
  await page.goto(URLs.basket);
  const body = await (await settings).json();
  expect(
    body?.data?.meta?.cart?.[SUMMARY_DETAILS_KEYS.BASKET],
    "setup: the brand-settings override never reached the app, so nothing below is attributable to the summary"
  ).toBe(presentation);
}

const uniqueDomain = () =>
  `${fakerEN_GB.string.alphanumeric({ length: { min: 6, max: 12 } })}.com`;

const configuredSeed = () => ({
  productId: CONFIGURED_PRODUCT.id,
  quantity: 1,
  billingCycleMonths: CONFIGURED_PRODUCT.billingCycle,
  provisionFields: { domain: uniqueDomain() },
  options: {
    [CONFIGURED_PRODUCT.option.categoryId]: {
      [CONFIGURED_PRODUCT.option.valueId]: {
        productId: CONFIGURED_PRODUCT.option.valueId,
        cycle: CONFIGURED_PRODUCT.option.cycle,
        quantity: 1
      }
    },
    [CONFIGURED_PRODUCT.multiUnitOption.categoryId]: {
      [CONFIGURED_PRODUCT.multiUnitOption.valueId]: {
        productId: CONFIGURED_PRODUCT.multiUnitOption.valueId,
        cycle: CONFIGURED_PRODUCT.multiUnitOption.cycle,
        quantity: CONFIGURED_PRODUCT.multiUnitOption.unitQuantity
      }
    }
  },
  attributes: {
    [CONFIGURED_PRODUCT.unpricedAttribute.categoryId]: {
      [CONFIGURED_PRODUCT.unpricedAttribute.valueId]: {
        productId: CONFIGURED_PRODUCT.unpricedAttribute.valueId,
        cycle: CONFIGURED_PRODUCT.unpricedAttribute.cycle,
        quantity: 1
      }
    }
  }
});

/** Fails the test rather than passing vacuously when the seed lost its shape. */
function assertFixtureIsConfigured(served: SummaryProductData) {
  expect(
    served.selections.options,
    "fixture: the seeded basket product carries no selected option"
  ).toBeGreaterThan(0);
  expect(
    served.selections.attributes,
    "fixture: the seeded basket product carries no attribute"
  ).toBeGreaterThan(0);
  expect(
    served.term,
    "fixture: the seeded basket product carries no term"
  ).toBe(CONFIGURED_PRODUCT.billingCycle);
  expect(
    served.otherDetailCount,
    "fixture: the seeded basket product carries no non-summarisable detail, so 'no other line is shown' would pass vacuously"
  ).toBeGreaterThan(0);
}

test.describe("Basket summary — itemised configuration breakdown", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  // Scenario: The basket summary itemises each product's configuration when the
  // brand asks for details — C1, C3, C4, C5, C6, C7, C8, C9, C10, C15
  test("The basket summary itemises each product's configuration when the brand asks for details", async ({
    page,
    context
  }) => {
    const summary = new BasketSummary(page);

    // Given the brand shows itemised configuration details in the basket summary
    await openBasketAskingFor(page, context, VISIBILITY.VISIBLE);

    // And my basket contains that configured product
    const { basketProductId } = await addProductViaHeadless(
      page,
      configuredSeed()
    );
    expect(basketProductId).toBeTruthy();

    // When I review my basket
    await page.goto(URLs.basket);
    const served = await readSummaryProduct(page, basketProductId as string);
    assertFixtureIsConfigured(served);

    // Then the summary shows a block for that product
    await expect(summary.breakdown).toBeVisible({ timeout: 15000 });
    await expect(summary.productBlocks).toHaveCount(1);
    const block = summary.productBlock(basketProductId as string);
    await expect(block).toBeVisible();
    await expect(block).toContainText(CONFIGURED_PRODUCT.name);
    await expect(summary.productTotal(block)).toContainText(
      served.allUnitsPrice
    );

    // And that block shows a priced line for the product's billing cycle, for
    // each option I selected, and for each of the product's attributes
    await expect(
      summary.productLinesOfKind(block, SUMMARY_LINE_KINDS.TERM)
    ).toHaveCount(1);
    await expect(
      summary.productLinesOfKind(block, SUMMARY_LINE_KINDS.OPTION)
    ).toHaveCount(served.selections.options);
    await expect(
      summary.productLinesOfKind(block, SUMMARY_LINE_KINDS.ATTRIBUTE)
    ).toHaveCount(served.selections.attributes);

    // And no line is shown for any other part of the product's configuration
    // (the seeded provision field is a served detail that must not become a line)
    await expect(summary.productLines(block)).toHaveCount(
      1 + served.selections.options + served.selections.attributes
    );

    // And every line reads as its category label and the selected title
    for (const detail of served.details) {
      if (detail.kind === SUMMARY_LINE_KINDS.TERM) continue;
      const rendered = await summary.lineTexts(block, detail.kind);
      expect(
        rendered.some(
          text =>
            text.includes(detail.title) &&
            (!detail.category || text.includes(detail.category))
        ),
        `no ${detail.kind} line reads as "${detail.category} / ${detail.title}" (rendered: ${JSON.stringify(rendered)})`
      ).toBeTruthy();
    }

    // And the billing-cycle line reads as how often I am billed, not as a
    // number of months
    const termLine = summary.productLinesOfKind(block, SUMMARY_LINE_KINDS.TERM);
    const termText = (await termLine.innerText()).trim();
    expect(termText).not.toMatch(
      new RegExp(`\\b${served.term}\\s*months?\\b`, "i")
    );
    expect(termText).toMatch(/annual/i);

    // And a line whose own unit quantity is greater than one shows that count
    // beside the ITEM, with the single-item price it multiplies up from — never
    // beside the line's own figure
    const multiUnit = served.details.find(
      detail => (detail.unitQuantity ?? 1) > 1
    );
    expect(
      multiUnit,
      "fixture: no served line carries a unit quantity greater than one"
    ).toBeTruthy();
    const multiUnitLine = summary
      .productLinesOfKind(block, multiUnit!.kind)
      .filter({ hasText: multiUnit!.title });
    await expect(multiUnitLine).toHaveCount(1);
    const multiUnitPrice = (
      await summary.linePrice(multiUnitLine).innerText()
    ).trim();
    const besideTheItem = (await multiUnitLine.innerText()).replace(
      multiUnitPrice,
      ""
    );
    expect(besideTheItem).toMatch(
      new RegExp(`\\b${multiUnit!.unitQuantity}\\b`)
    );
    expect(besideTheItem).toContain(multiUnit!.unitPrice);
    expect(multiUnitPrice).not.toMatch(/[x×]\s*\d|\d\s*[x×]/i);
  });

  // Scenario: The basket summary shows plain totals only when the brand hides
  // configuration details — C1, C16, C17
  test("The basket summary shows plain totals only when the brand hides configuration details", async ({
    page,
    context
  }) => {
    const summary = new BasketSummary(page);

    // Given the brand hides itemised configuration details in the basket summary
    await openBasketAskingFor(page, context, VISIBILITY.HIDDEN);

    // And my basket contains that configured product
    const { basketProductId } = await addProductViaHeadless(
      page,
      configuredSeed()
    );
    expect(basketProductId).toBeTruthy();

    // When I review my basket
    await page.goto(URLs.basket);
    await expect(summary.section).toBeVisible({ timeout: 15000 });

    // Then the summary shows the basket totals only
    await expect(summary.totalsLists.first()).toBeVisible();

    // And no itemised configuration breakdown is shown
    await expect(summary.breakdown).toHaveCount(0);
  });

  // Scenario: A configuration line the server does not price reads as unpriced — C7
  test("A configuration line the server does not price reads as unpriced", async ({
    page,
    context
  }) => {
    const summary = new BasketSummary(page);

    // Given the brand shows itemised configuration details in the basket summary
    await openBasketAskingFor(page, context, VISIBILITY.VISIBLE);

    // And my basket contains that configured product
    const { basketProductId } = await addProductViaHeadless(
      page,
      configuredSeed()
    );
    expect(basketProductId).toBeTruthy();

    // When I review my basket
    await page.goto(URLs.basket);
    const served = await readSummaryProduct(page, basketProductId as string);
    const unpriced = served.details.find(
      detail => !detail.unitPrice && !detail.allUnitsPrice
    );
    expect(
      unpriced,
      "fixture: the server prices every seeded detail, so the unpriced case is not exercised"
    ).toBeTruthy();

    await expect(summary.breakdown).toBeVisible({ timeout: 15000 });
    const block = summary.productBlock(basketProductId as string);

    // Then every configuration line shown carries either an amount or an
    // explicit unpriced marker — and none is shown with an empty price
    const lineCount = await summary.productLines(block).count();
    expect(lineCount).toBeGreaterThan(0);
    for (let index = 0; index < lineCount; index += 1) {
      const line = summary.productLines(block).nth(index);
      await expect(summary.linePrice(line)).toHaveCount(1);
      await expect(summary.linePrice(line)).toHaveText(/\S/);
    }

    // And the detail the server prices with no figure reads as an explicit
    // marker rather than a zero amount
    const unpricedLine = summary
      .productLinesOfKind(block, unpriced!.kind)
      .filter({ hasText: unpriced!.title });
    await expect(unpricedLine).toHaveCount(1);
    const marker = (await summary.linePrice(unpricedLine).innerText()).trim();
    expect(marker).toMatch(/\S/);
    expect(marker).not.toMatch(/^[^\d]*0([.,]0+)?$/);
  });

  // Scenario: A product bought more than once shows both its single-unit price
  // and its all-units total — C5, C11
  test("A product bought more than once shows both its single-unit price and its all-units total", async ({
    page,
    context
  }) => {
    const summary = new BasketSummary(page);

    // Given the brand shows itemised configuration details in the basket summary
    await openBasketAskingFor(page, context, VISIBILITY.VISIBLE);

    // And my basket contains 3 units of a configured product
    const { basketProductId } = await addProductViaHeadless(page, {
      productId: QUANTIFIABLE_PRODUCT.id,
      quantity: QUANTIFIABLE_PRODUCT.quantity,
      billingCycleMonths: QUANTIFIABLE_PRODUCT.billingCycle
    });
    expect(basketProductId).toBeTruthy();

    // When I review my basket
    await page.goto(URLs.basket);
    const served = await readSummaryProduct(page, basketProductId as string);
    expect(served.quantity).toBe(QUANTIFIABLE_PRODUCT.quantity);
    expect(
      served.allUnitsPrice,
      "fixture: the all-units and one-unit figures are identical, so showing only one of them would pass"
    ).not.toBe(served.oneUnitPrice);

    await expect(summary.breakdown).toBeVisible({ timeout: 15000 });
    const block = summary.productBlock(basketProductId as string);

    // Then that product's block shows a quantity of 3
    await expect(block).toContainText(
      new RegExp(`[x×]\\s*${QUANTIFIABLE_PRODUCT.quantity}\\b`)
    );

    // And it shows the price of a single unit, and the total for all 3 units
    await expect(summary.productUnitPrice(block)).toContainText(
      served.oneUnitPrice
    );
    await expect(summary.productTotal(block)).toContainText(
      served.allUnitsPrice
    );
  });

  // Scenario: A price-overriding selection replaces the product's own term
  // price — C12, read back per design.md §3
  test("A price-overriding selection replaces the product's own term price", async ({
    page,
    context
  }) => {
    const summary = new BasketSummary(page);

    // Given the brand shows itemised configuration details in the basket summary
    await openBasketAskingFor(page, context, VISIBILITY.VISIBLE);

    // And my basket contains one unit of a product whose selected option sets
    // the product's price
    const { basketProductId } = await addProductViaHeadless(page, {
      productId: PRICE_OVERRIDE_PRODUCT.id,
      quantity: 1,
      billingCycleMonths: PRICE_OVERRIDE_PRODUCT.billingCycle,
      options: {
        [PRICE_OVERRIDE_PRODUCT.overridingOption.categoryId]: {
          [PRICE_OVERRIDE_PRODUCT.overridingOption.valueId]: {
            productId: PRICE_OVERRIDE_PRODUCT.overridingOption.valueId,
            cycle: PRICE_OVERRIDE_PRODUCT.overridingOption.cycle,
            quantity: 1
          }
        }
      }
    });
    expect(basketProductId).toBeTruthy();

    // When I review my basket
    await page.goto(URLs.basket);
    const served = await readSummaryProduct(page, basketProductId as string);
    // One unit only, so the displayed all-units figure IS the one-unit figure
    // and no multiplication enters the reconciliation (design.md §3).
    expect(served.quantity).toBe(1);
    expect(served.allUnitsPrice).toBe(served.oneUnitPrice);
    expect(
      served.selections.options,
      "fixture: the price-overriding option was not committed"
    ).toBeGreaterThan(0);

    await expect(summary.breakdown).toBeVisible({ timeout: 15000 });
    const block = summary.productBlock(basketProductId as string);

    // Then no billing-cycle line is shown for that product
    await expect(
      summary.productLinesOfKind(block, SUMMARY_LINE_KINDS.TERM)
    ).toHaveCount(0);

    // And the configuration lines shown account for that product's displayed
    // price — the TEST does the arithmetic over the rendered figures; the
    // application never computes a money figure client-side
    const shownLines = await summary.productLines(block).count();
    expect(shownLines).toBeGreaterThan(0);
    const figures = await summary
      .linePrice(summary.productLines(block))
      .allInnerTexts();
    const amounts = figures
      .map(text => parseMoney(text))
      .filter(amount => Number.isFinite(amount));
    expect(
      amounts.length,
      `no line carried a parseable figure (rendered: ${JSON.stringify(figures)})`
    ).toBeGreaterThan(0);
    const displayed = parseMoney(await summary.productTotal(block).innerText());
    expect(
      amounts.reduce((total, amount) => total + amount, 0),
      `the lines shown do not account for the product's displayed price (lines: ${JSON.stringify(figures)})`
    ).toBeCloseTo(displayed, 2);
  });
});

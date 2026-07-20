import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { waitForCalculateResponse } from "../../support/helpers/checkout";

// FE-2791 — product-config quantity → price recalculation.
//
// Changing a quantifiable product's quantity must re-price through the real
// `useCalculate` → POST /cart/calculate actor the product machine spawns
// (FE-2636 consolidated pricing there). This proves the summary total settles
// to a value the endpoint returned — never a client-side or hardcoded figure,
// and with no mock standing in for the calculation. The "consulting block" is
// quantifiable (its NumberField renders), so it drives the quantity path
// without options/domains getting in the way.

test.describe("Product configuration quantity → price recalculation @FE-2791", () => {
  test("Increasing quantity re-prices the total from the cart/calculate response", async ({
    page
  }) => {
    const productConfig = new ProductConfig(page);

    await page.goto(URLs.consultingBlock);
    await expect(productConfig.productConfigSection).toBeVisible();
    await expect(productConfig.totalValue).toBeVisible();
    await expect(productConfig.totalQty).toBeVisible();

    // Baseline: the starting quantity and the total priced for it.
    const startQty = Number(await productConfig.totalQty.inputValue());
    const totalBefore = (await productConfig.totalValue.innerText()).trim();

    // A calc whose outgoing payload carried an INCREASED quantity: a quantity
    // greater than one pushes `{ price, quantity }` (useCalculate.pushPrice), so
    // the request — not just the UI — reflects the bump. Keyed on `> startQty`
    // (known now) so the wait can be armed BEFORE the click and never miss the
    // calc the single increment triggers; the displayed-qty poll below pins the
    // exact new quantity.
    const carriesIncreasedQty = (prices: unknown) =>
      Array.isArray(prices) &&
      prices.some(
        (entry: unknown) =>
          typeof entry === "object" &&
          entry !== null &&
          typeof (entry as { quantity?: number }).quantity === "number" &&
          (entry as { quantity: number }).quantity > startQty
      );

    // Tie the on-screen total back to a real endpoint answer — every displayed
    // price is formatted through this cart/calculate response.
    const calcResponse = waitForCalculateResponse(page, carriesIncreasedQty);

    // Bump the quantity via the stepper — a click reliably commits the change,
    // unlike a raw fill that some number fields defer to blur — then read the
    // committed quantity back once it has actually incremented.
    await productConfig.quantityIncrement.click();
    await expect
      .poll(async () => Number(await productConfig.totalQty.inputValue()))
      .toBeGreaterThan(startQty);

    // The displayed total must actually change — recalculation happened.
    await expect
      .poll(async () => (await productConfig.totalValue.innerText()).trim())
      .not.toBe(totalBefore);

    // The cart/calculate that carried the increased quantity really answered;
    // read the total it returned for the new quantity.
    const body = await (await calcResponse).json().catch(() => null);
    const settledTotal: string = body?.data?.total_formatted ?? "";
    expect(
      settledTotal,
      "cart/calculate returned a formatted total"
    ).toBeTruthy();

    // The settled on-screen total is the value the endpoint returned. total-price
    // renders via CurrentPrice, which may append a "monthly-from" adornment, so
    // assert containment (poll: the UI settles asynchronously after the response).
    await expect
      .poll(async () =>
        (await productConfig.totalValue.innerText())
          .replace(/\s+/g, " ")
          .trim()
          .includes(settledTotal)
      )
      .toBeTruthy();
  });
});

import { test, expect } from "@playwright/test";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { URLs } from "../../support/constants/urls";
import { interceptUISchema } from "../../support/mocks/brand";

let productConfig: ProductConfig;

test.describe("Trim trailing zeroes on product prices", () => {
  test.beforeEach(({ page }) => {
    productConfig = new ProductConfig(page);
  });
  test("Product price displays without trailing zeroes when setting is applied, non-zero decimals are not affected", async ({
    page,
    context
  }) => {
    interceptUISchema(context, { "@data.trimTrailingZeroes": true });
    await page.goto(URLs.starterHosting);
    // Term radios carry the STATIC key radio-card-item with the stable billing
    // cycle (Monthly = 1, Annually = 12) in data-test-value — never the
    // translated label. The price-format is the value under test (trimmed vs
    // not), read exactly via current-price's data-test-value rather than a
    // substring match on rendered text.
    await expect(
      page
        .getByTestId("radio-card-item")
        .and(page.locator(`[data-test-value="1"]`))
        .getByTestId("current-price")
    ).toHaveAttribute("data-test-value", "£4");
    await expect(
      page
        .getByTestId("radio-card-item")
        .and(page.locator(`[data-test-value="12"]`))
        .getByTestId("current-price")
    ).toHaveAttribute("data-test-value", "£3.33");
  });
  test("Product price displays with trailing zeroes when setting is not applied", async ({
    page,
    context
  }) => {
    interceptUISchema(context, { "@data.trimTrailingZeroes": false });
    await page.goto(URLs.starterHosting);
    await expect(
      page
        .getByTestId("radio-card-item")
        .and(page.locator(`[data-test-value="1"]`))
        .getByTestId("current-price")
    ).toHaveAttribute("data-test-value", "£4.00");
  });
});

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
    // Term tiles key off the stable billing cycle (Monthly = 1, Annually = 12)
    // as option-tile-{cycle} — never the translated label. The price format is
    // the value under test (trimmed vs not), read exactly via current-price's
    // data-test-value rather than a substring match on rendered text.
    await expect(
      page.getByTestId("option-tile-1").getByTestId("current-price")
    ).toHaveAttribute("data-test-value", "£4");
    await expect(
      page.getByTestId("option-tile-12").getByTestId("current-price")
    ).toHaveAttribute("data-test-value", "£3.33");
  });
  test("Product price displays with trailing zeroes when setting is not applied", async ({
    page,
    context
  }) => {
    interceptUISchema(context, { "@data.trimTrailingZeroes": false });
    await page.goto(URLs.starterHosting);
    await expect(
      page.getByTestId("option-tile-1").getByTestId("current-price")
    ).toHaveAttribute("data-test-value", "£4.00");
  });
});

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
    await expect(
      page.getByTestId("radio-card-monthly").locator("footer")
    ).toContainText("£4");
    await expect(
      page.getByTestId("radio-card-annually").locator("footer")
    ).toContainText("£3.33");
  });
  test("Product price displays with trailing zeroes when setting is not applied", async ({
    page,
    context
  }) => {
    interceptUISchema(context, { "@data.trimTrailingZeroes": false });
    await page.goto(URLs.starterHosting);
    await expect(
      page.getByTestId("radio-card-monthly").locator("footer")
    ).toContainText("£4.00");
  });
});

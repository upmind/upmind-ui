import { test, expect } from "@playwright/test";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";
import { URLs } from "../../support/constants/urls";
import { interceptUISchema } from "../../support/utils/functions/brand";

let productConfig: ProductConfig;

test.describe("Trim trailing zeroes on product prices", () => {
  test.beforeEach(({ page }) => {
    productConfig = new ProductConfig(page);
  });
  test("Product price displays without trailing zeroes when setting is applied", async ({
    page,
    context
  }) => {
    await interceptUISchema(context, { "@data.trimTrailingZeroes": true });
    await page.goto(URLs.starterHosting);
    await expect(
      page.getByTestId("radio-card-monthly").locator("footer")
    ).toHaveText("£4");
  });
  test.skip("Setting is only applied to decimal zeroes and not whole numbers", async () => {
    // TODO: Implement test
  });
  test.skip("Product price displays with trailing zeroes when setting is not applied", async () => {
    // TODO: Implement test
  });
});

import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Basket } from "../../support/page-objects/templates/basket";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { waitForSessionCookie } from "../../support/helpers";
let basket: Basket;
let productConfig: ProductConfig;

test.describe("Bundled Products", () => {
  test.beforeEach(async ({ page }) => {
    basket = new Basket(page);
    productConfig = new ProductConfig(page);
  });
  test.describe("Bundle added automatically from product page", () => {
    test("Bundle product added automatically after product config", async ({
      page
    }) => {
      await page.goto(URLs.startupPlanning);
      await productConfig.addToBasket.click();
      // The bundle adds the primary product plus its bundled product. Product
      // names are translated copy and the basket card has no per-product-id
      // testid, so verify the bundle produced two basket products by count.
      await expect(basket.basketProduct).toHaveCount(2);
      await expect(basket.basketProduct.nth(1)).toBeVisible();
    });
  });
  test.describe("Bundle added via URL param", () => {
    test("Valid Bundle", async ({ page }) => {
      await page.goto(`${URLs.managementTraining}?bundle=coaching`);
      await waitForSessionCookie(page.context());
      await productConfig.addToBasket.click();
      // Valid bundle param adds the primary product plus the bundled product.
      await expect(basket.basketProductSummary).toHaveCount(2);
      await expect(basket.basketProductSummary.nth(1)).toBeVisible();
    });
    test("Invalid Bundle", async ({ page }) => {
      await page.goto(`${URLs.managementTraining}?bundle=invalidstring`);
      await waitForSessionCookie(page.context());
      await productConfig.addToBasket.click();
      // Invalid bundle param is ignored: only the primary product is added.
      await expect(basket.basketProduct.nth(0)).toBeVisible();
      await expect(basket.basketProduct.nth(1)).toBeHidden();
    });
  });
});

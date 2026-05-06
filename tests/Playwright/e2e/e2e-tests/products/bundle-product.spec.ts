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
      await expect(basket.basketProduct.nth(0)).toContainText(
        "Startup Planning"
      );
      await expect(basket.basketProduct.nth(1)).toContainText(
        "Coaching Session"
      );
    });
  });
  test.describe("Bundle added via URL param", () => {
    test("Valid Bundle", async ({ page }) => {
      await page.goto(`${URLs.managementTraining}?bundle=coaching`);
      await waitForSessionCookie(page.context());
      await productConfig.addToBasket.click();
      await expect(basket.basketProductSummary.nth(0)).toContainText(
        "Management Training"
      );
      await expect(basket.basketProductSummary.nth(1)).toContainText(
        "Coaching Session"
      );
    });
    test("Invalid Bundle", async ({ page }) => {
      await page.goto(`${URLs.managementTraining}?bundle=invalidstring`);
      await waitForSessionCookie(page.context());
      await productConfig.addToBasket.click();
      await expect(basket.basketProduct.nth(0)).toContainText(
        "Management Training"
      );
      await expect(basket.basketProduct.nth(1)).toBeHidden();
    });
  });
});

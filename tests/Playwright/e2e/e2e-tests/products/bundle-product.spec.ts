import { test, expect } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Basket } from "../../support/page-objects/templates/Basket";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";
let basket: Basket;
let productConfig: ProductConfig;

test.describe("Bundled Products", () => {
  test.beforeEach(({ page }) => {
    basket = new Basket(page);
    productConfig = new ProductConfig(page);
  });
  test.describe("Bundle added automatically from product page", () => {
    test("Bundle product added automatically after product config", async ({
      page
    }) => {
      await productConfig.addProductToBasket(URLs.managementTraining);
      await expect(basket.basketProduct.nth(0)).toContainText(
        "Management Training"
      );
      await expect(basket.basketProduct.nth(1)).toContainText(
        "Coaching Session"
      );
    });
  });
  test.describe("Bundle added via URL param", () => {
    test("Valid Bundle", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=8d632507-9806-5d1e-de4a-8174e234e98d&bundle=coaching"
      );
      await page.waitForLoadState("networkidle");
      await productConfig.confirmAndProceed.click();
      await expect(basket.basketProductSummary.nth(0)).toContainText(
        "Startup Planning"
      );
      await expect(basket.basketProductSummary.nth(1)).toContainText(
        "Coaching"
      );
    });
    test("Invalid Bundle", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=8d632507-9806-5d1e-de4a-8174e234e98d&bundle=invalidstring"
      );
      await page.waitForLoadState("networkidle");
      await productConfig.confirmAndProceed.click();
      await expect(basket.basketProduct.nth(0)).toContainText(
        "Startup Planning"
      );
      await expect(basket.basketProduct.nth(1)).toBeHidden();
    });
  });
});

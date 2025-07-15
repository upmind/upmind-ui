import { test, expect, Page } from "@playwright/test";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";
import { Basket } from "../../support/page-objects/templates/Basket";
let productConfig: ProductConfig;
let basket: Basket;

test.describe("Manipulating elements/behaviour with URL query strings", () => {
  test.beforeEach(async ({ page }) => {
    productConfig = new ProductConfig(page);
    basket = new Basket(page);
  });
  test.describe("Navigating to /product/add/ with PID param", () => {
    test("Valid Product ID", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2"
      );
    });
    test("Invalid Product ID", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2123"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/not-found/?pid=20403869-6e54-721d-264c-518d9305e7d2123"
      );
    });
  });
  test.describe("Setting a product bundle via URL params", () => {
    test("Valid Bundle", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=8d632507-9806-5d1e-de4a-8174e234e98d&bundle=coaching"
      );
      await page.waitForLoadState("networkidle");
      await page.getByTestId("button-confirm-and-proceed").click();
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
      await page.getByTestId("button-confirm-and-proceed").click();
      await expect(basket.basketProduct.nth(0)).toContainText(
        "Startup Planning"
      );
      await expect(basket.basketProduct.nth(1)).toBeHidden();
    });
  });
  test.describe("Setting default quantity via URL param", () => {
    test("Valid quantity value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2&qty=5"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2"
      );
      await expect(productConfig.totalQty).toHaveValue("5");
    });
    test("Invalid quantity value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2&qty=5zy"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2"
      );
      await expect(productConfig.totalQty).toHaveValue("1");
    });
  });
  test.describe("Setting default billing term via URL param", () => {
    test("Valid billing term", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=3de78642-de53-9714-76df-21208469530d&bcm=1"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(
        productConfig.radioButtons.getRadioButton(0, 0)
      ).toHaveAttribute("data-state", "checked");
    });
    test("Invalid billing term", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=3de78642-de53-9714-76df-21208469530d&bcm=32"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(
        productConfig.radioButtons.getRadioButton(0, 0)
      ).toHaveAttribute("data-state", "");
      await expect(
        productConfig.radioButtons.getRadioButton(0, 2)
      ).toHaveAttribute("data-state", "checked");
    });
  });
  test.describe("Setting currency via URL param", async () => {
    test("Valid currency value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2&currency=USD"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2"
      );
      await expect(page.getByTestId("popover-trigger")).toHaveText("USD");
    });
    test("Invalid currency value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2&currency=ZZZ"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2"
      );
      await expect(page.getByTestId("popover-trigger")).toHaveText("GBP");
    });
  });
  test.describe("Selecting subproducts (options/attributes) via URL param", () => {
    test("Valid option selections", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173/?pid=3de78642-de53-9714-76df-21208469530d&sub_pids=5952098d-3de4-0917-793c-31578626e347,78985742-6489-7012-820a-21e325d0ed36,4d036794-24d0-e710-42eb-3153698d582e&subproduct_qty[78985742-6489-7012-820a-21e325d0ed36]=1&subproduct_qty[4d036794-24d0-e710-42eb-3153698d582e]=1"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(productConfig.checkboxes.getCheckbox(0, 0)).toHaveAttribute(
        "data-active",
        "true"
      );
      await expect(productConfig.checkboxes.getCheckbox(1, 0)).toHaveAttribute(
        "data-active",
        "true"
      );
      await expect(
        productConfig.radioButtons.getRadioButton(1, 1)
      ).toHaveAttribute("data-state", "checked");
    });
    test("Invalid option selections", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173/?pid=3de78642-de53-9714-76df-21208469530d&sub_pids=invalid,invalid,invalid&subproduct_qty[78985742-6489-7012-820a-21e325d0ed36]=1&subproduct_qty[invalid]=1"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(productConfig.checkboxes.getCheckbox(0, 0)).toHaveAttribute(
        "data-active",
        "true"
      );
      await expect(productConfig.checkboxes.getCheckbox(1, 0)).toHaveAttribute(
        "data-active",
        "false"
      );
      const radioSelection = await productConfig.radioButtons.getRadioButton(
        1,
        1
      );
      await expect(
        productConfig.radioButtons.getRadioButton(1, 1)
      ).toHaveAttribute("data-state", "");
    });
  });
});

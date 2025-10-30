import { test, expect, Page } from "@playwright/test";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";
import { Footer } from "../../support/page-objects/templates/Footer";
let productConfig: ProductConfig;
let footer: Footer;

test.describe("Manipulating elements/behaviour with URL query strings @url-params", () => {
  test.beforeEach(async ({ page }) => {
    productConfig = new ProductConfig(page);
    footer = new Footer(page);
  });
  test.describe("Navigating to /product/add/ with PID param", () => {
    test("Valid Product ID - Navigate Only", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2&navigateOnly=true"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/add/20403869-6e54-721d-264c-518d9305e7d2"
      );
    });
    test("Invalid Product ID - Navigate Only", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2123&navigateOnly=true"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/not-found/?pid=20403869-6e54-721d-264c-518d9305e7d2123"
      );
    });
  });
  test.describe("Setting default quantity via URL param", () => {
    test("Valid quantity value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2&navigateOnly=true&qty=5"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/add/20403869-6e54-721d-264c-518d9305e7d2"
      );
      await expect(productConfig.totalQty).toHaveValue("5");
    });
    test("Invalid quantity value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=20403869-6e54-721d-264c-518d9305e7d2&navigateOnly=true&qty=5zy"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/add/20403869-6e54-721d-264c-518d9305e7d2"
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
        "http://qa-automation.local:5173/order/product/add/3de78642-de53-9714-76df-21208469530d"
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
        "http://qa-automation.local:5173/order/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(
        productConfig.radioButtons.getRadioButton(0, 0)
      ).toHaveAttribute("data-state", "");
      await expect(
        productConfig.radioButtons.getRadioButton(0, 2)
      ).toHaveAttribute("data-state", "checked");
    });
  });
  test.describe('Setting currency via "currency"', async () => {
    test("Valid currency value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=3de78642-de53-9714-76df-21208469530d&currency=USD"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(
        page.getByTestId("footer").getByTestId("button-default").nth(1)
      ).toHaveText("USD");
    });
    test("Invalid currency value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=3de78642-de53-9714-76df-21208469530d&currency=ZZZ"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(
        page.getByTestId("footer").getByTestId("button-default").nth(1)
      ).toHaveText("GBP");
    });
  });
  test.describe('Setting currency via "curr"', async () => {
    test("Valid currency value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=3de78642-de53-9714-76df-21208469530d&curr=USD"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(
        page.getByTestId("footer").getByTestId("button-default").nth(1)
      ).toHaveText("USD");
    });
    test("Invalid currency value", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173?pid=3de78642-de53-9714-76df-21208469530d&curr=ZZZ"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(
        page.getByTestId("footer").getByTestId("button-default").nth(1)
      ).toHaveText("GBP");
    });
  });
  test.describe("Selecting subproducts (options/attributes) via URL param", () => {
    test("Valid option selections", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173/?pid=3de78642-de53-9714-76df-21208469530d&sub_pids=5952098d-3de4-0917-793c-31578626e347,78985742-6489-7012-820a-21e325d0ed36,4d036794-24d0-e710-42eb-3153698d582e&subproduct_qty[78985742-6489-7012-820a-21e325d0ed36]=1&subproduct_qty[4d036794-24d0-e710-42eb-3153698d582e]=1"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(
        productConfig.radioButtons.getRadioButton(1, 0)
      ).toHaveAttribute("data-state", "checked");
      await expect(
        productConfig.radioButtons.getRadioButton(2, 0)
      ).toHaveAttribute("data-state", "checked");
      await expect(
        productConfig.radioButtons.getRadioButton(3, 1)
      ).toHaveAttribute("data-state", "checked");
    });
    test("Invalid option selections", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173/?pid=3de78642-de53-9714-76df-21208469530d&sub_pids=invalid,invalid,invalid&subproduct_qty[78985742-6489-7012-820a-21e325d0ed36]=1&subproduct_qty[invalid]=1"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.url()).toBe(
        "http://qa-automation.local:5173/order/product/add/3de78642-de53-9714-76df-21208469530d"
      );
      await expect(
        productConfig.radioButtons.getRadioButton(1, 0)
      ).toHaveAttribute("data-state", "");
      await expect(
        productConfig.radioButtons.getRadioButton(2, 0)
      ).toHaveAttribute("data-state", "");
      await expect(
        productConfig.radioButtons.getRadioButton(3, 1)
      ).toHaveAttribute("data-state", "");
    });
  });
  test.describe("Set language via URL param", () => {
    test('Valid "language" param', async ({ page }) => {
      await page.goto("http://qa-automation.local:5173/order/shop?lang=fr");
      await page.waitForLoadState("load");
      await expect(
        page.getByTestId("footer").getByTestId("button-default").nth(0)
      ).toHaveText("French");
    });
    test('Invalid "language" param', async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173/order/shop?lang=zzzzzzz"
      );
      await page.waitForLoadState("load");
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toHaveText("English");
    });
    test('Valid "locale" param', async ({ page }) => {
      await page.goto("http://qa-automation.local:5173/order/shop?locale=de");
      await page.waitForLoadState("load");
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toHaveText("German");
    });
    test('Invalid "locale" param', async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173/order/shop?locale=zzzzzzz"
      );
      await page.waitForLoadState("domcontentloaded");
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toHaveText("English");
    });
  });
  test.describe("Navigate to shop category via URL param", () => {
    test("Valid category", async ({ page }) => {
      await page.goto(
        "http://qa-automation.local:5173/order/shop?catid=5d085e69-d562-3719-794c-218e940d4237"
      );
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId("title")).toContainText("Shared Hosting");
    });
  });
});

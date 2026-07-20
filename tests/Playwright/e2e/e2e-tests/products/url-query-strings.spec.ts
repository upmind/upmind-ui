import { test, expect, Page } from "@playwright/test";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Footer } from "../../support/page-objects/templates/footer";
import { URLs, ProductIds } from "../../support/constants/urls";
import { waitForEvent } from "../../support/helpers";

let productConfig: ProductConfig;
let footer: Footer;

test.describe("Manipulating elements/behaviour with URL query strings @url-params", () => {
  test.beforeEach(async ({ page }) => {
    productConfig = new ProductConfig(page);
    footer = new Footer(page);
  });
  test.describe("Navigating to /product/ with PID param", () => {
    test("Valid Product ID - Navigate Only", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.consultingBlock}&navigateOnly=true`
      );
      await expect(productConfig.productConfigSection).toBeVisible();
    });
    test("Invalid Product ID - Navigate Only", async ({ page }) => {
      const invalidPid = `${ProductIds.consultingBlock}123`;
      await page.goto(`${URLs.baseUrl}?pid=${invalidPid}&navigateOnly=true`);
      await expect(page.getByTestId("dialog-window")).toBeVisible();
    });
  });
  test.describe("Setting default quantity via URL param", () => {
    test("Valid quantity value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.consultingBlock}&navigateOnly=true&qty=5`
      );
      await expect(productConfig.productConfigSection).toBeVisible();
      await expect(productConfig.totalQty).toHaveValue("5");
    });
    test("Invalid quantity value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.consultingBlock}&navigateOnly=true&qty=5zy`
      );
      await expect(productConfig.productConfigSection).toBeVisible();
      await expect(productConfig.totalQty).toHaveValue("1");
    });
  });
  test.describe("Setting default billing term via URL param", () => {
    test("Valid billing term", async ({ page }) => {
      await page.goto(`${URLs.baseUrl}?pid=${ProductIds.starterHosting}&bcm=1`);
      await expect(productConfig.productConfigSection).toBeVisible();
      await expect(
        productConfig.radioButtons.getRadioButton(1)
      ).toHaveAttribute("data-state", "checked");
    });
    test("Invalid billing term @FE-2676", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&bcm=32`
      );
      await expect(productConfig.productConfigSection).toBeVisible();
      await expect(
        productConfig.radioButtons.getRadioButton(1)
      ).toHaveAttribute("data-state", "checked");
      await expect(
        productConfig.radioButtons.getRadioButton(24)
      ).toHaveAttribute("data-state", "");
    });
  });
  test.describe('Setting currency via "currency"', () => {
    test("Valid currency value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&currency=USD`
      );
      await expect(footer.currencyValue).toBeVisible();
      await expect(footer.currencyValue).toHaveAttribute(
        "data-test-value",
        "USD"
      );
    });
    test("Invalid currency value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&currency=ZZZ`
      );
      await waitForEvent(page, "page_view");
      await expect(footer.currencyValue).toBeVisible();
      await expect(footer.currencyValue).toHaveAttribute(
        "data-test-value",
        "GBP"
      );
    });
  });
  test.describe('Setting currency via "curr"', () => {
    test("Valid currency value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&curr=USD`
      );
      await expect(footer.currencyValue).toBeVisible();
      await expect(footer.currencyValue).toHaveAttribute(
        "data-test-value",
        "USD"
      );
    });
    test("Invalid currency value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&curr=ZZZ`
      );
      await expect(footer.currencyValue).toBeVisible();
      await expect(footer.currencyValue).toHaveAttribute(
        "data-test-value",
        "GBP"
      );
    });
  });
  test.describe("Selecting subproducts (options/attributes) via URL param", () => {
    test("Valid option selections", async ({ page }) => {
      const subPids = [
        ProductIds.subproductTokyo,
        ProductIds.subproductMailbox,
        ProductIds.subproductOperatingSystem
      ].join(",");
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&sub_pids=${subPids}&subproduct_qty[${ProductIds.subproductMailbox}]=1&subproduct_qty[${ProductIds.subproductOperatingSystem}]=1`
      );
      await expect(
        productConfig.radioButtons.getRadioButton(ProductIds.subproductTokyo)
      ).toHaveAttribute("data-state", "checked");
      await expect(
        productConfig.radioButtons.getRadioButton(ProductIds.subproductMailbox)
      ).toHaveAttribute("data-state", "checked");
      await expect(
        productConfig.radioButtons.getRadioButton(
          ProductIds.subproductOperatingSystem
        )
      ).toHaveAttribute("data-state", "checked");
    });
    test("Invalid option selections", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&sub_pids=invalid,invalid,invalid&subproduct_qty[${ProductIds.subproductMailbox}]=1&subproduct_qty[invalid]=1`
      );
      await expect(
        productConfig.radioButtons.getRadioButton(ProductIds.subproductTokyo)
      ).toHaveAttribute("data-state", "");
      await expect(
        productConfig.radioButtons.getRadioButton(ProductIds.subproductMailbox)
      ).toHaveAttribute("data-state", "");
      await expect(
        productConfig.radioButtons.getRadioButton(
          ProductIds.subproductOperatingSystem
        )
      ).toHaveAttribute("data-state", "");
    });
  });
  test.describe("Set language via URL param", () => {
    test('Valid "language" param', async ({ page }) => {
      await page.goto(`${URLs.catalogueRoot1}?lang=fr`);
      await expect(footer.languageValue).toBeVisible();
      await expect(footer.languageValue).toHaveAttribute(
        "data-test-value",
        "fr"
      );
    });
    test('Invalid "language" param', async ({ page }) => {
      await page.goto(`${URLs.catalogueRoot1}?lang=zzzzzzz`);
      await expect(footer.languageValue).toBeVisible();
      // Invalid param is rejected and the brand default (English (US) = en-US)
      // remains active; read the locale CODE via data-test-value.
      await expect(footer.languageValue).toHaveAttribute(
        "data-test-value",
        "en-US"
      );
    });
    test('Valid "locale" param', async ({ page }) => {
      await page.goto(`${URLs.catalogueRoot1}?locale=de`);
      await expect(footer.languageValue).toBeVisible();
      await expect(footer.languageValue).toHaveAttribute(
        "data-test-value",
        "de"
      );
    });
    test('Invalid "locale" param', async ({ page }) => {
      await page.goto(`${URLs.catalogueRoot1}?locale=zzzzzzz`);
      await expect(footer.languageValue).toBeVisible();
      await expect(footer.languageValue).toHaveAttribute(
        "data-test-value",
        "en-US"
      );
    });
  });
  test.describe("Navigate to shop category via URL param", () => {
    test("Valid category", async ({ page }) => {
      await page.goto(
        `${URLs.catalogueRoot1}?catid=${ProductIds.sharedHostingCategory}`
      );
      // The category hero renders; its title is translated copy with no
      // category-id data-test-value landed, so verify presence by testid only.
      await expect(page.getByTestId("hero-title")).toBeVisible();
    });
  });
});

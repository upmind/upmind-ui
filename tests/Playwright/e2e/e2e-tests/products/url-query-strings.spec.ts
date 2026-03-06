import { test, expect, Page } from "@playwright/test";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";
import { Footer } from "../../support/page-objects/templates/Footer";
import { URLs, ProductIds, productAddUrl } from "../../support/constants/urls";
import { waitForEvent } from "../../support/utils/functions/helpers";

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
      await page.waitForURL(productAddUrl(ProductIds.consultingBlock));
    });
    test("Invalid Product ID - Navigate Only", async ({ page }) => {
      const invalidPid = `${ProductIds.consultingBlock}123`;
      await page.goto(`${URLs.baseUrl}?pid=${invalidPid}&navigateOnly=true`);
      await expect(page.getByTestId("dialog-window")).toBeVisible();
      await page.waitForURL(
        `${URLs.baseUrl}order/product/${invalidPid}/not-found/`
      );
    });
  });
  test.describe("Setting default quantity via URL param", () => {
    test("Valid quantity value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.consultingBlock}&navigateOnly=true&qty=5`
      );
      await expect(productConfig.productConfigSection).toBeVisible();
      await page.waitForURL(productAddUrl(ProductIds.consultingBlock));
      await expect(productConfig.totalQty).toHaveValue("5");
    });
    test("Invalid quantity value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.consultingBlock}&navigateOnly=true&qty=5zy`
      );
      await expect(productConfig.productConfigSection).toBeVisible();
      await page.waitForURL(productAddUrl(ProductIds.consultingBlock));
      await expect(productConfig.totalQty).toHaveValue("1");
    });
  });
  test.describe("Setting default billing term via URL param", () => {
    test("Valid billing term", async ({ page }) => {
      await page.goto(`${URLs.baseUrl}?pid=${ProductIds.starterHosting}&bcm=1`);
      await expect(productConfig.productConfigSection).toBeVisible();
      await page.waitForURL(productAddUrl(ProductIds.starterHosting));
      await expect(
        productConfig.radioButtons.getRadioButton("Monthly")
      ).toHaveAttribute("data-state", "checked");
    });
    test("Invalid billing term", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&bcm=32`
      );
      await expect(productConfig.productConfigSection).toBeVisible();
      await page.waitForURL(productAddUrl(ProductIds.starterHosting));
      await expect(
        productConfig.radioButtons.getRadioButton("Monthly")
      ).toHaveAttribute("data-state", "checked");
      await expect(
        productConfig.radioButtons.getRadioButton("Biennially")
      ).toHaveAttribute("data-state", "");
    });
  });
  test.describe('Setting currency via "currency"', () => {
    test("Valid currency value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&currency=USD`
      );
      await expect(
        footer.currencySelector.getByTestId("button-default")
      ).toBeVisible();
      await page.waitForURL(productAddUrl(ProductIds.starterHosting));
      await expect(
        footer.currencySelector.getByTestId("button-default")
      ).toHaveText("USD");
    });
    test("Invalid currency value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&currency=ZZZ`
      );
      await waitForEvent(page, "page_view");
      await expect(
        footer.currencySelector.getByTestId("button-default")
      ).toBeVisible();
      await page.waitForURL(productAddUrl(ProductIds.starterHosting));
      await expect(
        footer.currencySelector.getByTestId("button-default")
      ).toHaveText("GBP");
    });
  });
  test.describe('Setting currency via "curr"', () => {
    test("Valid currency value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&curr=USD`
      );
      await expect(
        footer.currencySelector.getByTestId("button-default")
      ).toBeVisible();
      await page.waitForURL(productAddUrl(ProductIds.starterHosting));
      await expect(
        footer.currencySelector.getByTestId("button-default")
      ).toHaveText("USD");
    });
    test("Invalid currency value", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&curr=ZZZ`
      );
      await expect(
        footer.currencySelector.getByTestId("button-default")
      ).toBeVisible();
      await page.waitForURL(productAddUrl(ProductIds.starterHosting));
      await expect(
        footer.currencySelector.getByTestId("button-default")
      ).toHaveText("GBP");
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
      await page.waitForURL(productAddUrl(ProductIds.starterHosting));
      await expect(
        productConfig.radioButtons.getRadioButton("Tokyo")
      ).toHaveAttribute("data-state", "checked");
      await expect(
        productConfig.radioButtons.getRadioButton("1 Mailbox")
      ).toHaveAttribute("data-state", "checked");
      await expect(
        productConfig.radioButtons.getRadioButton(
          "MacOS Sequoia Version 15.6 (Enterprise License)"
        )
      ).toHaveAttribute("data-state", "checked");
    });
    test("Invalid option selections", async ({ page }) => {
      await page.goto(
        `${URLs.baseUrl}?pid=${ProductIds.starterHosting}&sub_pids=invalid,invalid,invalid&subproduct_qty[${ProductIds.subproductMailbox}]=1&subproduct_qty[invalid]=1`
      );
      await page.waitForLoadState("load");
      await page.waitForURL(productAddUrl(ProductIds.starterHosting));
      await expect(
        productConfig.radioButtons.getRadioButton("Tokyo")
      ).toHaveAttribute("data-state", "");
      await expect(
        productConfig.radioButtons.getRadioButton("1 Mailbox")
      ).toHaveAttribute("data-state", "");
      await expect(
        productConfig.radioButtons.getRadioButton(
          "MacOS Sequoia Version 15.6 (Enterprise License)"
        )
      ).toHaveAttribute("data-state", "");
    });
  });
  test.describe("Set language via URL param", () => {
    test('Valid "language" param', async ({ page }) => {
      await page.goto(`${URLs.catalogueRoot1}?lang=fr`);
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toBeVisible();
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toHaveText("French");
    });
    test('Invalid "language" param', async ({ page }) => {
      await page.goto(`${URLs.catalogueRoot1}?lang=zzzzzzz`);
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toBeVisible();
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toContainText("English (US)");
    });
    test('Valid "locale" param', async ({ page }) => {
      await page.goto(`${URLs.catalogueRoot1}?locale=de`);
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toBeVisible();
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toHaveText("German");
    });
    test('Invalid "locale" param', async ({ page }) => {
      await page.goto(`${URLs.catalogueRoot1}?locale=zzzzzzz`);
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toBeVisible();
      await expect(
        footer.languageSelector.getByTestId("button-default")
      ).toContainText("English (US)");
    });
  });
  test.describe("Navigate to shop category via URL param", () => {
    test("Valid category", async ({ page }) => {
      await page.goto(
        `${URLs.catalogueRoot1}?catid=${ProductIds.sharedHostingCategory}`
      );
      await expect(page.getByTestId("hero-title")).toBeVisible();
      await expect(page.getByTestId("hero-title")).toContainText(
        "Shared Hosting"
      );
    });
  });
});

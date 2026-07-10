import { test, expect } from "@playwright/test";
import { interceptConfigValues } from "../support/mocks/brand";
import { URLs } from "../support/constants/urls";

test.describe("Display Price Types", () => {
  test.describe("Catalogue", () => {
    test("Price Type = Lowest Billing Cycle", async ({ page }) => {
      await page.goto(URLs.catalogueRoot1);
      await interceptConfigValues(page, {
        displayPriceType: "min"
      });
      await page.reload();
      await page.waitForLoadState("load");
      await expect(
        page.getByTestId("product-card-price-display").first()
      ).toBeVisible();
      await expect(page.getByTestId("widget-grid")).toHaveScreenshot(
        "catalogue-lowest-billing-cycle"
      );
    });
    test("Price Type = Highest Billing Cycle divided by Months", async ({
      page
    }) => {
      await page.goto(URLs.catalogueRoot1);
      await interceptConfigValues(page, {
        displayPriceType: "abs_min"
      });
      await page.reload();
      await page.waitForLoadState("load");
      await expect(
        page.getByTestId("product-card-price-display").first()
      ).toBeVisible();
      await expect(page.getByTestId("widget-grid")).toHaveScreenshot(
        "catalogue-highest-billing-cycle-divided-by-months"
      );
    });
    test("Price Type = Lowest Monthly Price", async ({ page }) => {
      await page.goto(URLs.catalogueRoot1);
      await interceptConfigValues(page, {
        displayPriceType: "lowest_monthly_price"
      });
      await page.reload();
      await page.waitForLoadState("load");
      await expect(
        page.getByTestId("product-card-price-display").first()
      ).toBeVisible();
      await expect(page.getByTestId("widget-grid")).toHaveScreenshot(
        "catalogue-lowest-monthly-price"
      );
    });
  });
  test.describe("Product Config", () => {
    test("Price Type = Lowest Billing Cycle", async ({ page }) => {
      await page.goto(URLs.starterHosting);
      await interceptConfigValues(page, {
        displayPriceType: "min"
      });
      await page.reload();
      await page.waitForLoadState("load");
      await expect(
        page
          .getByTestId("form-item")
          .and(page.locator('[data-test-value="term"]'))
          .first()
      ).toBeVisible();
      await expect(page).toHaveScreenshot("prodconfig-lowest-billing-cycle");
    });
    test("Price Type = Highest Billing Cycle divided by Months", async ({
      page
    }) => {
      await page.goto(URLs.starterHosting);
      await interceptConfigValues(page, {
        displayPriceType: "abs_min"
      });
      await page.reload();
      await page.waitForLoadState("load");
      await expect(
        page
          .getByTestId("form-item")
          .and(page.locator('[data-test-value="term"]'))
          .first()
      ).toBeVisible();
      await expect(page).toHaveScreenshot(
        "prodconfig-highest-billing-cycle-divided-by-months"
      );
    });
    test("Price Type = Lowest Monthly Price", async ({ page }) => {
      await page.goto(URLs.starterHosting);
      await interceptConfigValues(page, {
        displayPriceType: "lowest_monthly_price"
      });
      await page.reload();
      await page.waitForLoadState("load");
      await expect(
        page
          .getByTestId("form-item")
          .and(page.locator('[data-test-value="term"]'))
          .first()
      ).toBeVisible();
      await expect(page).toHaveScreenshot("prodconfig-lowest-monthly-price");
    });
  });
});

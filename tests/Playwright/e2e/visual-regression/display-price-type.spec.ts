import { test, expect, Page } from "@playwright/test";
import { getSessionToken } from "../support/api/auth";
import { interceptConfigValues } from "../support/mocks/brand";
import { URLs } from "../support/constants/urls";
import { waitForSessionCookie } from "../support/helpers/session";

test.describe("Display Price Types", () => {
  let token: string;
  test.describe("Catalogue", () => {
    test("Price Type = Lowest Billing Cycle", async ({ page, context }) => {
      await page.goto(URLs.catalogueRoot1);
      await waitForSessionCookie(context);
      token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
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
      page,
      context
    }) => {
      await page.goto(URLs.catalogueRoot1);
      await waitForSessionCookie(context);
      token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
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
    test("Price Type = Lowest Monthly Price", async ({ page, context }) => {
      await page.goto(URLs.catalogueRoot1);
      await waitForSessionCookie(context);
      token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
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
    test("Price Type = Lowest Billing Cycle", async ({ page, context }) => {
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(context);
      token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
        displayPriceType: "min"
      });
      await page.reload();
      await page.waitForLoadState("load");
      await expect(page.getByTestId("form-item-term").first()).toBeVisible();
      await expect(page).toHaveScreenshot("prodconfig-lowest-billing-cycle");
    });
    test("Price Type = Highest Billing Cycle divided by Months", async ({
      page,
      context
    }) => {
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(context);
      token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
        displayPriceType: "abs_min"
      });
      await page.reload();
      await page.waitForLoadState("load");
      await expect(page.getByTestId("form-item-term").first()).toBeVisible();
      await expect(page).toHaveScreenshot(
        "prodconfig-highest-billing-cycle-divided-by-months"
      );
    });
    test("Price Type = Lowest Monthly Price", async ({ page, context }) => {
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(context);
      token = await getSessionToken(context);
      await interceptConfigValues(page, token, {
        displayPriceType: "lowest_monthly_price"
      });
      await page.reload();
      await page.waitForLoadState("load");
      await expect(page.getByTestId("form-item-term").first()).toBeVisible();
      await expect(page).toHaveScreenshot("prodconfig-lowest-monthly-price");
    });
  });
});

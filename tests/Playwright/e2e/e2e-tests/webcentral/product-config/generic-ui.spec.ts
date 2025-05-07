import { test, expect } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
let checkout: Checkout;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
  await page.goto(URLs.starterHosting);
  await checkout.optionsContainer.waitFor();
});

test.describe("Checkout - Generic UI Checks", async () => {
  test("Initial Page Load - Visual Regression", async ({ page }) => {
    //await expect(page).toHaveScreenshot("Checkout - Page Load.png");
  });
  test("Product Description - Show more/Show Less", async () => {
    await expect(checkout.optionsContainer).toHaveScreenshot(
      "Checkout - Lineclamp Applied.png"
    );
    await checkout.clickLineclamp();
    await expect(checkout.optionsContainer).toHaveScreenshot(
      "Checkout - Lineclamp Removed.png"
    );
  });
});

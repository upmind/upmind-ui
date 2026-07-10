import { test, expect } from "@playwright/test";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import { addProductViaHeadless } from "../../support/flows/basket-setup";
import { overrideWarningNotes } from "../../support/mocks/orders";
let basket: Basket;

test.describe("Basket - Displaying Warning Notes", () => {
  test.beforeEach(async ({ page }) => {
    basket = new Basket(page);
    await page.goto(URLs.basket);
    await addProductViaHeadless(page, {
      productId: "20403869-6e54-721d-264c-518d9305e7d2",
      quantity: 1,
      billingCycleMonths: 0
    });
  });
  test("Warning Notes Displayed", async ({ page }) => {
    await overrideWarningNotes(page, "This is a warning note");
    await page.goto(URLs.basket);
    await expect(basket.basketProductSummary).toBeVisible();
    const alert = page.getByTestId("basket-warnings");
    await alert.waitFor();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("This is a warning note");
    await alert.getByTestId("link-dismiss-all").click();
    await expect(alert).not.toBeVisible();
  });
});

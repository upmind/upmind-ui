import { test, expect } from "@playwright/test";
import { Basket } from "../../support/page-objects/templates/Basket";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/utils/functions/tokens";
import {
  getCurrentOrderId,
  addProductToOrder,
  overrideWarningNotes
} from "../../support/utils/functions/basket";
let basket: Basket;

test.describe("Basket - Displaying Warning Notes", () => {
  test.beforeEach(async ({ page, context }) => {
    basket = new Basket(page);
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    const token = await getSessionToken(context, "guest");
    const orderId = await getCurrentOrderId(token);
    await addProductToOrder(
      `${token}`,
      `${orderId}`,
      "20403869-6e54-721d-264c-518d9305e7d2",
      1,
      0,
      [],
      [],
      {},
      []
    );
  });
  test("Warning Notes Displayed", async ({ page }) => {
    await overrideWarningNotes(page, "This is a warning note");
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    const toast = page.getByRole("status");
    await toast.waitFor();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("This is a warning note");
    await toast.getByRole("button").click();
    await expect(toast).not.toBeVisible();
  });
});

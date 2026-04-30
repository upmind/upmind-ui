import { test, expect } from "@playwright/test";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import {
  createOrder,
  addProductToOrder,
  overrideWarningNotes
} from "../../support/api/basket";
import { waitForSessionCookie } from "../../support/helpers/session";
let basket: Basket;

test.describe("Basket - Displaying Warning Notes", () => {
  test.beforeEach(async ({ page, context }) => {
    basket = new Basket(page);
    await page.goto(URLs.basket);
    await waitForSessionCookie(context);
    const token = await getSessionToken(context);
    const order = await createOrder(token);
    const orderId = order.id;
    await addProductToOrder(
      `${token}`,
      `${orderId}`,
      "20403869-6e54-721d-264c-518d9305e7d2",
      1,
      0,
      [],
      [],
      {},
      [],
      true,
      false
    );
  });
  test("Warning Notes Displayed", async ({ page }) => {
    await overrideWarningNotes(page, "This is a warning note");
    await page.goto(URLs.basket);
    await expect(basket.basketProductSummary).toBeVisible();
    const toast = page.getByRole("status");
    await toast.waitFor();
    await expect(toast).toBeVisible();
    await expect(toast).toContainText("This is a warning note");
    await toast.getByRole("button").click();
    await expect(toast).not.toBeVisible();
  });
});

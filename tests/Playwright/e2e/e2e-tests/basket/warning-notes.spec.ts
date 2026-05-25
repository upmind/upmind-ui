import { test, expect } from "@playwright/test";
import { Basket } from "../../support/page-objects/templates/basket";
import { URLs } from "../../support/constants/urls";
import {
  getSessionToken,
  createOrder,
  addProductToOrder
} from "../../support/api/index";
import { overrideWarningNotes } from "../../support/mocks/orders";
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
    const alert = page.getByTestId("basket-alert");
    await alert.waitFor();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("This is a warning note");
    await alert.getByTestId("link-dismiss-all").click();
    await expect(alert).not.toBeVisible();
  });
});

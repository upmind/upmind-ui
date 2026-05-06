import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import { createOrder, addProductToOrder } from "../../support/api/basket";
import { waitForSessionCookie } from "../../support/helpers/session";
import { Basket } from "../../support/page-objects/templates/basket";

let basket: Basket;

test.describe("Basket Tests", () => {
  let token: string;
  let orderId: string | null;
  test.beforeEach(async ({ page }) => {
    basket = new Basket(page);
  });
  test("Basket with 1 item", async ({ page, context }) => {
    const domain = `${fakerEN_GB.string.alphanumeric({ length: { min: 3, max: 15 } })}.com`;
    await page.goto(URLs.basket);
    await waitForSessionCookie(context);
    token = await getSessionToken(context);
    let order = await createOrder(token);
    orderId = order.id;
    await addProductToOrder(
      token,
      orderId,
      "3de78642-de53-9714-76df-21208469530d",
      1,
      24,
      [],
      [],
      { domain: domain },
      [],
      true,
      false
    );
    await page.goto(URLs.basket);
    await expect(basket.basketProductSummary).toContainText("Shared Hosting");
    await expect(basket.basketProductSummary).toContainText(`${domain}`);
  });
  test("Empty basket", async ({ page }) => {
    await page.goto(URLs.basket);
    await expect(page.getByTestId("dialog-window")).toContainText(
      "Your basket is empty"
    );
  });
});

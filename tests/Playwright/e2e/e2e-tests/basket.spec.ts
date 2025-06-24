import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../support/constants/Urls";
import { getSessionToken } from "../support/utils/functions/tokens";
import {
  getCurrentOrderId,
  addProductToOrder,
} from "../support/utils/functions/basket";

test.describe("Basket Tests", () => {
  test("Basket with 1 item", async ({ page, context }) => {
    const domain = `${fakerEN_GB.string.alphanumeric({ length: { min: 3, max: 15 } })}.com`;
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    const token = await getSessionToken(context, "guest");
    const orderId = await getCurrentOrderId(token);
    //console.log(orderId);
    await addProductToOrder(
      token,
      orderId,
      "3de78642-de53-9714-76df-21208469530d",
      1,
      24,
      [],
      [],
      { domain: domain },
      []
    );
    await page.goto(URLs.basket);
    await expect(page.getByTestId("basket-product-summary")).toContainText(
      "Shared Hosting"
    );
    await expect(page.getByTestId("basket-product-summary")).toContainText(
      `${domain}`
    );
  });
  test("Empty basket", async ({ page, context }) => {
    await page.goto(URLs.basket);
    await expect(page.getByRole("dialog")).toContainText(
      "Your basket is empty"
    );
  });
});

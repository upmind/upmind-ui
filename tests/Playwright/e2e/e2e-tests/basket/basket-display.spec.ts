import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import {
  createOrder,
  addProductToOrder,
  getBasketProducts
} from "../../support/api/basket";
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
    // basket-product-name carries the in-basket product id in data-test-value;
    // read it from the order so the assertion targets the actual seeded line
    // rather than the (i18n) display name.
    const basketProducts = await getBasketProducts(token);
    const basketProductId = basketProducts[0].id;
    await page.goto(URLs.basket);
    await expect(basket.basketProductSummary).toBeVisible();
    const productName = basket.basketProductSummary.getByTestId(
      "basket-product-name"
    );
    await expect(productName).toBeVisible();
    await expect(productName).toHaveAttribute(
      "data-test-value",
      basketProductId
    );
  });
  test("Empty basket", async ({ page }) => {
    await page.goto(URLs.basket);
    // The basket-unavailable interstitial carries an explicit
    // `basket-empty-message` testid distinguishing it from other interstitial
    // (e.g. error) reasons that also render a `dialog-window`.
    await expect(page.getByTestId("basket-empty-message")).toBeVisible();
  });
});

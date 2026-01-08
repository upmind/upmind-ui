import { BrowserContext, Page } from "@playwright/test";
import { URLs } from "../constants/urls";
import { getSessionToken } from "./functions/tokens";
import {
  createOrder,
  addProductToOrder,
  addPromotionToOrder,
  setOrderCurrency
} from "./functions/basket";
import { fakerEN_GB } from "@faker-js/faker";
import { products } from "../constants/products";

export async function goToCheckout(
  page: Page,
  context: BrowserContext,
  promotion: string | null = null,
  currency: string | null = null
) {
  await page.goto(URLs.basket);
  await page.waitForLoadState("networkidle");
  let token = await getSessionToken(context);
  let orderId = await createOrder(token);
  await addProductToOrder(
    `${token}`,
    `${orderId}`,
    products.DOMAIN_REGISTRATION,
    1,
    24,
    [],
    [],
    {
      domain: `${fakerEN_GB.string.alphanumeric({
        length: { min: 3, max: 15 }
      })}.com`
    },
    []
  );
  if (promotion != null) {
    await addPromotionToOrder(orderId, promotion, token);
  }
  if (currency != null) {
    await setOrderCurrency(token, orderId, currency);
  }
  await page.goto(URLs.checkout);
}

import { fakerEN_GB } from "@faker-js/faker";
import type { BrowserContext, Page } from "@playwright/test";

import { getClientToken, getSessionToken } from "../api/auth";
import { addProductToOrder, createOrder, getCurrentOrder } from "../api/basket";
import { Logins } from "../constants/logins";
import { URLs } from "../constants/urls";
import type { ProductConfig } from "../page-objects/templates/product-config";
import { waitForSessionCookie } from "../helpers/session";

type ProductFixture = {
  id: string;
  billingCycle: number;
  type?: string;
};

export async function loginAsIncompleteCustomer(
  page: Page,
  context: BrowserContext
): Promise<string> {
  await page.goto(URLs.basket);
  await waitForSessionCookie(context);
  const session = await getClientToken(
    page,
    Logins.domain1.username,
    Logins.domain1.password
  );
  return session.access_token;
}

export async function seedInvalidProduct(
  product: ProductFixture,
  token: string,
  provisionFields: Record<string, unknown> = {
    sld: `${fakerEN_GB.string.alphanumeric({ length: 8 }).toLowerCase()}`
  }
): Promise<string> {
  const order = (await getCurrentOrder(token)) ?? (await createOrder(token));
  if (!order?.id) {
    throw new Error(
      `seedInvalidProduct: failed to obtain an order id from getCurrentOrder/createOrder ` +
        `(token prefix=${token?.slice(0, 8) ?? "<empty>"}...). ` +
        `Check staging auth/session establishment and POST /api/orders.`
    );
  }
  await addProductToOrder(
    token,
    order.id,
    product.id,
    1,
    product.billingCycle,
    [],
    [],
    provisionFields,
    [],
    false,
    false
  );
  return order.id;
}

export async function fillRegistrantDetails(
  productConfig: ProductConfig,
  overrides: { email?: string } = {}
) {
  await productConfig.enterRegistrantDetails({
    registrantPhone: "07111111111",
    registrantAddr1: fakerEN_GB.location.streetAddress(),
    registrantCity: fakerEN_GB.location.city(),
    registrantPostcode: fakerEN_GB.location.zipCode(),
    registrantCountryCode: "GB"
  });
}

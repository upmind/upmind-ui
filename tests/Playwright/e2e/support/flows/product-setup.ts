import { fakerEN_GB } from "@faker-js/faker";
import type { BrowserContext, Page } from "@playwright/test";
import type { IProduct, IProductOption } from "@upmind-automation/types";

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

/**
 * For each `required + multiple` option category on the raw product where the
 * machine cannot auto-select a default (single-select defaults are handled by
 * the product schema/parse pipeline — `buildSubproductGroupSchema` emits a
 * `default` / `const` and `useModelParser` writes it into the model; see
 * `product/schemas.ts` + `product/services.ts:284-286`. Multi-select requires
 * a user choice), click the first option (by `pivot.default desc`,
 * `pivot.order asc`) so form validation passes on submit.
 *
 * No-op for products without any `required + multiple` categories. Idempotent.
 * See FE-2781 for the wider schema-driven approach this is a tactical patch of.
 */
export async function selectRequiredMultiDefaults(
  page: Page,
  rawProduct: IProduct
): Promise<void> {
  const options = rawProduct.products_options ?? [];

  const byCategory = new Map<string, IProductOption[]>();
  for (const option of options) {
    const cat = option.category;
    if (!cat?.required || !cat?.multiple) continue;
    const arr = byCategory.get(option.category_id) ?? [];
    arr.push(option);
    byCategory.set(option.category_id, arr);
  }

  for (const opts of byCategory.values()) {
    const sorted = [...opts].sort((a, b) => {
      const defA = a.pivot?.default ?? 0;
      const defB = b.pivot?.default ?? 0;
      if (defA !== defB) return defB - defA;
      return (a.pivot?.order ?? 0) - (b.pivot?.order ?? 0);
    });
    const choice = sorted[0];
    if (!choice) continue;
    await page.getByRole("button", { name: choice.name }).first().click();
  }
}

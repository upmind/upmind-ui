import { fakerEN_GB } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import type { IProduct, IProductOption } from "@upmind-automation/types";

import { Logins } from "../constants/logins";
import { URLs } from "../constants/urls";
import type { ProductConfig } from "../page-objects/templates/product-config";
import { loginViaHeadless } from "./auth-setup";
import { addProductViaHeadless, clearBasketViaHeadless } from "./basket-setup";

type ProductFixture = {
  id: string;
  billingCycle: number;
  type?: string;
};

export async function loginAsIncompleteCustomer(page: Page): Promise<void> {
  await page.goto(URLs.basket);
  await loginViaHeadless(
    page,
    Logins.domain1.username,
    Logins.domain1.password
  );
  // Shared logged-in account: start every (serial) test from a clean basket so
  // seeded products are the only items. Deterministic because callers run
  // serially — no concurrent test can re-pollute between this clear and the seed.
  await clearBasketViaHeadless(page);
}

export async function seedInvalidProduct(
  page: Page,
  product: ProductFixture,
  provisionFields: Record<string, unknown> = {
    sld: `${fakerEN_GB.string.alphanumeric({ length: 8 }).toLowerCase()}`
  }
): Promise<{ basketId: string; basketProductId: string | null }> {
  // The basket is a singleton shared with the live app, so there is exactly one
  // basket per session — no order id to thread and no risk of a re-resolve
  // splitting products across two orders. Seeding with an invalid (unvalidated)
  // provision field keeps the funnel on products-setup.
  return addProductViaHeadless(page, {
    productId: product.id,
    billingCycleMonths: product.billingCycle,
    provisionFields,
    validateProvisionFields: false
  });
}

export async function fillRegistrantDetails(
  productConfig: ProductConfig,
  overrides: { email?: string } = {}
) {
  // Products-setup only renders the registrant fields still missing for this
  // account, which varies by saved profile — so fill whatever is actually shown
  // and proceed. The test asserts missing fields are recoverable and checkout is
  // reached, not which specific fields were missing.
  await productConfig.enterRegistrantDetails(
    {
      registrantName: fakerEN_GB.person.fullName(),
      registrantOrg: fakerEN_GB.company.name(),
      registrantEmail:
        overrides.email ??
        `nathan.robinson+${fakerEN_GB.string.alphanumeric({ length: 8 })}@upmind.com`,
      registrantPhone: "07111111111",
      registrantAddr1: fakerEN_GB.location.streetAddress(),
      registrantCity: fakerEN_GB.location.city(),
      registrantState: fakerEN_GB.location.state(),
      registrantPostcode: fakerEN_GB.location.zipCode(),
      registrantCountryCode: "GB"
    },
    { ignoreNotVisible: true }
  );
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
    // CheckboxCards (required + multiple) tag each option with its stable
    // `value="${opt.id}"`; target that, not the translated option name. The
    // primitive's `checkbox-item-${kebabCase(label)}` fallback is locale-unstable.
    await page
      .getByTestId("checkbox-group")
      .locator(`[value="${choice.id}"]`)
      .first()
      .click();
  }
}

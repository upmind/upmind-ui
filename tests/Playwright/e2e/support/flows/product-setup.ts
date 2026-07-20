import { fakerEN_GB } from "@faker-js/faker";
import type { Page } from "@playwright/test";

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

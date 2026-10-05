import { test, expect } from "@playwright/test";
import type { Page, Request } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Registration } from "../../../support/page-objects/templates/registration";
import { interceptConfigValues } from "../../../support/mocks/brand";
import { seedGuestBasket } from "../../../support/flows/guest-checkout";
import { products } from "../../../support/constants/products";
import { URLs } from "../../../support/constants/urls";

/**
 * @fileoverview FE-3274 — billing details saved after checkout-page
 * registration are applied to the order.
 * Feature: tests/Playwright/features/checkout/checkout-registration-phone.feature
 *
 * ## Job To Be Done
 * A guest who registers from checkout and then saves a billing address or a
 * company must have it set on the basket straight away, whether or not the
 * brand asked for a phone at registration.
 *
 * ## What Breaks If These Fail
 * The address or company is saved to the client but never written to the
 * basket, so checkout cannot continue until the shopper refreshes the page.
 */

const ADDRESS_SAVE = /\/api\/clients\/[^/]+\/addresses(\?|$)/;
const COMPANY_SAVE = /\/api\/clients\/[^/]+\/companies(\?|$)/;
const BASKET_WRITE = /\/api\/orders\/[^/?]+(\?|$)/;
const BILLING_ADDRESS = {
  line1: "1 High Street",
  city: "Hull",
  postcode: "HU15 1EG"
};

type BasketField = "address_id" | "company_id";

async function registerFromCheckout(
  page: Page,
  phone: string | undefined
): Promise<Request[]> {
  const registration = new Registration(page, page.context());

  await seedGuestBasket(page, products.STARTER_HOSTING);
  await page.goto(URLs.checkout);
  await registration.submitRegistration(phone);
  await page.waitForURL(URLs.checkout);

  const basketWrites: Request[] = [];
  page.on("request", request => {
    if (request.method() === "PUT" && BASKET_WRITE.test(request.url()))
      basketWrites.push(request);
  });
  return basketWrites;
}

function savedId(page: Page, endpoint: RegExp): Promise<string> {
  return page
    .waitForResponse(
      response =>
        endpoint.test(response.url()) &&
        response.request().method() === "POST" &&
        response.ok()
    )
    .then(async response => (await response.json()).data.id);
}

async function expectBasketWrite(
  basketWrites: Request[],
  field: BasketField,
  id: string
) {
  await expect
    .poll(() => basketWrites.map(request => request.postDataJSON()?.[field]), {
      timeout: 15000
    })
    .toContain(id);
  const basketWrite = basketWrites.find(
    request => request.postDataJSON()?.[field] === id
  );
  expect((await basketWrite?.response())?.ok()).toBe(true);
}

async function saveNewAddress(page: Page): Promise<string> {
  const checkout = new Checkout(page);
  const addressId = savedId(page, ADDRESS_SAVE);
  await checkout.manuallyInputAddress(
    BILLING_ADDRESS.line1,
    BILLING_ADDRESS.city,
    BILLING_ADDRESS.postcode,
    null
  );
  await checkout.clickSaveDetails();
  return addressId;
}

test.describe("Checkout - Billing details saved after registering at checkout", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  test("An address saved after registering with a required phone is applied to the order @FE-3274", async ({
    page
  }) => {
    await interceptConfigValues(page, {
      requirePhoneOnRegistration: true
    });
    const basketWrites = await registerFromCheckout(page, "07911123456");

    const addressId = await saveNewAddress(page);

    await expectBasketWrite(basketWrites, "address_id", addressId);
  });

  test("An address saved after registering without a phone is applied to the order @FE-3274", async ({
    page
  }) => {
    await interceptConfigValues(page, {
      requirePhoneOnRegistration: false
    });
    const basketWrites = await registerFromCheckout(page, undefined);

    const addressId = await saveNewAddress(page);

    await expectBasketWrite(basketWrites, "address_id", addressId);
  });

  test("A company saved after registering with a required phone is applied to the order @FE-3274", async ({
    page
  }) => {
    await interceptConfigValues(page, {
      requirePhoneOnRegistration: true
    });
    const basketWrites = await registerFromCheckout(page, "07911123456");
    const checkout = new Checkout(page);

    const companyId = savedId(page, COMPANY_SAVE);
    await checkout.saveNewCompany(
      fakerEN_GB.company.name(),
      fakerEN_GB.string.numeric({ length: 9 }),
      BILLING_ADDRESS
    );

    await expectBasketWrite(basketWrites, "company_id", await companyId);
  });
});

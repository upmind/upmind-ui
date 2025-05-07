import { test, expect, Page } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import {
  DefaultPaymentTerms,
  DefaultPaymentTermsWithPromo,
} from "../../../support/constants/DefaultPaymentTerms";

let checkout: Checkout;
let terms = DefaultPaymentTerms;
let termsWithPromo = DefaultPaymentTermsWithPromo;

async function setBillingTerm(
  page: Page,
  billingTerm: number,
  productId: string
) {
  await page.route(`**/api/basket/products/${productId}*`, async route => {
    const response = await route.fetch();
    let body = await response.text();
    body = body.replace(
      /"default_payment_period"\s*:\s*\d+/g,
      `"default_payment_period": ${billingTerm}`
    );
    await route.fulfill({
      status: response.status(),
      headers: {
        ...response.headers(),
        "content-type": "application/json",
      },
      body,
    });
  });
}

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
});

test.describe("Assert correct billing term is selected based on default_payment_period value @default-terms", async () => {
  for (const { name, termSetting, radioGroup, radioOption } of terms) {
    test(name, async ({ page }) => {
      setBillingTerm(page, termSetting, "5d085e69-d562-3719-7d6f-218e940d4237");
      await page.goto(URLs.starterHosting);
      await page.waitForLoadState("networkidle");

      const radioCardItem = checkout.radioButtons.getRadioButton(
        radioGroup,
        radioOption
      );
      const button = radioCardItem.locator("label > div > button");
      await expect(button).toHaveAttribute("data-state", "checked");
    });
  }
});

test.describe("Assert that billing term functionality accounts for promotional discounts @default-terms @promotions", async () => {
  for (const { name, termSetting, radioGroup, radioOption } of termsWithPromo) {
    test(name, async ({ page }) => {
      setBillingTerm(page, termSetting, "20403869-6e54-721d-254a-518d9305e7d2");
      await page.goto(URLs.billingTermsPromo);
      await page.waitForLoadState("networkidle");

      const radioCardItem = checkout.radioButtons.getRadioButton(
        radioGroup,
        radioOption
      );
      const button = radioCardItem.locator("label > div > button");
      await expect(button).toHaveAttribute("data-state", "checked");
    });
  }
});

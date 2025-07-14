import { test, expect, Page } from "@playwright/test";
import { ProductConfig } from "../../../support/page-objects/templates/ProductConfig";
import {
  DefaultPaymentTerms,
  DefaultPaymentTermsWithPromo
} from "../../../support/constants/DefaultPaymentTerms";

let productConfig: ProductConfig;
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
        "content-type": "application/json"
      },
      body
    });
  });
}

test.beforeEach(async ({ page }) => {
  productConfig = new ProductConfig(page);
});

test.describe("Assert correct billing term is selected based on default_payment_period value @default-terms", async () => {
  for (const { name, termSetting, radioGroup, radioOption, url } of terms) {
    test(name, async ({ page }) => {
      setBillingTerm(page, termSetting, "20403869-6e54-721d-2d7c-518d9305e7d2");
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      const radioCardItem = productConfig.radioButtons.getRadioButton(
        radioGroup,
        radioOption
      );
      const button = radioCardItem.locator("label > div > button");
      await expect(button).toHaveAttribute("data-state", "checked");
    });
  }
});

test.describe("Assert that billing term functionality accounts for promotional discounts @default-terms @promotions", async () => {
  for (const {
    name,
    termSetting,
    radioGroup,
    radioOption,
    url
  } of termsWithPromo) {
    test(name, async ({ page }) => {
      setBillingTerm(page, termSetting, "3de78642-de53-9714-745c-21208469530d");
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      const radioCardItem = productConfig.radioButtons.getRadioButton(
        radioGroup,
        radioOption
      );
      const button = radioCardItem.locator("label > div > button");
      await expect(button).toHaveAttribute("data-state", "checked");
    });
  }
});

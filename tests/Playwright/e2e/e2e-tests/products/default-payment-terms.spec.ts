import { test, expect, BrowserContext, Page } from "@playwright/test";
import { ProductConfig } from "../../support/page-objects/templates/ProductConfig";
import {
  DefaultPaymentTerms,
  DefaultPaymentTermsWithPromo
} from "../../support/constants/DefaultPaymentTerms";

// const test = base.extend<{
//   context: BrowserContext;
//   page: Page;
// }>({
//   context: async ({ browser }, use) => {
//     const context = await browser.newContext();
//     await use(context);
//     await context.close();
//   },
//   page: async ({ context }, use) => {
//     const page = await context.newPage();
//     await use(page);
//   }
// });

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

test.describe("Assert correct billing term is selected based on default_payment_period value @default-terms", () => {
  for (const { name, termSetting, radioGroup, radioOption, url } of terms) {
    test(name, async ({ page }) => {
      const productConfig = new ProductConfig(page);
      await setBillingTerm(
        page,
        termSetting,
        "20403869-6e54-721d-2d7c-518d9305e7d2"
      );
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      const radioCardItem = productConfig.radioButtons.getRadioButton(
        radioGroup,
        radioOption
      );
      await expect(radioCardItem).toHaveAttribute("data-state", "checked");
    });
  }
});

test.describe("Assert that billing term functionality accounts for promotional discounts @default-terms @promotions", () => {
  for (const {
    name,
    termSetting,
    radioGroup,
    radioOption,
    url
  } of termsWithPromo) {
    test(name, async ({ page }) => {
      const productConfig = new ProductConfig(page);

      await setBillingTerm(
        page,
        termSetting,
        "3de78642-de53-9714-745c-21208469530d"
      );
      await page.goto(url);
      await page.waitForLoadState("networkidle");

      const radioCardItem = productConfig.radioButtons.getRadioButton(
        radioGroup,
        radioOption
      );
      await expect(radioCardItem).toHaveAttribute("data-state", "checked");
    });
  }
});

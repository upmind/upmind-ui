import { test, expect } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { DefaultPaymentTerms } from "../../../support/constants/DefaultPaymentTerms";
let checkout: Checkout;
let terms = DefaultPaymentTerms;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
});

test.describe("Assert correct radio button is selected based on default_payment_period value @default-terms", () => {
  for (const { name, termSetting, radioGroup, radioOption } of terms) {
    test(name, async ({ page }) => {
      await page.route(
        "**/api/basket/products/5d085e69-d562-3719-7d6f-218e940d4237*",
        async route => {
          const response = await route.fetch();
          let body = await response.text();
          body = body.replace(
            /"default_payment_period"\s*:\s*\d+/g,
            `"default_payment_period": ${termSetting}`
          );
          await route.fulfill({
            status: response.status(),
            headers: {
              ...response.headers(),
              "content-type": "application/json",
            },
            body,
          });
        }
      );
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

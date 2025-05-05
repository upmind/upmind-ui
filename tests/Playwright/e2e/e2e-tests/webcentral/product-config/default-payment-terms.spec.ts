import { test, expect } from "@playwright/test";
import { URLs } from "../../../support/constants/urls";
import { Checkout } from "../../../support/page-objects/templates/Checkout";
import { DefaultPaymentTerms } from "../../../support/constants/DefaultPaymentTerms";

let checkout: Checkout;
let terms = DefaultPaymentTerms;

test.beforeEach(async ({ page }) => {
  checkout = new Checkout(page);
});

test.describe("Assert correct radio button is selected based on default_payment_period value @default-terms", async () => {
  for (const {
    name,
    termSetting,
    radioGroup,
    radioOption,
    promotion,
  } of terms) {
    test(name, async ({ page }) => {
      await page.route(
        "**/api/basket/products/5d085e69-d562-3719-7d6f-218e940d4237*",
        async route => {
          const response = await route.fetch();
          let body = await response.text();
          console.log("Original body:", body);
          body = body.replace(
            /"default_payment_period"\s*:\s*\d+/g,
            `"default_payment_period": ${termSetting}`
          );

          if (promotion) {
            body = body.replace(
              /"prices"\s*:\s*\{[^}]*\}/g,
              `"prices": ${promotion}`
            );
          }

          await route.fulfill({
            status: response.status(),
            headers: {
              ...response.headers(),
              "content-type": "application/json",
            },
            body,
          });
          console.log("Modified body:", body);
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

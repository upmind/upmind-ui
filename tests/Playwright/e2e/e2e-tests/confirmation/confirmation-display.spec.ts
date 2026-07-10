import { expect } from "@playwright/test";
import { registeredUser, newUser } from "../../support/fixtures/auth-context";
import { goToCheckout } from "../../support/flows/checkout";
import { products } from "../../support/constants/products";
import { Logins } from "../../support/constants/logins";
import { gateways } from "../../support/constants/gateways";

newUser.describe("Confirmation Page Display - New Users", () => {
  newUser.describe.configure({ mode: "parallel" });
  newUser(
    "Successful Paid Order (New Card)",
    async ({ page, checkout, confirmation }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.completeCheckout.click();
      await checkout.completeCheckout.click();
      await page.waitForURL(`/order/**/?payment_success=true`);
      await expect(confirmation.invoiceNumberHeading).toBeVisible();
      await expect(confirmation.invoiceNumber).toBeVisible();
      await confirmation.expectInvoiceNumberValue();
      await expect(confirmation.orderDateHeading).toBeVisible();
      await expect(confirmation.orderDate).toBeVisible();
      await confirmation.expectOrderDateValue();
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(confirmation.detailsRowPrice).toBeVisible();
      await expect(confirmation.detailsRowQty).toBeVisible();
      await expect(confirmation.detailsRowTotal).toBeVisible();
      await confirmation.expectFirstRowQty("1");
      await confirmation.expectFirstRowPriceValue(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
  newUser("Successful Free Order", async ({ page, checkout, confirmation }) => {
    await goToCheckout(page, products.FREE_HOSTING, null, null);
    await checkout.completeCheckout.click();
    await page.waitForURL(`/order/**/?payment_success=true`);
    await expect(confirmation.invoiceNumberHeading).toBeVisible();
    await expect(confirmation.invoiceNumber).toBeVisible();
    await confirmation.expectInvoiceNumberValue();
    await expect(confirmation.orderDateHeading).toBeVisible();
    await expect(confirmation.orderDate).toBeVisible();
    await confirmation.expectOrderDateValue();
    await expect(confirmation.orderDetails).toBeVisible();
    await expect(confirmation.detailsRowPrice).toBeVisible();
    await expect(confirmation.detailsRowQty).toBeVisible();
    await expect(confirmation.detailsRowTotal).toBeVisible();
    await confirmation.expectFirstRowQty("1");
    await confirmation.expectFirstRowPriceValue(products.FREE_HOSTING.gbpPrice);
  });
  newUser(
    "Successful Order with Promo",
    async ({ page, checkout, confirmation }) => {
      await goToCheckout(page, products.STARTER_HOSTING, "genericpromo", null);
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`/order/**/?payment_success=true`);
      await expect(confirmation.invoiceNumberHeading).toBeVisible();
      await expect(confirmation.invoiceNumber).toBeVisible();
      await confirmation.expectInvoiceNumberValue();
      await expect(confirmation.orderDateHeading).toBeVisible();
      await expect(confirmation.orderDate).toBeVisible();
      await confirmation.expectOrderDateValue();
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(confirmation.detailsRowPrice).toBeVisible();
      await expect(confirmation.detailsRowQty).toBeVisible();
      await expect(confirmation.detailsRowTotal).toBeVisible();
      await confirmation.expectFirstRowQty("1");
      // Unit price is altered by the promo (discount not known at authoring
      // time), so assert the row value carries what the user is shown.
      await confirmation.expectFirstRowPriceMatchesDisplay();
    }
  );
  // TODO: add coverage for "Successful Order with Multiple Taxes" once a
  // dedicated test user with multi-tax address is provisioned.
  newUser(
    "Unsuccessful Payment on Order",
    async ({ page, checkout, confirmation }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4000000000009995", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`/order/**/?payment_success=false`);
      await expect(confirmation.invoiceNumberHeading).toBeVisible();
      await expect(confirmation.invoiceNumber).toBeVisible();
      await confirmation.expectInvoiceNumberValue();
      await expect(confirmation.orderDateHeading).toBeVisible();
      await expect(confirmation.orderDate).toBeVisible();
      await confirmation.expectOrderDateValue();
      // Failed payment surfaces the retry/failed confirmation alert; its title
      // and body are translated copy, so target the alert testid and read the
      // stable failure state via data-test-value.
      const failedAlert = page.getByTestId("confirmation-payment-alert");
      await expect(failedAlert).toBeVisible();
      await expect(failedAlert).toHaveAttribute("data-test-value", "failed");
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(confirmation.detailsRowPrice).toBeVisible();
      await expect(confirmation.detailsRowQty).toBeVisible();
      await expect(confirmation.detailsRowTotal).toBeVisible();
      await confirmation.expectFirstRowQty("1");
      await confirmation.expectFirstRowPriceValue(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
  newUser("Pay Later on Order", async ({ page, checkout, confirmation }) => {
    await goToCheckout(page, products.STARTER_HOSTING, null, null);
    await checkout.selectPayLater();
    await checkout.completeCheckout.click();
    await page.waitForURL(`/order/**/?payment_success=true`);
    await expect(confirmation.invoiceNumberHeading).toBeVisible();
    await expect(confirmation.invoiceNumber).toBeVisible();
    await confirmation.expectInvoiceNumberValue();
    await expect(confirmation.orderDateHeading).toBeVisible();
    await expect(confirmation.orderDate).toBeVisible();
    await confirmation.expectOrderDateValue();
    await expect(confirmation.orderDetails).toBeVisible();
    await expect(confirmation.detailsRowPrice).toBeVisible();
    await expect(confirmation.detailsRowQty).toBeVisible();
    await expect(confirmation.detailsRowTotal).toBeVisible();
    await confirmation.expectFirstRowQty("1");
    await confirmation.expectFirstRowPriceValue(
      products.STARTER_HOSTING.gbpPrice
    );
  });
  newUser(
    "Successful Partial Payment on Order",
    async ({ page, checkout, confirmation }) => {
      await goToCheckout(page, products.STARTER_HOSTING, null, null);
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      // `pay-amount-value` carries the formatted amount in data-test-value,
      // separated from the translated "Pay" copy.
      await expect(checkout.payAmount).toBeVisible();
      await expect(checkout.payAmount).toHaveAttribute(
        "data-test-value",
        "£20.00"
      );
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`**/order/**/?payment_success=true`);
      await expect(confirmation.invoiceNumberHeading).toBeVisible();
      await expect(confirmation.invoiceNumber).toBeVisible();
      await confirmation.expectInvoiceNumberValue();
      await expect(confirmation.orderDateHeading).toBeVisible();
      await expect(confirmation.orderDate).toBeVisible();
      await confirmation.expectOrderDateValue();
      // Partial payment surfaces the outstanding-balance secondary alert; its
      // copy (incl. the remaining amount) is translated/dynamic, so target the
      // alert testid and read the stable state via data-test-value.
      const outstandingAlert = page.getByTestId(
        "confirmation-payment-secondary-alert"
      );
      await expect(outstandingAlert).toBeVisible();
      await expect(outstandingAlert).toHaveAttribute(
        "data-test-value",
        "outstanding"
      );
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(confirmation.detailsRowPrice).toBeVisible();
      await expect(confirmation.detailsRowQty).toBeVisible();
      await expect(confirmation.detailsRowTotal).toBeVisible();
      await confirmation.expectFirstRowQty("1");
      await confirmation.expectFirstRowPriceValue(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
});
registeredUser.describe("Confirmation Page Display - Existing Users", () => {
  registeredUser(
    "Successful Paid Order (Existing Card)",
    async ({ page, checkout, confirmation, loginAs }) => {
      await loginAs(Logins.stripeCard.username, Logins.stripeCard.password);
      await goToCheckout(page, products.STARTER_HOSTING, null, null, false);
      await checkout.selectFirstStoredPaymentMethod();
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`/order/**/?payment_success=true`);
      await expect(confirmation.invoiceNumberHeading).toBeVisible();
      await expect(confirmation.invoiceNumber).toBeVisible();
      await confirmation.expectInvoiceNumberValue();
      await expect(confirmation.orderDateHeading).toBeVisible();
      await expect(confirmation.orderDate).toBeVisible();
      await confirmation.expectOrderDateValue();
      // The payment-method row's visible copy is the translated "Visa ending
      // 4242"; the stable card last4 is carried in data-test-value. The stored
      // card for this user is the 4242…4242 Visa test card.
      await expect(confirmation.orderPaymentMethodHeading).toBeVisible();
      await expect(confirmation.orderPaymentMethod).toBeVisible();
      await confirmation.expectPaymentMethodLast4("4242");
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(confirmation.detailsRowPrice).toBeVisible();
      await expect(confirmation.detailsRowQty).toBeVisible();
      await expect(confirmation.detailsRowTotal).toBeVisible();
      await confirmation.expectFirstRowQty("1");
      await confirmation.expectFirstRowPriceValue(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
});

import { expect } from "@playwright/test";
import { registeredUser, newUser } from "../../support/fixtures/auth-context";
import { goToCheckout } from "../../support/flows/checkout";
import { getFormattedDate } from "../../support/helpers";
import { products } from "../../support/constants/products";
import { Logins } from "../../support/constants/logins";
import { getCurrentOrder, getInvoice } from "../../support/api/index";

newUser.describe("Confirmation Page Display - New Users", () => {
  newUser.describe.configure({ mode: "parallel" });
  newUser(
    "Successful Paid Order (New Card)",
    async ({ page, context, checkout, confirmation, token }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`/order/**/?payment_success=true`);
      let invoice = await getInvoice(token, orderId);
      let invoiceNumber = invoice?.number;
      let date = getFormattedDate();
      await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
      await expect(confirmation.invoiceNumber).toContainText(
        `${invoiceNumber}`
      );
      await expect(confirmation.orderDateHeading).toContainText(
        "Purchase date"
      );
      await expect(confirmation.orderDate).toContainText(`${date}`);
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(
        confirmation.productNameVisible(products.STARTER_HOSTING.name)
      ).toBeTruthy();
      await expect(confirmation.detailsRowPrice).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
      await expect(confirmation.detailsRowQty).toContainText("1");
      await expect(confirmation.detailsRowTotal).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
  newUser(
    "Successful Free Order",
    async ({ page, context, checkout, confirmation, token }) => {
      await goToCheckout(page, context, products.FREE_HOSTING, null, null);
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await checkout.placeOrder.click();
      await page.waitForURL(`/order/**/?payment_success=true`);
      let invoice = await getInvoice(token, orderId);
      let invoiceNumber = invoice?.number;
      let date = getFormattedDate();
      await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
      await expect(confirmation.invoiceNumber).toContainText(
        `${invoiceNumber}`
      );
      await expect(confirmation.orderDateHeading).toContainText(
        "Purchase date"
      );
      await expect(confirmation.orderDate).toContainText(`${date}`);
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(
        confirmation.productNameVisible(products.STARTER_HOSTING.name)
      ).toBeTruthy();
      await expect(confirmation.detailsRowPrice).toContainText("£0.00");
      await expect(confirmation.detailsRowQty).toContainText("1");
      await expect(confirmation.detailsRowTotal).toContainText("£0.00");
    }
  );
  newUser(
    "Successful Order with Promo",
    async ({ page, context, checkout, confirmation, token }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "genericpromo",
        null
      );
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`/order/**/?payment_success=true`);
      let invoice = await getInvoice(token, orderId);
      console.log(invoice);
      let invoiceNumber = invoice?.number;
      let date = getFormattedDate();
      await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
      await expect(confirmation.invoiceNumber).toContainText(
        `${invoiceNumber}`
      );
      await expect(confirmation.orderDateHeading).toContainText(
        "Purchase date"
      );
      await expect(confirmation.orderDate).toContainText(`${date}`);
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(
        confirmation.productNameVisible(products.STARTER_HOSTING.name)
      ).toBeTruthy();
      await expect(confirmation.detailsRowPrice).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
      await expect(confirmation.detailsRowQty).toContainText("1");
      await expect(confirmation.detailsRowTotal).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
  newUser.skip(
    "Successful Order with Multiple Taxes",
    async ({ page, context }) => {
      //TODO: Need a new tax setup for this, potentially a specific user with the right address already set up
    }
  );
  newUser(
    "Unsuccessful Payment on Order",
    async ({ page, context, checkout, confirmation, token }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4000000000009995", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`/order/**/?payment_success=false`);
      let invoice = await getInvoice(token, orderId);
      let invoiceNumber = invoice?.number;
      let date = getFormattedDate();
      await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
      await expect(confirmation.invoiceNumber).toContainText(
        `${invoiceNumber}`
      );
      await expect(confirmation.orderDateHeading).toContainText(
        "Purchase date"
      );
      await expect(confirmation.orderDate).toContainText(`${date}`);
      await expect(
        page
          .getByRole("alert")
          .getByText("Payment for this order is still due in full")
      ).toBeVisible();
      await expect(
        page
          .getByRole("alert")
          .getByText(
            "Unfortunately, your previous payment attempt was unsuccessful - this can be for a number of reasons. Please try again using an alternative method."
          )
      ).toBeVisible();
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(
        confirmation.productNameVisible(products.STARTER_HOSTING.name)
      ).toBeTruthy();
      await expect(confirmation.detailsRowPrice).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
      await expect(confirmation.detailsRowQty).toContainText("1");
      await expect(confirmation.detailsRowTotal).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
  newUser(
    "Pay Later on Order",
    async ({ page, context, checkout, confirmation, token }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await checkout.selectPaymentMethod("Pay Later");
      await checkout.placeOrder.click();
      await page.waitForURL(`/order/**/?payment_success=true`);
      let invoice = await getInvoice(token, orderId);
      let invoiceNumber = invoice?.number;
      let date = getFormattedDate();
      await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
      await expect(confirmation.invoiceNumber).toContainText(
        `${invoiceNumber}`
      );
      await expect(confirmation.orderDateHeading).toContainText(
        "Purchase date"
      );
      await expect(confirmation.orderDate).toContainText(`${date}`);
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(
        confirmation.productNameVisible(products.STARTER_HOSTING.name)
      ).toBeTruthy();
      await expect(confirmation.detailsRowPrice).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
      await expect(confirmation.detailsRowQty).toContainText("1");
      await expect(confirmation.detailsRowTotal).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
  newUser(
    "Successful Partial Payment on Order",
    async ({ page, context, checkout, confirmation, token }) => {
      await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await checkout.changeAmountButton.click();
      await checkout.changeAmountInput.fill("20");
      await checkout.clickConfirmAmount();
      await expect(checkout.payAmount).toHaveText("Pay £20.00");
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`**/order/**/?payment_success=true`);
      let invoice = await getInvoice(token, orderId);
      let invoiceNumber = invoice?.number;
      let date = getFormattedDate();
      let outstandingBalance = invoice?.unpaid_amount_formatted;
      await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
      await expect(confirmation.invoiceNumber).toContainText(
        `${invoiceNumber}`
      );
      await expect(confirmation.orderDateHeading).toContainText(
        "Purchase date"
      );
      await expect(confirmation.orderDate).toContainText(`${date}`);
      await expect(
        page.getByRole("alert").getByText("Payment outstanding")
      ).toBeVisible();
      await expect(
        page
          .getByRole("alert")
          .getByText(
            `You have ${outstandingBalance} remaining. Please complete your payment to finish your order.`
          )
      ).toBeVisible();
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(
        confirmation.productNameVisible(products.STARTER_HOSTING.name)
      ).toBeTruthy();
      await expect(confirmation.detailsRowPrice).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
      await expect(confirmation.detailsRowQty).toContainText("1");
      await expect(confirmation.detailsRowTotal).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
});
registeredUser.describe("Confirmation Page Display - Existing Users", () => {
  registeredUser(
    "Successful Paid Order (Existing Card)",
    async ({ page, context, checkout, confirmation, loginAs }) => {
      const session = await loginAs(
        Logins.stripeCard.username,
        Logins.stripeCard.password
      );
      const token = session.access_token;
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await checkout.selectPaymentMethod("Saved Card 1");
      await checkout.clickCompleteCheckout();
      await page.waitForURL(`/order/**/?payment_success=true`);
      let invoice = await getInvoice(token, orderId);
      let invoiceNumber = invoice?.number;
      let date = getFormattedDate();
      await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
      await expect(confirmation.invoiceNumber).toContainText(
        `${invoiceNumber}`
      );
      await expect(confirmation.orderDateHeading).toContainText(
        "Purchase date"
      );
      await expect(confirmation.orderDate).toContainText(`${date}`);
      await expect(confirmation.orderPaymentMethodHeading).toContainText(
        "Payment method"
      );
      await expect(confirmation.orderPaymentMethod).toContainText(
        "Visa ending 4242"
      );
      await expect(confirmation.orderDetails).toBeVisible();
      await expect(
        confirmation.productNameVisible(products.STARTER_HOSTING.name)
      ).toBeTruthy();
      await expect(confirmation.detailsRowPrice).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
      await expect(confirmation.detailsRowQty).toContainText("1");
      await expect(confirmation.detailsRowTotal).toContainText(
        products.STARTER_HOSTING.gbpPrice
      );
    }
  );
});

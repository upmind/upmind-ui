import { expect } from "@playwright/test";
import { authenticatedUserTest as test } from "../../support/fixtures/auth-context";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Registration } from "../../support/page-objects/templates/registration";
import { Confirmation } from "../../support/page-objects/templates/confirmation";
import { goToCheckout } from "../../support/flows/checkout";
import { getCurrentOrder, getInvoice } from "../../support/api/basket";
import { getSessionToken } from "../../support/api/auth";
import { getFormattedDate } from "../../support/helpers";
import { products } from "../../support/constants/products";
import { Logins } from "../../support/constants/logins";
import { URLs } from "../../support/constants/urls";

let checkout: Checkout;
let register: Registration;
let confirmation: Confirmation;

//TODO: Update the tests to account for the different messaging on different order states (e.g. 'We received £20')
test.describe("Confirmation Page Display", () => {
  test.beforeEach(({ page, context }) => {
    checkout = new Checkout(page);
    register = new Registration(page, context);
    confirmation = new Confirmation(page);
  });
  test("Successful Paid Order (New Card)", async ({ page, context }) => {
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await register.inputRegistration();
    await checkout.selectPaymentMethod("Stripe");
    await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
    await checkout.clickPlaceOrderAndPay();
    let token = await getSessionToken(context);
    let order = await getCurrentOrder(token);
    let orderId = order?.id;
    await page.waitForURL(`/order/${orderId}/?payment_success=true`);
    let invoice = await getInvoice(token, orderId);
    let invoiceNumber = invoice?.number;
    let date = getFormattedDate();
    await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
    await expect(confirmation.invoiceNumber).toContainText(`${invoiceNumber}`);
    await expect(confirmation.orderDateHeading).toContainText("Purchase date");
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
  });
  test("Successful Paid Order (Existing Card)", async ({
    authenticatedPage
  }) => {
    const authedPage = await authenticatedPage({
      username: Logins.existingMethodUser.username,
      password: Logins.existingMethodUser.password
    });
    const authedContext = authedPage.context();
    checkout = new Checkout(authedPage);
    confirmation = new Confirmation(authedPage);

    await goToCheckout(
      authedPage,
      authedContext,
      products.STARTER_HOSTING,
      null,
      null
    );
    await register.inputRegistration();
    await checkout.selectPaymentMethod("Visa ending 4242");
    await checkout.clickPlaceOrderAndPay();
    let token = await getSessionToken(authedContext);
    let order = await getCurrentOrder(token);
    let orderId = order?.id;
    await authedPage.waitForURL(`/order/${orderId}/?payment_success=true`);
    let invoice = await getInvoice(token, orderId);
    let invoiceNumber = invoice?.number;
    let date = getFormattedDate();
    await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
    await expect(confirmation.invoiceNumber).toContainText(`${invoiceNumber}`);
    await expect(confirmation.orderDateHeading).toContainText("Purchase date");
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
  });
  test("Successful Free Order", async ({ page, context }) => {
    await goToCheckout(page, context, products.FREE_HOSTING, null, null);
    await register.inputRegistration();
    await checkout.placeOrder.click();
    let token = await getSessionToken(context);
    let order = await getCurrentOrder(token);
    let orderId = order?.id;
    await page.waitForURL(`/order/${orderId}/?payment_success=true`);
    let invoice = await getInvoice(token, orderId);
    let invoiceNumber = invoice?.number;
    let date = getFormattedDate();
    await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
    await expect(confirmation.invoiceNumber).toContainText(`${invoiceNumber}`);
    await expect(confirmation.orderDateHeading).toContainText("Purchase date");
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
  });
  test("Successful Order with Promo", async ({ page, context }) => {
    await goToCheckout(
      page,
      context,
      products.STARTER_HOSTING,
      "genericpromo",
      null
    );
    await register.inputRegistration();
    await checkout.selectPaymentMethod("Stripe");
    await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
    await checkout.clickPlaceOrderAndPay();
    let token = await getSessionToken(context);
    let order = await getCurrentOrder(token);
    let orderId = order?.id;
    await page.waitForURL(`/order/${orderId}/?payment_success=true`);
    let invoice = await getInvoice(token, orderId);
    let invoiceNumber = invoice?.number;
    let date = getFormattedDate();
    await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
    await expect(confirmation.invoiceNumber).toContainText(`${invoiceNumber}`);
    await expect(confirmation.orderDateHeading).toContainText("Purchase date");
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
  });
  test("Successful Order with Multiple Taxes", async ({ page, context }) => {
    //TODO: Need a new tax setup for this, potentially a specific user with the right address already set up
  });
  test("Unsuccessful Payment on Order", async ({ page, context }) => {
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await register.inputRegistration();
    await checkout.selectPaymentMethod("Stripe");
    await checkout.inputStripeDetails("4000000000009995", "12/50", "123");
    await checkout.clickPlaceOrderAndPay();
    let token = await getSessionToken(context);
    let order = await getCurrentOrder(token);
    let orderId = order?.id;
    await page.waitForURL(`/order/${orderId}/?payment_success=false`);
    let invoice = await getInvoice(token, orderId);
    let invoiceNumber = invoice?.number;
    let date = getFormattedDate();
    await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
    await expect(confirmation.invoiceNumber).toContainText(`${invoiceNumber}`);
    await expect(confirmation.orderDateHeading).toContainText("Purchase date");
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
          "Unfortunately, your previous payment attempt was unsuccessful. Please try again using an alternative method."
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
  });
  test("Pay Later on Order", async ({ page, context }) => {
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await register.inputRegistration();
    await checkout.selectPaymentMethod("Pay Later");
    await checkout.placeOrder.click();
    let token = await getSessionToken(context);
    let order = await getCurrentOrder(token);
    let orderId = order?.id;
    await page.waitForURL(`/order/${orderId}/?payment_success=true`);
    let invoice = await getInvoice(token, orderId);
    let invoiceNumber = invoice?.number;
    let date = getFormattedDate();
    await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
    await expect(confirmation.invoiceNumber).toContainText(`${invoiceNumber}`);
    await expect(confirmation.orderDateHeading).toContainText("Purchase date");
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
  });
  test("Successful Partial Payment on Order", async ({ page, context }) => {
    await goToCheckout(page, context, products.STARTER_HOSTING, null, null);
    await register.inputRegistration();
    await checkout.changeAmountButton.click();
    await checkout.changeAmountInput.fill("20");
    await checkout.clickConfirmAmount();
    await expect(checkout.payAmount).toHaveText("Pay £20.00");
    await checkout.selectPaymentMethod("Stripe");
    await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
    await checkout.clickPlaceOrderAndPay();
    let token = await getSessionToken(context);
    let order = await getCurrentOrder(token);
    let orderId = order?.id;
    await page.waitForURL(`**/order/${orderId}?**`);
    let invoice = await getInvoice(token, orderId);
    let invoiceNumber = invoice?.number;
    let date = getFormattedDate();
    await expect(confirmation.invoiceNumberHeading).toContainText("Order #");
    await expect(confirmation.invoiceNumber).toContainText(`${invoiceNumber}`);
    await expect(confirmation.orderDateHeading).toContainText("Purchase date");
    await expect(confirmation.orderDate).toContainText(`${date}`);
    await expect(
      page.getByRole("alert").getByText("Payment outstanding")
    ).toBeVisible();
    await expect(
      page.getByRole("alert").getByText(
        "You have £52.00 remaining. Please complete your payment to finish your order."
        //TODO: Make the price dynamic, save the paid amount as a variable
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
  });
});

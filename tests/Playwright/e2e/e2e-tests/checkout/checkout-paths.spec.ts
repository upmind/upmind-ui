import { expect } from "@playwright/test";
import { authenticatedUserTest as test } from "../../support/fixtures/auth-context";
import { Checkout } from "../../support/page-objects/templates/checkout";
import {
  addProductToOrder,
  getClientToken,
  getSessionToken,
  registerClient,
  getCurrentOrder
} from "../../support/api/index";
import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { goToCheckout } from "../../support/flows/checkout";

let checkout: Checkout;
let token: string;
let session: any;
let order: any;
let orderId: string;

test.describe("Checkout Paths", () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    await page.goto(URLs.baseUrl);
    await expect
      .poll(
        async () => {
          const cookies = await context.cookies();
          return cookies.some(
            c =>
              c.name === "upm_guest_session" || c.name === "upm_client_session"
          );
        },
        { timeout: 30000 }
      )
      .toBeTruthy();
    let guestToken = await getSessionToken(context);
    let user = await registerClient(guestToken);
    let username = user.email;
    let password = user.password;
    session = await getClientToken(page, username, password);
    token = session?.access_token;
    order = await getCurrentOrder(token);
    orderId = order?.id as string;
  });
  test.describe("Paid orders", () => {
    test("1.1 Paid Order with Tax", async ({ page, context }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL("/order/**/?payment_success=true");
    });
    test("1.2 Paid Order with Tax & Partial Discount", async ({
      page,
      context
    }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "genericpromo",
        null,
        false
      );
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL("/order/**/?payment_success=true");
    });
    test("1.3 Paid Order with Tax & Free Trial Product", async ({
      page,
      context
    }) => {
      let token = session?.access_token;
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await addProductToOrder(
        token,
        orderId,
        products.OPTIONAL_TRIAL_PRODUCT.id,
        12,
        products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
        [],
        [],
        {},
        [],
        true,
        true
      );
      await page.reload();
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL("/order/**/?payment_success=true");
    });
    test("1.4 Paid Order with Tax & Additional Free Product", async ({
      page,
      context
    }) => {
      let token = session?.access_token;
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        null,
        null,
        false
      );
      await addProductToOrder(
        token,
        orderId,
        products.FREE_PRODUCT.id,
        1,
        products.FREE_PRODUCT.billingCycle,
        [],
        [],
        {},
        [],
        true,
        false
      );
      await page.reload();
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL("/order/**/?payment_success=true");
    });
    test("1.5 Paid Order with No Tax", async ({ page, context }) => {
      await goToCheckout(page, context, products.TAX_FREE_PRODUCT, null, null);
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
    });
    test("1.6 Paid Order with No Tax & Partial Discount", async ({
      page,
      context
    }) => {
      await goToCheckout(
        page,
        context,
        products.TAX_FREE_PRODUCT,
        "genericpromo",
        null,
        false
      );
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
    });
    test("1.7 Paid Order with No Tax & Additional Free Trial Product", async ({
      page,
      context
    }) => {
      let token = session?.access_token;
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await goToCheckout(
        page,
        context,
        products.TAX_FREE_PRODUCT,
        null,
        null,
        false
      );
      await addProductToOrder(
        token,
        orderId,
        products.OPTIONAL_TRIAL_PRODUCT.id,
        12,
        products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
        [],
        [],
        {},
        [],
        true,
        true
      );
      await page.reload();
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL("/order/**/?payment_success=true");
    });
    test("1.8 Paid Order with No Tax & Additional Free Product", async ({
      page,
      context
    }) => {
      let token = session?.access_token;
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await goToCheckout(
        page,
        context,
        products.TAX_FREE_PRODUCT,
        null,
        null,
        false
      );
      await addProductToOrder(
        token,
        orderId,
        products.FREE_PRODUCT.id,
        1,
        products.FREE_PRODUCT.billingCycle,
        [],
        [],
        {},
        [],
        true,
        false
      );
      await page.reload();
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL("/order/**/?payment_success=true");
    });
  });
  test.describe("Free orders", () => {
    test("1.1 100% Promotion Applied", async ({ page, context }) => {
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "allfree",
        null,
        false
      );
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL("/order/**/?payment_success=true");
    });
    test("1.2 Free Trial Product", async ({ page, context }) => {
      await goToCheckout(
        page,
        context,
        products.OPTIONAL_TRIAL_PRODUCT,
        null,
        null,
        true
      );
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL("/order/**/?payment_success=true");
    });
    test("1.3 Free Trial Product & Free Promotion Product", async ({
      page,
      context
    }) => {
      let token = session?.access_token;
      let order = await getCurrentOrder(token);
      let orderId = order?.id as string;
      await goToCheckout(
        page,
        context,
        products.STARTER_HOSTING,
        "allfree",
        null,
        false
      );
      await addProductToOrder(
        token,
        orderId,
        products.OPTIONAL_TRIAL_PRODUCT.id,
        12,
        products.OPTIONAL_TRIAL_PRODUCT.billingCycle,
        [],
        [],
        {},
        [],
        true,
        true
      );
      await page.reload();
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickPlaceOrderAndPay();
      await page.waitForURL("/order/**/?payment_success=true");
    });
  });
});

import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { interceptUISchema } from "../../support/mocks/brand";
import { Logins } from "../../support/constants/logins";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { getClientToken } from "../../support/api/auth";
import { getSessionToken } from "../../support/api/auth";
import {
  createOrder,
  Order,
  addProductToOrder
} from "../../support/api/basket";
import { waitForSessionCookie } from "../../support/helpers/session";

let checkout: Checkout;
let login: Login;
let register: Registration;
let token: string | null;
let orderId: string | null;

// TODO: re-enable once UI template changes stabilise
test.describe.skip("Brand Settings - UI Templates", () => {
  test.describe("Login UI Templates", () => {
    test.beforeEach(async ({ page }) => {
      login = new Login(page);
    });
    test("Fallback to default (Two Column (LTR))", async ({ page }) => {
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(login.loginForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "login-fallback-default.png"
      );
    });
    test("Split Login Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.auth.template": "split"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(login.loginForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot("login-split.png");
    });
    test("Canvas Card Login Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.auth.template": "canvas-card"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(login.loginForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "login-canvas-card.png"
      );
    });
    test("Surface Box Login Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.auth.template": "surface-box"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(login.loginForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "login-surface-box.png"
      );
    });
    test("Two Column (RTL) Login Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.auth.template": "two-column-rtl"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(login.loginForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "login-two-column-rtl.png"
      );
    });
    test("Two Column (LTR) Login Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.auth.template": "two-column-ltr"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(login.loginForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "login-two-column-ltr.png"
      );
    });
    test("Login with item in basket", async ({ page, context, request }) => {
      await page.goto(URLs.login);
      await waitForSessionCookie(context);
      token = await getSessionToken(page.context());
      let order = await createOrder(token);
      orderId = order.id;
      await addProductToOrder(
        `${token}`,
        `${orderId}`,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        {
          domain: `${fakerEN_GB.string.alphanumeric({
            length: 5,
            casing: "lower"
          })}.com`
        },
        [],
        true,
        false
      );
      interceptUISchema(context, {
        "@context.auth.template": "two-column-ltr"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(login.loginForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "login-two-column-ltr-with-item.png",
        { mask: [page.locator("dt")] }
      );
    });
  });
  test.describe("Register UI Templates", () => {
    test.beforeEach(async ({ page, context, request }) => {
      register = new Registration(page, context);
    });
    test("Fallback to default (Two Column (LTR))", async ({ page }) => {
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(register.registrationForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "register-fallback-default.png"
      );
    });
    test("Full Register Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.auth.template": "full"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(register.registrationForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot("register-full.png");
    });
    test("Split Register Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.auth.template": "split"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(register.registrationForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot("register-split.png");
    });
    test("Canvas Card Register Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.auth.template": "canvas-card"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(register.registrationForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "register-canvas-card.png"
      );
    });
    test("Surface Box Register Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.auth.template": "surface-box"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(register.registrationForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "register-surface-box.png"
      );
    });
    test("Two Column (RTL) Register Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.auth.template": "two-column-rtl"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(register.registrationForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "register-two-column-rtl.png"
      );
    });
    test("Two Column (LTR) Register Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.auth.template": "two-column-ltr"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(register.registrationForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "register-two-column-ltr.png"
      );
    });
    test("Registration with item in basket", async ({
      page,
      context,
      request
    }) => {
      await page.goto(URLs.login);
      await waitForSessionCookie(context);
      token = await getSessionToken(page.context());
      let order = await createOrder(token);
      orderId = order.id;
      await addProductToOrder(
        `${token}`,
        `${orderId}`,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        {
          domain: `${fakerEN_GB.string.alphanumeric({
            length: 5,
            casing: "lower"
          })}.com`
        },
        [],
        true,
        false
      );
      interceptUISchema(context, {
        "@context.auth.template": "two-column-ltr"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(register.registrationForm).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "register-two-column-ltr-with-item.png",
        { mask: [page.locator("dt")] }
      );
    });
  });
  test.describe("Product Config UI Templates", () => {
    test("Fallback to default (Two Column (RTL))", async ({ page }) => {
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "product-config-fallback.png"
      );
    });
    test("Full Product Config Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.configure.template": "full"
      });
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "product-config-full.png"
      );
    });
    test("Two Column (LTR) Product Config Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.configure.template": "two-column-ltr"
      });
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "product-config-two-column-ltr.png"
      );
    });
    test("Two Column (RTL) Product Config Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.configure.template": "two-column-rtl"
      });
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "product-config-two-column-rtl.png"
      );
    });
    test("Enclosed Product Config Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.configure.template": "enclosed"
      });
      await page.goto(URLs.starterHosting);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "product-config-enclosed.png"
      );
    });
  });
  test.describe("Basket Product UI Templates", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(URLs.login);
      await getClientToken(
        page,
        Logins.UiTesting.username,
        Logins.UiTesting.password
      );
      await page.reload();
      token = await getSessionToken(page.context());
      let order = await createOrder(token);
      orderId = order.id;
      await addProductToOrder(
        `${token}`,
        `${orderId}`,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        {
          domain: `${fakerEN_GB.string.alphanumeric({
            length: { min: 3, max: 15 }
          })}.com`
        },
        [],
        true,
        false
      );
    });
    test("Fallback to default (Two Column (LTR))", async ({ page }) => {
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "basket-product-fallback.png"
      );
    });
    test("Full Basket Product Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.basket.template": "full"
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "basket-product-full.png"
      );
    });
    test("Two Column (LTR) Basket Product Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.basket.template": "two-column-ltr"
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "basket-product-two-column-ltr.png"
      );
    });
    test("Two Column (RTL) Basket Product Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.basket.template": "two-column-rtl"
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "basket-product-two-column-rtl.png"
      );
    });
    test("Enclosed Basket Product Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.basket.template": "enclosed"
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "basket-product-enclosed.png"
      );
    });
  });
  test.describe("Basket UI Templates", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(URLs.login);
      await getClientToken(
        page,
        Logins.UiTesting.username,
        Logins.UiTesting.password
      );
      await page.reload();
      token = await getSessionToken(page.context());
      let order = await createOrder(token);
      orderId = order.id;
      await addProductToOrder(
        `${token}`,
        `${orderId}`,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        {
          domain: `${fakerEN_GB.string.alphanumeric({
            length: { min: 3, max: 15 }
          })}.com`
        },
        [],
        true,
        false
      );
    });
    test("Fallback to default (Two Column (LTR))", async ({ page }) => {
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "basket-fallback.png"
      );
    });
    test("Full Basket Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.basket.template": "full"
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot("basket-full.png");
    });
    test("Two Column (LTR) Basket Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.basket.template": "two-column-ltr"
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "basket-two-column-ltr.png"
      );
    });
    test("Two Column (RTL) Basket Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.basket.template": "two-column-rtl"
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "basket-two-column-rtl.png"
      );
    });
    test("Enclosed Basket Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.basket.template": "enclosed"
      });
      await page.goto(URLs.basket);
      await waitForSessionCookie(page.context());
      await expect(page.locator("body")).toHaveScreenshot(
        "basket-enclosed.png"
      );
    });
  });
  test.describe("Checkout UI Templates", () => {
    test.beforeEach(async ({ page }) => {
      checkout = new Checkout(page);
      await page.goto(URLs.login);
      await getClientToken(
        page,
        Logins.UiTesting.username,
        Logins.UiTesting.password
      );
      await page.reload();
      token = await getSessionToken(page.context());
      let order = await createOrder(token);
      orderId = order.id;
      await addProductToOrder(
        `${token}`,
        `${orderId}`,
        "3de78642-de53-9714-76df-21208469530d",
        1,
        24,
        [],
        [],
        {
          domain: `testingdomain.com`
        },
        [],
        true,
        false
      );
    });
    test("Fallback to Default (Two Column LTR)", async ({ page }) => {
      await page.goto(URLs.checkout);
      await waitForSessionCookie(page.context());
      await expect(checkout.paymentDetails).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "checkout-fallback-default.png",
        { mask: [page.locator("dt")] }
      );
    });
    test("Full Checkout Template", async ({ page, context, request }) => {
      interceptUISchema(context, {
        "@context.checkout.template": "full"
      });
      await page.goto(URLs.checkout);
      await waitForSessionCookie(page.context());
      await expect(checkout.paymentDetails).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot("checkout-full.png", {
        mask: [page.locator("dt")]
      });
    });
    test("Two Column (LTR) Checkout Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.checkout.template": "two-column-ltr"
      });
      await page.goto(URLs.checkout);
      await waitForSessionCookie(page.context());
      await expect(checkout.paymentDetails).toBeVisible();
      (await expect(page.locator("body")).toHaveScreenshot(
        "checkout-two-column-ltr.png"
      ),
        { mask: [page.locator("dt")] });
    });
    test("Two Column (RTL) Checkout Template", async ({
      page,
      context,
      request
    }) => {
      interceptUISchema(context, {
        "@context.checkout.template": "two-column-rtl"
      });
      await page.goto(URLs.checkout);
      await waitForSessionCookie(page.context());
      await expect(checkout.paymentDetails).toBeVisible();
      await expect(page.locator("body")).toHaveScreenshot(
        "checkout-two-column-rtl.png",
        { mask: [page.locator("dt")] }
      );
    });
  });
});

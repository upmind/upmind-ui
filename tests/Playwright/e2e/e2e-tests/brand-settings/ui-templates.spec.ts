import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { interceptUISchema } from "../../support/utils/functions/brand";
import { Logins } from "../../support/constants/logins";
import { Checkout } from "../../support/page-objects/templates/Checkout";
import { getClientToken } from "../../support/utils/functions/tokens";
import { getSessionToken } from "../../support/utils/functions/tokens";
import {
  createOrder,
  addProductToOrder
} from "../../support/utils/functions/basket";

let checkout: Checkout;
let token: string | null;
let orderId: string | null;

test.describe("Brand Settings - UI Templates", () => {
  test.describe("Login UI Templates", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(URLs.catalogueRoot1);
    });
    test("Fallback to default (Full)", async ({ page }) => {
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "login-fallback-default.png"
      );
    });
    test("Full Login Template", async ({ page }) => {
      await interceptUISchema(page, {
        loginTemplate: "full"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot("login-full.png");
    });
    test("Split Login Template", async ({ page }) => {
      await interceptUISchema(page, {
        loginTemplate: "split"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot("login-split.png");
    });
    test("Canvas Card Login Template", async ({ page }) => {
      await interceptUISchema(page, {
        loginTemplate: "canvas-card"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "login-canvas-card.png"
      );
    });
    test("Surface Box Login Template", async ({ page }) => {
      await interceptUISchema(page, {
        loginTemplate: "surface-box"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "login-surface-box.png"
      );
    });
    test("Two Column (RTL) Login Template", async ({ page }) => {
      await interceptUISchema(page, {
        loginTemplate: "two-column-rtl"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "login-two-column-rtl.png"
      );
    });
    test("Two Column (LTR) Login Template", async ({ page }) => {
      await interceptUISchema(page, {
        loginTemplate: "two-column-ltr"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "login-two-column-ltr.png"
      );
    });
    test("Login with item in basket", async ({ page }) => {
      await page.goto(URLs.login);
      await page.waitForLoadState("networkidle");
      token = await getSessionToken(page.context(), "guest");
      orderId = await createOrder(token);
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
        []
      );
      await interceptUISchema(page, {
        loginTemplate: "two-column-ltr"
      });
      await page.goto(URLs.login);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "login-two-column-ltr-with-item.png",
        { mask: [page.locator("dt")] }
      );
    });
  });
  test.describe("Register UI Templates", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(URLs.catalogueRoot1);
    });
    test("Fallback to default (Full)", async ({ page }) => {
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "register-fallback-default.png"
      );
    });
    test("Full Register Template", async ({ page }) => {
      await interceptUISchema(page, {
        registerTemplate: "full"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot("register-full.png");
    });
    test("Split Register Template", async ({ page }) => {
      await interceptUISchema(page, {
        registerTemplate: "split"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot("register-split.png");
    });
    test("Canvas Card Register Template", async ({ page }) => {
      await interceptUISchema(page, {
        registerTemplate: "canvas-card"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "register-canvas-card.png"
      );
    });
    test("Surface Box Register Template", async ({ page }) => {
      await interceptUISchema(page, {
        registerTemplate: "surface-box"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "register-surface-box.png"
      );
    });
    test("Two Column (RTL) Register Template", async ({ page }) => {
      await interceptUISchema(page, {
        registerTemplate: "two-column-rtl"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "register-two-column-rtl.png"
      );
    });
    test("Two Column (LTR) Register Template", async ({ page }) => {
      await interceptUISchema(page, {
        registerTemplate: "two-column-ltr"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "register-two-column-ltr.png"
      );
    });
    test("Registration with item in basket", async ({ page }) => {
      await page.goto(URLs.login);
      await page.waitForLoadState("networkidle");
      token = await getSessionToken(page.context(), "guest");
      orderId = await createOrder(token);
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
        []
      );
      await interceptUISchema(page, {
        registerTemplate: "two-column-ltr"
      });
      await page.goto(URLs.register);
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "register-two-column-ltr-with-item.png",
        { mask: [page.locator("dt")] }
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
      token = await getSessionToken(page.context(), "client");
      orderId = await createOrder(token);
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
        []
      );
    });
    test("Fallback to Default (Full)", async ({ page }) => {
      await page.goto(URLs.checkout);
      await checkout.billingDetails.waitFor({ state: "visible" });
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "checkout-fallback-default.png",
        { mask: [page.locator("dt")] }
      );
    });
    test("Full Checkout Template", async ({ page }) => {
      await interceptUISchema(page, {
        checkoutTemplate: "full"
      });
      await page.goto(URLs.checkout);
      await checkout.billingDetails.waitFor({ state: "visible" });
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot("checkout-full.png", {
        mask: [page.locator("dt")]
      });
    });
    test("Two Column (LTR) Checkout Template", async ({ page }) => {
      await interceptUISchema(page, {
        checkoutTemplate: "two-column-ltr"
      });
      await page.goto(URLs.checkout);
      await checkout.billingDetails.waitFor({ state: "visible" });
      (await expect(page.locator("body")).toHaveScreenshot(
        "checkout-two-column-ltr.png"
      ),
        { mask: [page.locator("dt")] });
    });
    test("Two Column (RTL) Checkout Template", async ({ page }) => {
      await interceptUISchema(page, {
        checkoutTemplate: "two-column-rtl"
      });
      await page.goto(URLs.checkout);
      await checkout.billingDetails.waitFor({ state: "visible" });
      await page.waitForLoadState("load");
      await expect(page.locator("body")).toHaveScreenshot(
        "checkout-two-column-rtl.png",
        { mask: [page.locator("dt")] }
      );
    });
  });
});

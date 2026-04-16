import { test, expect, Page } from "@playwright/test";
import { Login } from "../../support/page-objects/templates/login";
import { Registration } from "../../support/page-objects/templates/registration";
import { URLs } from "../../support/constants/urls";
import { getSessionToken } from "../../support/api/auth";
import { createOrder, addProductToOrder } from "../../support/api/basket";
import { products } from "../../support/constants/products";
import { interceptUISchema, interceptSlots } from "../../support/mocks/brand";
import { slotTemplates } from "../../support/constants/brand";

let login: Login;
let register: Registration;
let product = products.STARTER_HOSTING;

test.describe("Template Slots", () => {
  test.beforeEach(async ({ page, context }) => {
    login = new Login(page);
    register = new Registration(page, context);
  });
  test.describe("Login Page Template Slots", () => {
    for (const template of slotTemplates.login_page.templates) {
      test(`Login Page Template Slot [${template}]`, async ({
        page,
        context
      }) => {
        interceptUISchema(context, {
          [`@context.${slotTemplates.login_page.context}.template`]: template
        });
        interceptSlots(page, "login_page");
        await page.goto(URLs.login);
        await expect(page.getByText("Template: login_page")).toBeVisible();
        await expect(
          page.getByText(
            "This content is injected via the Playwright Test Runner"
          )
        ).toBeVisible();
      });
    }
  });
  test.describe("Register Page Template Slots", () => {
    for (const template of slotTemplates.register_page.templates) {
      test(`Register Page Template Slot [${template}]`, async ({
        page,
        context
      }) => {
        interceptUISchema(context, {
          [`@context.${slotTemplates.register_page.context}.template`]: template
        });
        interceptSlots(page, "register_page");
        await page.goto(URLs.register);
        await expect(page.getByText("Template: register_page")).toBeVisible();
        await expect(
          page.getByText(
            "This content is injected via the Playwright Test Runner"
          )
        ).toBeVisible();
      });
    }
  });
  test.describe("Footer Template Slots", () => {
    for (const template of slotTemplates.footer.templates) {
      test(`Footer Template Slot [${template}]`, async ({ page, context }) => {
        interceptUISchema(context, {
          [`@context.${slotTemplates.footer.context}.template`]: template
        });
        interceptSlots(page, "footer");
        await page.goto(URLs.login);
        await expect(
          page.locator("footer").getByText("Template: footer")
        ).toBeVisible();
        await expect(
          page
            .locator("footer")
            .getByText(
              "This content is injected via the Playwright Test Runner"
            )
        ).toBeVisible();
      });
    }
  });
  test.describe("Basket Summary Template Slots", () => {
    for (const template of slotTemplates.basket_summary_footer.templates) {
      test(`Basket Summary Template Slot [${template}]`, async ({
        page,
        context
      }) => {
        interceptUISchema(context, {
          [`@context.${slotTemplates.basket_summary_footer.context}.template`]:
            template
        });
        interceptSlots(page, "basket_summary_footer");
        await page.goto("/");
        await expect
          .poll(
            async () => {
              const cookies = await context.cookies();
              return cookies.some(c => c.name === "upm_guest_session");
            },
            { timeout: 30000 }
          )
          .toBeTruthy();
        let token = await getSessionToken(context);
        let order = await createOrder(token);
        let orderId = order?.id;
        await addProductToOrder(
          `${token}`,
          `${orderId}`,
          product.id,
          1,
          product.billingCycle,
          [],
          [],
          [],
          [],
          true,
          false
        );
        await page.goto(URLs.basket);
        await expect(
          page.getByText("Template: basket_summary_footer")
        ).toBeVisible();
        await expect(
          page.getByText(
            "This content is injected via the Playwright Test Runner"
          )
        ).toBeVisible();
      });
    }
  });
});

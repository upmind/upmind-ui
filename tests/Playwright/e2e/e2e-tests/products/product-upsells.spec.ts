import { test, expect, BrowserContext } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { Basket } from "../../support/page-objects/templates/basket";
import { getSessionToken } from "../../support/api/auth";
import { createOrder, addProductToOrder } from "../../support/api/basket";
import { interceptBasketUpsells, interceptUISchema } from "../../support/mocks";
import { waitForSessionCookie } from "../../support/helpers/session";

let basket: Basket;

const STARTER = products.STARTER_HOSTING;

async function seedStarterHosting(context: BrowserContext) {
  const token = await getSessionToken(context);
  const order = await createOrder(token);
  await addProductToOrder(
    token,
    order.id,
    STARTER.id,
    1,
    STARTER.billingCycle,
    [],
    [],
    {},
    [],
    true,
    false
  );
}

test.describe.configure({ mode: "parallel" });

test.describe("Product Upsells in Basket @upsells", () => {
  test.beforeEach(async ({ page, context }) => {
    basket = new Basket(page);
    await page.goto("/");
    await waitForSessionCookie(context);
  });

  test.describe("Display — per-option gate", () => {
    test("Upsell options render when optionUpsellEnabled=true", async ({
      page,
      context
    }) => {
      interceptBasketUpsells(context, { optionUpsellEnabled: true });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
      await expect(basket.basketProductSummary).toBeVisible();
      const firstUpsell = basket.basketProductUpsell.first();
      await expect(firstUpsell).toBeVisible();
      await expect(basket.upsellAddButton(firstUpsell)).toBeVisible();
    });
    test("No upsell options render when optionUpsellEnabled=false (default)", async ({
      page,
      context
    }) => {
      interceptBasketUpsells(context, { optionUpsellEnabled: false });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
      await expect(basket.basketProductSummary).toBeVisible();
      await expect(basket.basketProductUpsell).toHaveCount(0);
    });
  });
  test.describe("Display — container-level gate", () => {
    test("Entire upsell section hidden when ui.optionUpsells is hidden", async ({
      page,
      context
    }) => {
      interceptUISchema(context, {
        "@context.basket.optionUpsells": "hidden"
      });
      interceptBasketUpsells(context, { optionUpsellEnabled: true });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
      await expect(basket.basketProductSummary).toBeVisible();
      await expect(basket.basketProductUpsell).toHaveCount(0);
    });
    test("Upsell section visible when ui.optionUpsells is explicitly visible", async ({
      page,
      context
    }) => {
      interceptUISchema(context, {
        "@context.basket.optionUpsells": "visible"
      });
      interceptBasketUpsells(context, { optionUpsellEnabled: true });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
      await expect(basket.basketProductSummary).toBeVisible();
      await expect(basket.basketProductUpsell.first()).toBeVisible();
    });
  });
  test.describe("Benefits", () => {
    test("Benefits list renders below the upsell", async ({
      page,
      context
    }) => {
      const benefits = [
        "Lightning fast SSDs",
        "Free SSL certificate",
        "24/7 support"
      ];
      interceptBasketUpsells(context, {
        optionUpsellEnabled: true,
        optionBenefits: benefits
      });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
      const firstUpsell = basket.basketProductUpsell.first();
      await expect(firstUpsell).toBeVisible();
      const title = await basket.upsellTitle(firstUpsell).innerText();
      await expect(basket.upsellBenefits(title)).toBeVisible();
      const benefitItems = basket.upsellBenefitItems(title);
      await expect(benefitItems).toHaveCount(benefits.length);
      for (const benefit of benefits) {
        await expect(benefitItems.filter({ hasText: benefit })).toBeVisible();
      }
    });
    test("Benefits list is absent when optionBenefits is empty", async ({
      page,
      context
    }) => {
      interceptBasketUpsells(context, {
        optionUpsellEnabled: true,
        optionBenefits: []
      });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
      const firstUpsell = basket.basketProductUpsell.first();
      await expect(firstUpsell).toBeVisible();
      const title = await basket.upsellTitle(firstUpsell).innerText();
      await expect(basket.upsellBenefits(title)).toHaveCount(0);
    });
    test("Benefits accept structured entries with custom icons", async ({
      page,
      context
    }) => {
      const benefits = [
        { label: "Daily backups", icon: "shield-tick" },
        { label: "Premium DNS", icon: "globe-04" }
      ];
      interceptBasketUpsells(context, {
        optionUpsellEnabled: true,
        optionBenefits: benefits
      });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
      const firstUpsell = basket.basketProductUpsell.first();
      await expect(firstUpsell).toBeVisible();
      const title = await basket.upsellTitle(firstUpsell).innerText();
      const benefitItems = basket.upsellBenefitItems(title);
      await expect(benefitItems).toHaveCount(benefits.length);
      for (const benefit of benefits) {
        await expect(
          benefitItems.filter({ hasText: benefit.label })
        ).toBeVisible();
      }
    });
  });
  test.describe("Multiple upsells", () => {
    test("Multiple eligible options render as separate upsell rows", async ({
      page,
      context
    }) => {
      interceptBasketUpsells(context, { optionUpsellEnabled: true });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
      await expect(basket.basketProductUpsell.first()).toBeVisible();
      const count = await basket.basketProductUpsell.count();
      expect(count).toBeGreaterThanOrEqual(2);
      // Each upsell renders an "Add option" button by default (none are
      // pre-selected), so the action-button count must match the row count.
      await expect(
        basket.basketProductUpsell.getByTestId("button-add-option")
      ).toHaveCount(count);
    });
  });
  test.describe("Interaction", () => {
    test.beforeEach(async ({ page, context }) => {
      interceptBasketUpsells(context, { optionUpsellEnabled: true });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
    });
    test("Adding an upsell swaps the action button and patches the basket", async ({
      page
    }) => {
      const firstUpsell = basket.basketProductUpsell.first();
      const addButton = basket.upsellAddButton(firstUpsell);
      const addedButton = basket.upsellAddedButton(firstUpsell);
      await expect(addButton).toBeVisible();
      await expect(addedButton).toHaveCount(0);
      const updateRequest = page.waitForRequest(
        req =>
          /\/api\/(orders|basket)\/[^/]+\/products\/[^/?]+/.test(req.url()) &&
          ["PATCH", "PUT", "POST"].includes(req.method())
      );
      await addButton.click();
      await updateRequest;
      await expect(addedButton).toBeVisible();
      await expect(addButton).toHaveCount(0);
    });
    test("Removing a selected upsell swaps the action button back to Add option", async () => {
      const firstUpsell = basket.basketProductUpsell.first();
      const addButton = basket.upsellAddButton(firstUpsell);
      const addedButton = basket.upsellAddedButton(firstUpsell);
      await expect(addButton).toBeVisible();
      await addButton.click();
      await expect(addedButton).toBeVisible();
      await addedButton.click();
      await expect(addButton).toBeVisible();
    });
  });
});

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

  test.describe("Display — per-option gate (Layer 3)", () => {
    test("1.1 Upsell toggles render when optionUpsellEnabled=true", async ({
      page,
      context
    }) => {
      interceptBasketUpsells(context, { optionUpsellEnabled: true });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);

      await expect(basket.basketProductSummary).toBeVisible();
      const firstUpsell = basket.basketProductUpsell.first();
      await expect(firstUpsell).toBeVisible();
      await expect(firstUpsell.getByRole("switch")).toBeVisible();
    });

    test("1.2 No upsell toggles render when optionUpsellEnabled=false (default)", async ({
      page,
      context
    }) => {
      // Forces Layer 3 false on every option so the assertion does not depend
      // on whichever options the live catalog already enables.
      interceptBasketUpsells(context, { optionUpsellEnabled: false });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);

      await expect(basket.basketProductSummary).toBeVisible();
      await expect(basket.basketProductUpsell).toHaveCount(0);
    });
  });

  test.describe("Display — container-level gate (Layer 2)", () => {
    test("2.1 Entire upsell section hidden when ui.optionUpsells is hidden", async ({
      page,
      context
    }) => {
      // Layer 3 is open here — Layer 2 alone should still suppress the
      // section, proving the container gate sits above the per-option gate.
      interceptUISchema(context, {
        "@context.basket.optionUpsells": "hidden"
      });
      interceptBasketUpsells(context, { optionUpsellEnabled: true });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);

      await expect(basket.basketProductSummary).toBeVisible();
      await expect(basket.basketProductUpsell).toHaveCount(0);
    });

    test("2.2 Upsell section visible when ui.optionUpsells is explicitly visible", async ({
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
    test("3.1 Benefits list renders below the upsell toggle", async ({
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

    test("3.2 Benefits list is absent when optionBenefits is empty", async ({
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

    test("3.3 Benefits accept structured entries with custom icons", async ({
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
    test("4.1 Multiple eligible options render as separate upsell rows", async ({
      page,
      context
    }) => {
      interceptBasketUpsells(context, { optionUpsellEnabled: true });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);

      await expect(basket.basketProductUpsell.first()).toBeVisible();
      const count = await basket.basketProductUpsell.count();
      expect(count).toBeGreaterThanOrEqual(2);
      await expect(basket.basketProductUpsell.getByRole("switch")).toHaveCount(
        count
      );
    });
  });

  test.describe("Interaction — toggling", () => {
    test.beforeEach(async ({ page, context }) => {
      interceptBasketUpsells(context, { optionUpsellEnabled: true });
      await seedStarterHosting(context);
      await page.goto(URLs.basket);
    });

    test("5.1 Toggling an upsell on flips the switch state and patches the basket", async ({
      page
    }) => {
      const toggle = basket.basketProductUpsell.first().getByRole("switch");

      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute("aria-checked", "false");

      const updateRequest = page.waitForRequest(
        req =>
          /\/api\/(orders|basket)\/[^/]+\/products\/[^/?]+/.test(req.url()) &&
          ["PATCH", "PUT", "POST"].includes(req.method())
      );

      await toggle.click();

      await updateRequest;
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    });

    test("5.2 Toggling a selected upsell off flips the switch back to unchecked", async () => {
      const toggle = basket.basketProductUpsell.first().getByRole("switch");

      await expect(toggle).toHaveAttribute("aria-checked", "false");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-checked", "false");
    });

    test("5.3 Clicking the upsell title is equivalent to clicking the switch", async () => {
      const firstUpsell = basket.basketProductUpsell.first();
      const toggle = firstUpsell.getByRole("switch");

      await expect(toggle).toHaveAttribute("aria-checked", "false");
      await basket.upsellTitle(firstUpsell).click();
      await expect(toggle).toHaveAttribute("aria-checked", "true");
    });
  });
});

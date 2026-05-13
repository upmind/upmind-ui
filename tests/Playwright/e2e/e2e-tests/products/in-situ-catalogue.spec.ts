import { test, expect, Page, Locator } from "@playwright/test";
import { URLs, productAddUrl } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { interceptConfigValues } from "../../support/mocks/brand";
import { getSessionToken } from "../../support/api/auth";
import {
  waitForSessionCookie,
  overrideBasketProductsLimit
} from "../../support/helpers/index";
import { ProductConfig } from "../../support/page-objects/templates/product-config";
import { Basket } from "../../support/page-objects/templates/basket";

/**
 * Verifies catalogue card behaviour against the brand's
 * `ui.basket.add_to_basket_funnelling` setting:
 *   - "none"      → keep user on the catalogue when a product can be added
 *                   directly (non-configurable, or term-only).
 *   - "next_step" → always navigate to the configure step (legacy funnel).
 *
 * Products with options/attributes/provision fields always navigate to
 * configure regardless of the setting.
 */

const productCard = (page: Page, id: string): Locator =>
  page.getByTestId(`product-card-${id}`);

async function setupCatalogue(page: Page, funnelling: "none" | "next_step") {
  overrideBasketProductsLimit(page);
  await page.goto(URLs.basket);
  await waitForSessionCookie(page.context());
  const token = await getSessionToken(page.context());
  await interceptConfigValues(page, token, { basketFunnelling: funnelling });
  await page.goto(URLs.catalogueRoot1);
  await page.waitForLoadState("load");
  await expect(page.getByTestId("products-grid")).toBeVisible();
}
test.describe("In-Situ Catalogue Adds @in-situ-catalogue", () => {
  test.describe("Funnelling = none (in-situ enabled)", () => {
    test.beforeEach(async ({ page }) => {
      await setupCatalogue(page, "none");
    });
    test("Non-configurable product adds in-situ without navigation", async ({
      page
    }) => {
      const { id } = products.HAT;
      const card = productCard(page, id);
      await expect(card).toBeVisible();
      await card.getByTestId("button-add-to-basket").click();
      await expect(page).toHaveURL(/\/order\/shop\b/);
      await expect(card.getByTestId("button-in-basket")).toBeVisible();
    });
    test("Term-only product auto-adds with the default term", async ({
      page
    }) => {
      const { id, billingCycle } = products.SERVER_A;
      const card = productCard(page, id);
      await expect(card).toBeVisible();
      await card.getByTestId("button-add-to-basket").click();
      await expect(page).toHaveURL(/\/order\/shop\b/);
      await expect(card.getByTestId("button-in-basket")).toBeVisible({
        timeout: 10000
      });
      await page.goto(URLs.basket);
      const basket = new Basket(page);
      await expect(basket.basketProduct).toContainText(
        new RegExp(`${billingCycle}`)
      );
    });
    test("Subproduct-configurable product still navigates to configure", async ({
      page
    }) => {
      const { id } = products.TSHIRT;
      const productConfig = new ProductConfig(page);
      await productCard(page, id).getByTestId("button-add-to-basket").click();
      await expect(productConfig.productConfigSection).toBeVisible();
    });
    test("Sibling cards disabled while one product is being added", async ({
      page
    }) => {
      const targetId = products.HAT.id;
      const siblingId = products.SERVER_A.id;
      const siblingButton = productCard(page, siblingId).getByTestId(
        "button-add-to-basket"
      );
      await page.route("**/api/clients/*/orders/*/products**", async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.continue();
      });
      await productCard(page, targetId)
        .getByTestId("button-add-to-basket")
        .click();
      await expect(siblingButton).toBeDisabled();
      await expect(siblingButton).toBeEnabled({ timeout: 10000 });
    });
    test("Scroll position preserved across in-situ add", async ({ page }) => {
      const { id } = products.HAT;
      const card = productCard(page, id);
      await page.evaluate(() => window.scrollTo(0, 1200));
      const before = await page.evaluate(() => window.scrollY);
      expect(before).toBeGreaterThan(0);
      await card.getByTestId("button-add-to-basket").click();
      await expect(card.getByTestId("button-in-basket")).toBeVisible({
        timeout: 10000
      });
      const after = await page.evaluate(() => window.scrollY);
      // Allow a small drift (browser-driven layout shifts) but reject a
      // scroll-to-top, which is what the legacy router did.
      expect(after).toBeGreaterThan(before - 100);
    });
    test("Clicking an in-basket card again adds another copy", async ({
      page
    }) => {
      const { id } = products.HAT;
      const card = productCard(page, id);
      await card.getByTestId("button-add-to-basket").click();
      await page.waitForTimeout(2000);
      await expect(card.getByTestId("button-in-basket")).toBeVisible({
        timeout: 10000
      });
      await card.getByTestId("button-in-basket").click();
      await page.waitForTimeout(2000);
      await page.goto(URLs.basket);
      const basket = new Basket(page);
      await expect(
        basket.basketProduct.getByTestId("quantity-input")
      ).toHaveValue("2");
    });
  });
});

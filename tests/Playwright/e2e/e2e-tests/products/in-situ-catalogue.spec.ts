import { test, expect, Page, Locator } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { interceptConfigValues } from "../../support/mocks/brand";
import {
  clickAndAwaitBasketAdd,
  waitForBasketAddRequest,
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
 *
 * The catalogue
 * CTA is a single `product-card-cta` button; the "in basket" state is signalled
 * by `aria-pressed="true"` on that same element.
 */

const productCard = (page: Page, id: string): Locator =>
  page
    .getByTestId("product-card")
    .and(page.locator(`[data-test-value="${id}"]`));

const cardCta = (page: Page, id: string): Locator =>
  productCard(page, id).getByTestId("product-card-cta");

async function setupCatalogue(page: Page, funnelling: "none" | "next_step") {
  overrideBasketProductsLimit(page);
  await page.goto(URLs.basket);
  await interceptConfigValues(page, { basketFunnelling: funnelling });
  await page.goto(URLs.catalogueRoot1);
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
      const cta = cardCta(page, id);
      await expect(cta).toBeVisible();
      await clickAndAwaitBasketAdd(page, cta);
      await expect(page).toHaveURL(/\/order\/shop\b/);
    });
    test("Term-only product auto-adds with the default term", async ({
      page
    }) => {
      const { id, billingCycle } = products.SERVER_A;
      const cta = cardCta(page, id);
      await expect(cta).toBeVisible();
      await clickAndAwaitBasketAdd(page, cta);
      await expect(page).toHaveURL(/\/order\/shop\b/);
      await page.goto(URLs.basket);
      const basket = new Basket(page);
      // The auto-added term is the product's default billing cycle; the
      // renewal-term label carries that stable cycle in data-test-value.
      await expect(basket.renewalTermLabel.first()).toBeVisible();
      await expect(basket.renewalTermLabel.first()).toHaveAttribute(
        "data-test-value",
        String(billingCycle)
      );
    });
    test("Subproduct-configurable product still navigates to configure", async ({
      page
    }) => {
      const { id } = products.TSHIRT;
      const productConfig = new ProductConfig(page);
      await cardCta(page, id).click();
      await expect(productConfig.productConfigSection).toBeVisible();
    });
    test("Sibling cards disabled while one product is being added", async ({
      page
    }) => {
      const targetId = products.HAT.id;
      const siblingId = products.SERVER_A.id;
      const targetCta = cardCta(page, targetId);
      const siblingCta = cardCta(page, siblingId);
      const basketCount = page.getByTestId("basket-action-count");
      const initialCount = (await basketCount.count())
        ? Number(await basketCount.innerText())
        : 0;

      await page.route("**/api/clients/*/orders/*/products**", async route => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await route.continue();
      });
      const basketAddRequest = waitForBasketAddRequest(page);
      await targetCta.click();
      await expect(siblingCta).toBeDisabled();
      await basketAddRequest;
      await expect(siblingCta).toBeEnabled();
      await expect(page).toHaveURL(/\/order\/shop\b/);
      await expect(targetCta).toHaveAttribute("aria-pressed", "true");
      const newCount = Number(await basketCount.innerText());
      expect(newCount).toBeGreaterThan(initialCount);
    });
    test("Scroll position preserved across in-situ add", async ({ page }) => {
      const { id } = products.HAT;
      const cta = cardCta(page, id);
      await page.evaluate(() => window.scrollTo(0, 1200));
      const before = await page.evaluate(() => window.scrollY);
      expect(before).toBeGreaterThan(0);
      await clickAndAwaitBasketAdd(page, cta);
      await expect(page).toHaveURL(/\/order\/shop\b/);
      const after = await page.evaluate(() => window.scrollY);
      // Allow a small drift (browser-driven layout shifts) but reject a
      // scroll-to-top, which is what the legacy router did.
      expect(after).toBeGreaterThan(before - 100);
    });
    test("Clicking an in-basket card again adds another copy", async ({
      page
    }) => {
      const { id } = products.HAT;
      const cta = cardCta(page, id);
      await clickAndAwaitBasketAdd(page, cta);
      await expect(page).toHaveURL(/\/order\/shop\b/);
      await expect(cta).toBeEnabled();
      await clickAndAwaitBasketAdd(page, cta);
      await page.goto(URLs.basket);
      const basket = new Basket(page);
      await expect(
        basket.basketProduct.getByTestId("number-field-input")
      ).toHaveValue("2");
    });
  });
});

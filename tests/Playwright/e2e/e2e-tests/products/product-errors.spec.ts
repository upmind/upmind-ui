import { newUser, expect } from "../../support/fixtures/auth-context";
import { Basket } from "../../support/page-objects/templates/basket";
import { ProductSetup } from "../../support/page-objects/templates/product-setup";
import { URLs } from "../../support/constants/urls";
import { products } from "../../support/constants/products";
import { seedInvalidProduct } from "../../support/flows";
import { getBasketProducts } from "../../support/api";

let basket: Basket;
let productSetup: ProductSetup;

// The field-level error panel on the configure/edit route is ConfigErrors,
// which carries the explicit `product-incomplete-alert` testid (the basket-list
// RequiredAlert with `link-add-missing-data` is a different surface). Target it
// directly by its testid, never by translated copy.
const incompleteAlert = (page: import("@playwright/test").Page) =>
  page.getByTestId("product-incomplete-alert");

newUser.describe.configure({ mode: "parallel" });
newUser.describe("Product Config — Field-level error panel", () => {
  newUser.beforeEach(({ page }) => {
    basket = new Basket(page);
    productSetup = new ProductSetup(page);
  });

  newUser(
    "Lists each missing field with a Review link when a basket product has provision-field errors",
    async ({ page, token }) => {
      await seedInvalidProduct(products.DOMAIN_2, token);
      let basketProducts = await getBasketProducts(token);
      let product = basketProducts[0].id;
      await page.goto(`/order/basket/edit/${product}`);
      const alert = incompleteAlert(page);
      await expect(alert).toBeVisible({ timeout: 15000 });
      const reviewLinks = alert.getByRole("link");
      expect(await reviewLinks.count()).toBeGreaterThanOrEqual(1);
    }
  );

  newUser("Review links have correct href values", async ({ page, token }) => {
    await seedInvalidProduct(products.DOMAIN_2, token);
    let basketProducts = await getBasketProducts(token);
    let product = basketProducts[0].id;
    await page.goto(`/order/basket/edit/${product}`);
    const alert = incompleteAlert(page);
    await expect(alert).toBeVisible({ timeout: 15000 });
    await expect(alert.getByRole("link").nth(0)).toHaveAttribute(
      "href",
      "#properties-provision-fields-properties-update-registrant-phone"
    );
    await expect(alert.getByRole("link").nth(1)).toHaveAttribute(
      "href",
      "#properties-provision-fields-properties-update-registrant-address-1"
    );
    await expect(alert.getByRole("link").nth(2)).toHaveAttribute(
      "href",
      "#properties-provision-fields-properties-update-registrant-address-city"
    );
    await expect(alert.getByRole("link").nth(3)).toHaveAttribute(
      "href",
      "#properties-provision-fields-properties-update-registrant-address-postcode"
    );
    await expect(alert.getByRole("link").nth(4)).toHaveAttribute(
      "href",
      "#properties-provision-fields-properties-update-registrant-address-country-code"
    );
  });

  newUser(
    "Errors are de-duplicated across multiple instances of the same product",
    async ({ page, token }) => {
      await seedInvalidProduct(products.DOMAIN_2, token);
      await seedInvalidProduct(products.DOMAIN_2, token);
      let basketProducts = await getBasketProducts(token);
      let product = basketProducts[0].id;
      await page.goto(`/order/basket/edit/${product}`);
      const alert = incompleteAlert(page);
      await expect(alert).toBeVisible({ timeout: 15000 });
      const items = alert.locator("li");
      const count = await items.count();
      const texts = await Promise.all(
        Array.from({ length: count }, (_, i) => items.nth(i).innerText())
      );
      expect(new Set(texts).size).toBe(texts.length);
    }
  );

  newUser(
    "Panel hides when the product has no errors",
    async ({ page, token }) => {
      await seedInvalidProduct(products.STARTER_HOSTING, token);
      let basketProducts = await getBasketProducts(token);
      let product = basketProducts[0].id;
      await page.goto(`/order/basket/edit/${product}`);
      await expect(incompleteAlert(page)).toHaveCount(0);
    }
  );
});

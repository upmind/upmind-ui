import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { addProductViaHeadless } from "../../support/flows/basket-setup";
import { Basket } from "../../support/page-objects/templates/basket";

let basket: Basket;

test.describe("Basket Tests", () => {
  test.beforeEach(async ({ page }) => {
    basket = new Basket(page);
  });
  test("Basket with 1 item", async ({ page }) => {
    const domain = `${fakerEN_GB.string.alphanumeric({ length: { min: 3, max: 15 } })}.com`;
    await page.goto(URLs.basket);
    // basket-product-name carries the in-basket product id in data-test-value;
    // the seed returns that id so the assertion targets the actual seeded line
    // rather than the (i18n) display name.
    const { basketProductId } = await addProductViaHeadless(page, {
      productId: "3de78642-de53-9714-76df-21208469530d",
      quantity: 1,
      billingCycleMonths: 24,
      provisionFields: { domain }
    });
    expect(basketProductId).toBeTruthy();
    await page.goto(URLs.basket);
    await expect(basket.basketProductSummary).toBeVisible();
    const productName = basket.basketProductSummary.getByTestId(
      "basket-product-name"
    );
    await expect(productName).toBeVisible();
    await expect(productName).toHaveAttribute(
      "data-test-value",
      basketProductId as string
    );
  });
  test("Empty basket", async ({ page }) => {
    await page.goto(URLs.basket);
    // The basket-unavailable interstitial carries an explicit
    // `basket-empty-message` testid distinguishing it from other interstitial
    // (e.g. error) reasons that also render a `dialog-window`.
    await expect(page.getByTestId("basket-empty-message")).toBeVisible();
  });
});

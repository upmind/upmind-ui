import { test, expect, Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import {
  getSessionToken,
  createOrder,
  addProductToOrder,
  getBasketProducts
} from "../../support/api/index";
import { waitForSessionCookie } from "../../support/helpers/session";
import { products } from "../../support/constants/products";
import { Basket } from "../../support/page-objects/templates/basket";
import { Footer } from "../../support/page-objects/templates/footer";

const PROVISION_REQUEST = /\/basket\/products\/[^/]+\/provision_fields(\?|$)/;
let basket: Basket;
let footer: Footer;

function trackProvisionRequests(page: Page) {
  const urls: string[] = [];
  page.on("request", req => {
    if (PROVISION_REQUEST.test(req.url())) urls.push(req.url());
  });
  return urls;
}

async function selectCurrency(page: Page, code: string) {
  // Open the currency Combobox and pick the option by its stable
  // `currency-option-{code}` testid (currency code, locale-independent), then
  // confirm the selection via the value span's `data-test-value` code.
  await footer.currencySelector
    .getByTestId("currency-selector-trigger")
    .click();
  const option = page.getByTestId(`currency-option-${code}`);
  await expect(option).toBeVisible();
  await option.click({ force: true });
  await expect(footer.currencyValue).toHaveAttribute("data-test-value", code);
}

test.describe("Basket provision checks", () => {
  // basket-product-name carries the in-basket product id in data-test-value;
  // captured here so each test can assert which line was seeded by its id.
  let basketProductId: string;
  test.beforeEach(async ({ page, context }) => {
    basket = new Basket(page);
    footer = new Footer(page);
    await page.goto(URLs.basket);
    await waitForSessionCookie(context);
    const token = await getSessionToken(context);
    const order = await createOrder(token);
    await addProductToOrder(
      token,
      order.id,
      products.STARTER_HOSTING.id,
      1,
      24,
      [],
      [],
      {
        domain: `${fakerEN_GB.string.alphanumeric({ length: { min: 6, max: 12 } })}.com`
      },
      [],
      true,
      false
    );
    const basketProducts = await getBasketProducts(token);
    basketProductId = basketProducts[0].id;
  });

  test("Initial basket load fetches provision fields", async ({ page }) => {
    const urls = trackProvisionRequests(page);
    await page.goto(URLs.basket);
    // The product name is translated copy, but basket-product-name carries the
    // in-basket product id in data-test-value, so assert which line was seeded
    // by its id rather than its (i18n) display name.
    await expect(basket.basketProductSummary).toBeVisible();
    await expect(
      basket.basketProductSummary.getByTestId("basket-product-name")
    ).toHaveAttribute("data-test-value", basketProductId);
    await expect(basket.proceedToCheckout).toBeEnabled();
    expect(urls.length).toBeGreaterThan(0);
  });

  test("Currency change does not refetch provision fields and keeps the basket populated", async ({
    page
  }) => {
    await page.goto(URLs.basket);
    await expect(basket.basketProductSummary).toBeVisible();
    await expect(
      basket.basketProductSummary.getByTestId("basket-product-name")
    ).toHaveAttribute("data-test-value", basketProductId);
    await expect(basket.proceedToCheckout).toBeEnabled();
    const urls = trackProvisionRequests(page);
    await selectCurrency(page, "USD");
    // Wait for the basket machine to finish refreshing — toBeEnabled gates on
    // the post-refresh idle state, so any regression call would have fired by
    // the time this resolves.
    await expect(basket.proceedToCheckout).toBeEnabled();
    await expect(basket.basketProductSummary).toBeVisible();
    // The same line must survive the currency change — assert by its in-basket
    // id, not its (i18n) display name.
    await expect(
      basket.basketProductSummary.getByTestId("basket-product-name")
    ).toHaveAttribute("data-test-value", basketProductId);
    await expect(page).not.toHaveURL(URLs.emptyBasket);
    expect(urls).toHaveLength(0);
  });

  test("Applying a promo code does not refetch provision fields", async ({
    page
  }) => {
    await page.goto(URLs.basket);
    await expect(basket.proceedToCheckout).toBeEnabled();

    const urls = trackProvisionRequests(page);
    await basket.enterPromoCode("genericpromo");
    await expect(basket.proceedToCheckout).toBeEnabled();
    expect(urls).toHaveLength(0);
  });

  test("Skeleton renders on basket total while currency change is in flight", async ({
    page
  }) => {
    await page.goto(URLs.basket);
    await expect(basket.basketProductSummary).toBeVisible();
    await expect(
      basket.basketProductSummary.getByTestId("basket-product-name")
    ).toHaveAttribute("data-test-value", basketProductId);
    await expect(basket.proceedToCheckout).toBeEnabled();
    // Throttle the network so the skeleton state is observable. CDP throttling
    // applies to every subsequent request, so it slows both the currency PUT
    // and the basket refresh GETs that follow it — the skeleton stays up until
    // the whole refresh completes, not just the PUT.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 1000,
      downloadThroughput: (50 * 1024) / 8,
      uploadThroughput: (50 * 1024) / 8
    });
    const skeleton = basket.subtotalSummary.locator(".animate-pulse").first();
    await footer.currencySelector
      .getByTestId("currency-selector-trigger")
      .click();
    await page.getByTestId("currency-option-USD").click({ force: true });
    // Skeleton must appear during the in-flight PUT, then resolve once the
    // basket refresh completes.
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toBeHidden();
    await expect(footer.currencyValue).toHaveAttribute(
      "data-test-value",
      "USD"
    );
  });
});

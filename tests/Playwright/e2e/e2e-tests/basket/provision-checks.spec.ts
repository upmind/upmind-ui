import { test, expect, Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import {
  getSessionToken,
  createOrder,
  addProductToOrder
} from "../../support/api/index";
import { waitForSessionCookie } from "../../support/helpers/session";
import { products } from "../../support/constants/products";
import { Basket } from "../../support/page-objects/templates/basket";
import { Footer } from "../../support/page-objects/templates/footer";

// FE-1269 — basket refresh only fires the N+1 provision-field requests when
// products actually change. Watches the per-product basket call:
//   GET /api/basket/products/{product-id}/provision_fields

const PROVISION_REQUEST = /\/basket\/products\/[^/]+\/provision_fields(\?|$)/;
const HOSTING_PRODUCT_NAME = "Shared Hosting";
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
  await footer.currencySelector.getByTestId("button-default").click();
  const option = page.getByRole("option", { name: new RegExp(code, "i") });
  await expect(option).toBeVisible();
  await option.click({ force: true });
  await expect(
    footer.currencySelector.getByTestId("button-default")
  ).toHaveText(code);
}

test.describe("Basket provision checks", () => {
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
  });

  test("Initial basket load fetches provision fields", async ({ page }) => {
    const urls = trackProvisionRequests(page);
    await page.goto(URLs.basket);
    await expect(basket.basketProductSummary).toContainText(
      HOSTING_PRODUCT_NAME
    );
    await expect(basket.proceedToCheckout).toBeEnabled();
    expect(urls.length).toBeGreaterThan(0);
  });

  test("Currency change does not refetch provision fields and keeps the basket populated", async ({
    page
  }) => {
    await page.goto(URLs.basket);
    await expect(basket.basketProductSummary).toContainText(
      HOSTING_PRODUCT_NAME
    );
    await expect(basket.proceedToCheckout).toBeEnabled();
    const urls = trackProvisionRequests(page);
    await selectCurrency(page, "USD");
    // Wait for the basket machine to finish refreshing — toBeEnabled gates on
    // the post-refresh idle state, so any regression call would have fired by
    // the time this resolves.
    await expect(basket.proceedToCheckout).toBeEnabled();
    await expect(basket.basketProductSummary).toContainText(
      HOSTING_PRODUCT_NAME
    );
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
    await expect(basket.basketProductSummary).toContainText(
      HOSTING_PRODUCT_NAME
    );
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
    await footer.currencySelector.getByTestId("button-default").click();
    await page.getByRole("option", { name: /USD/i }).click({ force: true });
    // Skeleton must appear during the in-flight PUT, then resolve once the
    // basket refresh completes.
    await expect(skeleton).toBeVisible();
    await expect(skeleton).toBeHidden();
    await expect(
      footer.currencySelector.getByTestId("button-default")
    ).toHaveText("USD");
  });
});

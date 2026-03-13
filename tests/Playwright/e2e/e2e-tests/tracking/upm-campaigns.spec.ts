import { test, BrowserContext, expect, Page } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../support/constants/urls";
import { Registration } from "../../support/page-objects/templates/Registration";
import { Checkout } from "../../support/page-objects/templates/Checkout";
import { getSessionToken } from "../../support/utils/functions/tokens";
import {
  createOrder,
  addProductToOrder
} from "../../support/utils/functions/basket";

let registration: Registration;
let checkout: Checkout;

type TrackingCookie = {
  campaign: string;
  source: string;
  medium: string;
  content: string;
  term: string;
};

async function getTrackingCookie(
  context: BrowserContext
): Promise<TrackingCookie> {
  const cookies = await context.cookies();
  const trackingCookie = cookies.find(cookie => cookie.name === "upm_track");

  if (!trackingCookie) {
    const message = "Tracking cookie not found.";
    console.error(message);
    throw new Error(message);
  }

  return JSON.parse(decodeURIComponent(trackingCookie.value)) as TrackingCookie;
}

async function getTrackingData(page: Page, requestUrl: string) {
  const reqPromise = page.waitForRequest(
    request =>
      request.url().includes(requestUrl) &&
      ["POST", "PATCH"].includes(request.method())
  );
  const request = await reqPromise;
  let body: any;
  try {
    body = request.postDataJSON?.() ?? JSON.parse(request.postData() || "{}");
  } catch (e) {
    throw new Error("Failed to parse request body as JSON: " + String(e));
  }
  const tracking = body.tracking;
  console.log("Tracking data:", tracking);
  return tracking;
}

test.describe("UPM Campaign Tracking", () => {
  test.beforeEach(async ({ page, context, browser }) => {
    registration = new Registration(page, context);
    checkout = new Checkout(page);
    context.clearCookies();
  });
  test("Check that UPM cookie is created successfully", async ({
    page,
    context
  }) => {
    await page.goto(
      `${URLs.register}?upm_campaign=playwright_test_campaign&upm_source=playwright&upm_medium=e2e_test&upm_content=content_example&upm_term=term_example`
    );
    await page.waitForLoadState("networkidle");
    let trackingCookie = await getTrackingCookie(context);
    console.log(JSON.stringify(trackingCookie));
    await expect(trackingCookie.campaign).toBe("playwright_test_campaign");
    await expect(trackingCookie.source).toBe("playwright");
    await expect(trackingCookie.medium).toBe("e2e_test");
    await expect(trackingCookie.content).toBe("content_example");
    await expect(trackingCookie.term).toBe("term_example");
  });
  test('Check "register" request body for tracking node', async ({ page }) => {
    await page.goto(
      `${URLs.register}?upm_campaign=playwright_test_campaign&upm_source=playwright&upm_medium=e2e_test&upm_content=content_example&upm_term=term_example`
    );
    await registration.inputRegistration();
    const tracking = await getTrackingData(page, "/api/clients/register");
    await page.waitForLoadState("networkidle");
    console.log(JSON.stringify(tracking));
    await expect(tracking).toBeDefined();
    await expect(tracking.campaign).toBeDefined();
    await expect(tracking.source).toBeDefined();
    await expect(tracking.medium).toBeDefined();
    await expect(tracking.content).toBeDefined();
    await expect(tracking.term).toBeDefined();
  });
  test('Check "order" request body for tracking node', async ({ page }) => {
    await page.goto(
      "http://qa-automation.local:5173/order/product/3de78642-de53-9714-76df-21208469530d?upm_campaign=playwright_test_campaign&upm_source=playwright&upm_medium=e2e_test&upm_content=content_example&upm_term=term_example"
    );
    const tracking = await getTrackingData(page, "/api/orders");
    console.log(JSON.stringify(tracking));
    await expect(tracking).toBeDefined();
    await expect(tracking.campaign).toBeDefined();
    await expect(tracking.source).toBeDefined();
    await expect(tracking.medium).toBeDefined();
    await expect(tracking.content).toBeDefined();
    await expect(tracking.term).toBeDefined();
  });
  test('Check "convert" request body for tracking node', async ({
    page,
    context
  }) => {
    await page.goto(
      `${URLs.basket}?upm_campaign=playwright_test_campaign&upm_source=playwright&upm_medium=e2e_test&upm_content=content_example&upm_term=term_example`
    );
    await page.waitForLoadState("networkidle");
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    let token = await getSessionToken(context);
    let order = await createOrder(token);
    let orderId = order.id;
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
          length: { min: 3, max: 15 }
        })}.com`
      },
      [],
      true,
      false
    );
    await page.goto(URLs.checkout);
    await registration.inputRegistration();
    await checkout.selectPaymentMethod("Stripe");
    await checkout.inputStripeDetails("4242424242424242", "01/50", "123");
    await checkout.clickPlaceOrderAndPay();
    const tracking = await getTrackingData(
      page,
      `/api/orders/${orderId}/convert`
    );
    console.log(JSON.stringify(tracking));
    await expect(tracking).toBeDefined();
    await expect(tracking.campaign).toBeDefined();
    await expect(tracking.source).toBeDefined();
    await expect(tracking.medium).toBeDefined();
    await expect(tracking.content).toBeDefined();
    await expect(tracking.term).toBeDefined();
  });
  test("Verify that upm_track cookie is not present when tracking params are not used", async ({
    page,
    context
  }) => {
    await page.goto(URLs.register);
    await page.waitForLoadState("networkidle");
    await expect(async () => {
      await getTrackingCookie(context);
    }).rejects.toThrow("Tracking cookie not found.");
  });
});

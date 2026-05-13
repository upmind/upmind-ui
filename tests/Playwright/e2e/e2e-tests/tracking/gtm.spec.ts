import { test, expect, Page } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { waitForSessionCookie } from "../../support/helpers";

const gtmContainerId = "G-9QKJBFZHN2";
const testUrl = [
  { name: "Basket", path: URLs.basket },
  { name: "Checkout", path: URLs.checkout },
  { name: "Starter Hosting", path: URLs.starterHosting },
  { name: "Register", path: URLs.register },
  { name: "Login", path: URLs.login }
];

async function getDataLayer(page: Page) {
  const dataLayer = await page.evaluate(() => {
    return (window as Window & { dataLayer?: unknown[] }).dataLayer;
  });
  return dataLayer;
}

test.describe("Google Tag Manager", () => {
  testUrl.forEach(({ name, path }) => {
    test(`${name} - Check <head> for GTM script`, async ({ page }) => {
      const gtmScript = page.locator(
        `head script[src*='https://www.googletagmanager.com/gtm.js?id=${gtmContainerId}']`
      );
      await page.goto(path);
      await expect(gtmScript).toHaveCount(1);
    });
  });
  test.describe("Verify event data in DataLayer", () => {
    test("Check for GTM start event", async ({ page }) => {
      await page.goto(URLs.starterHosting);
      await page.waitForFunction(() =>
        (
          window as Window & { dataLayer?: Array<{ event?: string }> }
        ).dataLayer?.some(e => e.event === "gtm.js")
      );
      const dataLayer = await getDataLayer(page);
      expect(dataLayer).toBeDefined();
      const gtmStart = dataLayer?.find(
        (entry: unknown) => (entry as { event?: string }).event === "gtm.js"
      );
      expect(gtmStart).toBeDefined();
    });
  });
});

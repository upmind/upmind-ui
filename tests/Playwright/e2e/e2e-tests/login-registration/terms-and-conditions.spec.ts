import { test, expect, BrowserContext } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Registration } from "../../support/page-objects/templates/registration";
import { Markdown } from "../../support/page-objects/components/markdown";
import { interceptTermsAndConditions } from "../../support/mocks/brand";
import { waitForUpmindBridge } from "../../support/flows/headless-bridge";

let registration: Registration;
let markdown: Markdown;

test.describe("Terms and Conditions on Registration", () => {
  test.beforeEach(async ({ page, context }) => {
    registration = new Registration(page, context);
    markdown = new Markdown(page);
    await page.goto(URLs.basket);
    await waitForUpmindBridge(page);
  });
  // interceptTermsAndConditions registers a page.route whose handler does an
  // async page.request.fetch(); without cleanup a short test can end while that
  // fetch is in-flight, erroring as the context closes. Drain routes on teardown.
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "ignoreErrors" });
  });
  test("No terms and conditions set", async ({ page }) => {
    interceptTermsAndConditions(page, null, null, null, null);
    await page.goto(URLs.register);
    await waitForUpmindBridge(page);
    await expect(page.getByTestId("terms-and-conditions")).toBeVisible();
    await expect(page.getByTestId("terms-link")).toHaveCount(0);
  });
  test("Terms and conditions set - Markdown", async ({ page }) => {
    interceptTermsAndConditions(
      page,
      "8d632507-9806-5d1e-36b8-174e234e98d2",
      null,
      null,
      'By clicking "Place order and pay" you agreed to pay pay for this order.'
    );
    await page.goto(URLs.register);
    await waitForUpmindBridge(page);
    await expect(page.getByTestId("terms-and-conditions")).toBeVisible();
    await expect(page.getByTestId("terms-link")).toBeVisible;
    await page.getByTestId("terms-link").click();
    await expect(markdown.markdown).toBeVisible();
  });
  test("Terms and conditions set - URL", async ({ page }) => {
    interceptTermsAndConditions(
      page,
      "47d73824-8507-9315-36f8-1e642d59e063",
      null,
      "https://upmind.com/",
      null
    );
    await page.goto(URLs.register);
    await waitForUpmindBridge(page);
    await expect(page.getByTestId("terms-and-conditions")).toBeVisible();
    const termsLink = page.getByTestId("terms-and-conditions").locator("a");
    await expect(termsLink).toHaveAttribute("href", "https://upmind.com/");
  });
});

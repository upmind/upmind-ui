import { test, expect, BrowserContext } from "@playwright/test";
import { URLs } from "../../support/constants/urls";
import { Registration } from "../../support/page-objects/templates/registration";
import { Markdown } from "../../support/page-objects/components/markdown";
import { interceptTermsAndConditions } from "../../support/mocks/brand";
import { getSessionToken } from "../../support/api/auth";

let registration: Registration;
let markdown: Markdown;

test.describe("Terms and Conditions on Registration", () => {
  let token: string;
  test.beforeEach(async ({ page, context }) => {
    registration = new Registration(page, context);
    markdown = new Markdown(page);
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    token = await getSessionToken(context);
  });
  test("No terms and conditions set", async ({ page }) => {
    await interceptTermsAndConditions(page, token, null, null, null, null);
    await page.goto(URLs.register);
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("terms-and-conditions")).toBeVisible();
    await expect(page.getByTestId("terms-link")).toHaveCount(0);
  });
  test("Terms and conditions set - Markdown", async ({ page }) => {
    await interceptTermsAndConditions(
      page,
      token,
      "8d632507-9806-5d1e-36b8-174e234e98d2",
      null,
      null,
      'By clicking "Place order and pay" you agreed to pay pay for this order.'
    );
    await page.goto(URLs.register);
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("terms-and-conditions")).toBeVisible();
    await expect(page.getByTestId("terms-link")).toBeVisible;
    await page.getByTestId("terms-link").click();
    await expect(markdown.markdown).toBeVisible();
  });
  test("Terms and conditions set - URL", async ({ page }) => {
    await interceptTermsAndConditions(
      page,
      token,
      "47d73824-8507-9315-36f8-1e642d59e063",
      null,
      "https://upmind.com/",
      null
    );
    await page.goto(URLs.register);
    await page.waitForLoadState("networkidle");
    await expect(page.getByTestId("terms-and-conditions")).toBeVisible();
    const termsLink = page.getByTestId("terms-and-conditions").locator("a");
    await expect(termsLink).toHaveAttribute("href", "https://upmind.com/");
  });
});

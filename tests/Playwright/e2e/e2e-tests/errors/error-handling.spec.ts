import { test, expect } from "@playwright/test";
import { ErrorCodes } from "../../support/constants/error-codes";
import { returnError } from "../../support/mocks/errors";
import { URLs } from "../../support/constants/urls";
import { waitForSessionCookie } from "../../support/helpers/session";

/**
 * Error Code Handling Tests
 *
 * These tests verify that the application correctly displays error messages
 * for various HTTP error codes. Each test:
 * 1. Sets up a route intercept to return a specific error
 * 2. Navigates to a product page
 * 3. Verifies the appropriate error UI appears (dialog, redirect, or toast)
 *
 * Note: Tests are run serially to avoid route interference between tests
 */
test.describe("Error Code Handling", () => {
  // Run tests serially to avoid route interference
  test.describe.configure({ mode: "serial" });

  // Clean up routes after each test to prevent interference
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  for (const {
    url,
    route,
    errorCode,
    responseError,
    button,
    errorType
  } of Object.values(ErrorCodes)) {
    test(`Display ${errorCode} error message`, async ({ page }) => {
      // Setup error route interception FIRST, before any navigation
      await returnError(page, route, errorCode, responseError);

      // Navigate directly to the URL that will trigger the error
      await page.goto(url);

      // Wait for page to be ready
      await waitForSessionCookie(page.context());

      if (errorType === "dialog") {
        // Use .first() to handle potential duplicate dialogs from multiple API calls
        const dialog = page.getByTestId("dialog-window").first();
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(responseError.message);
        // Scope button assertion to the dialog to avoid strict mode violations
        await expect(dialog.getByTestId(`button-${button}`)).toBeVisible();
      } else if (errorType === "redirect") {
        await expect(page).toHaveURL(
          `${URLs.baseUrl}order/product/3de78642-de53-9714-76df-21208469530d/not-found/`
        );
      } else if (errorType === "toast") {
        const toast = page
          .getByTestId("sonner-toast")
          .locator("li")
          .filter({ hasText: responseError.message });
        await expect(toast).toBeVisible({ timeout: 10000 });
        await expect(page.url()).toContain(`${URLs.baseUrl}order/product/`);
      } else {
        throw new Error(`Invalid errorType on ErrorCodes: ${errorType}`);
      }
    });
  }
});

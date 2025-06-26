import { test, expect } from "@playwright/test";
import { ErrorCodes } from "../support/constants/errorCodes";

test.describe("Error Code Handling", () => {
  for (const {
    route,
    url,
    errorCode,
    status,
    responseError,
    button,
  } of Object.values(ErrorCodes)) {
    test(`Display ${errorCode} error message`, async ({ page }) => {
      await page.route(route, async route => {
        await route.fulfill({
          status: errorCode,
          contentType: "application/json",
          body: JSON.stringify(responseError),
        });
      });

      await page.goto(url);

      const errorDialog = page.getByRole("dialog");
      await expect(errorDialog).toBeVisible();
      await expect(errorDialog).toContainText(responseError.message);
      await expect(errorDialog.getByTestId(`button-${button}`)).toBeVisible();
    });
  }
});

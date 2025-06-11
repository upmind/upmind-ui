import { test, expect } from "@playwright/test";
import { ErrorCodes } from "../support/constants/errorCodes";

test.describe("Error Code Handling", () => {
  for (const { errorCode, status, responseError } of Object.values(
    ErrorCodes
  )) {
    test(`Display ${errorCode} error message`, async ({ page }) => {
      await page.route("**/api/config/organisation/values*", async route => {
        await route.fulfill({
          status: errorCode,
          contentType: "application/json",
          body: JSON.stringify(responseError),
        });
      });

      await page.goto(
        "http://qa-automation.local:5173/product/add/3de78642-de53-9714-76df-21208469530d"
      );

      const errorDialog = page.getByRole("dialog");
      await expect(errorDialog).toBeVisible();
      await expect(errorDialog).toContainText(responseError.message);
      await expect(errorDialog.getByTestId("button-reload-page")).toBeVisible();
    });
  }
  test("Display 404 error message", async ({ page }) => {
    await page.goto(
      "http://qa-automation.local:5173/product/add/3de78642-de53-9714-76df-21208469530dzzz"
    );
    const errorDialog = page.getByRole("dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText("Product not found");
    await expect(
      errorDialog.getByTestId("button-continue-shopping")
    ).toBeVisible();
  });
  test("Display 403 error message", async ({ page }) => {
    await page.goto(
      "http://qa-automation.local:5173/product/add/5d085e69-d562-3719-7d6f-218e940d4237"
    );
    const errorDialog = page.getByRole("dialog");
    await expect(errorDialog).toBeVisible();
    await expect(errorDialog).toContainText("Product not found");
    await expect(
      errorDialog.getByTestId("button-continue-shopping")
    ).toBeVisible();
  });
});

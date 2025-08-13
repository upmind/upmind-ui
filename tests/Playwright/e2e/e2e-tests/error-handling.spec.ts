import { test, expect } from "@playwright/test";
import { ErrorCodes } from "../support/constants/errorCodes";
import { returnError } from "../support/utils/functions/errors";
import { getSessionToken } from "../support/utils/functions/tokens";
import {
  getCurrentOrderId,
  setOrderCurrency
} from "../support/utils/functions/basket";
import { URLs } from "../support/constants/urls";

test.describe("Error Code Handling", () => {
  let token: string;
  let orderId: string | null;
  test.beforeEach(async ({ page, context }) => {
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    token = await getSessionToken(context, "guest");
    orderId = await getCurrentOrderId(token);
    setOrderCurrency(token, orderId, "USD");
  });
  for (const { url, route, errorCode, responseError, button } of Object.values(
    ErrorCodes
  )) {
    test(`Display ${errorCode} error message`, async ({ page }) => {
      await page.goto(url);
      returnError(page, route, errorCode, responseError);
      const errorDialog = page.getByRole("dialog");
      await expect(errorDialog).toBeVisible();
      await expect(errorDialog).toContainText(responseError.message);
      await expect(errorDialog.getByTestId(`button-${button}`)).toBeVisible();
    });
  }
});

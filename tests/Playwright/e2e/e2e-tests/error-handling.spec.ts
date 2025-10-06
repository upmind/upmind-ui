import { test, expect } from "@playwright/test";
import { ErrorCodes } from "../support/constants/errorCodes";
import { returnError } from "../support/utils/functions/errors";
import { getSessionToken } from "../support/utils/functions/tokens";
import {
  getCurrentOrderId,
  setOrderCurrency
} from "../support/utils/functions/basket";

import { URLs } from "../support/constants/urls";

test.describe("Error Code Handling", async () => {
  let token: string;
  let orderId: string | null;
  test.beforeEach(async ({ page, context }) => {
    await page.goto(URLs.basket);
    await page.waitForLoadState("networkidle");
    token = await getSessionToken(context, "guest");
    orderId = await getCurrentOrderId(token);
    setOrderCurrency(token, orderId, "USD");
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
      await returnError(page, route, errorCode, responseError);
      await page.goto(url);
      await page.waitForLoadState("domcontentloaded");
      if (errorType === "dialog") {
        const dialog = page.getByRole("dialog");
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(responseError.message);
        await expect(page.getByTestId(`button-${button}`)).toBeVisible();
      } else if (errorType === "redirect") {
        await expect(page).toHaveURL(
          `${URLs.baseUrl}order/product/not-found/?pid=3de78642-de53-9714-76df-21208469530d`
        );
      } else if (errorType === "toast") {
        const toast = page.getByRole("status").first();
        await expect(toast).toBeVisible();
        await expect(toast).toContainText(`${responseError.message}`);
        await expect(page.url()).toContain(`${URLs.baseUrl}order/product/add/`);
      } else {
        throw new Error(`Invalid errorType on ErrorCodes: ${errorType}`);
      }
    });
  }
});

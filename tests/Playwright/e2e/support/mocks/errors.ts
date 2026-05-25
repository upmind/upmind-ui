import { Page } from "@playwright/test";

export async function returnError(
  page: Page,
  route: string | RegExp,
  errorCode: number,
  responseError: {
    id: string | null;
    type: number;
    code: string | number;
    message: string;
  }
) {
  await page.route(route, async route => {
    await route.fulfill({
      status: errorCode,
      contentType: "application/json",
      body: JSON.stringify({
        status: "error",
        data: null,
        total: null,
        error: {
          id: responseError.id,
          type: responseError.type,
          code: responseError.code,
          message: responseError.message,
          data: null
        },
        messages: {
          hint: "This error was produced by the Playwright Test Runner"
        }
      })
    });
  });
}

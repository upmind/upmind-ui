import { Page } from "@playwright/test";

export async function returnError(
  page: Page,
  route: string,
  errorCode: number,
  responseError: {
    id: null;
    type: number;
    code: string | number;
    message: string;
    data: null;
  }
) {
  await page.route(route, async route => {
    await route.fulfill({
      status: errorCode,
      contentType: "application/json",
      body: JSON.stringify(responseError)
    });
  });
}

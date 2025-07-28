import { test as base, Page, BrowserContext } from "@playwright/test";

export const test = base.extend<{
  context: BrowserContext;
  page: Page;
}>({
  context: async ({ browser }, use) => {
    const context = await browser.newContext();
    await use(context);
    await context.close();
  },
  page: async ({ context }, use) => {
    const page = await context.newPage();
    await use(page);
  }
});

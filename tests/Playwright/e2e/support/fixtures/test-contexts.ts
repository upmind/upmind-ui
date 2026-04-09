import { test as base, BrowserContext, Page } from "@playwright/test";

type TestFixtures = {
  context: BrowserContext;
  page: Page;
};

export const test = base.extend<TestFixtures>({
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

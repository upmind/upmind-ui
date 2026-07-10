// e2e/support/fixtures/auth-context.ts
import { test as base, type Page } from "@playwright/test";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Confirmation } from "../page-objects/templates/confirmation";
import {
  loginViaHeadless,
  registerClientViaHeadless
} from "../flows/auth-setup";
import type { HeadlessRegisteredClient } from "../flows/auth-setup";
import { URLs } from "../constants/urls";
export { expect } from "@playwright/test";

export const newUser = base.extend<{
  checkout: Checkout;
  confirmation: Confirmation;
  user: HeadlessRegisteredClient;
  clientId: string;
  _authReady: void;
}>({
  checkout: async (
    { page }: { page: Page },
    use: (r: Checkout) => Promise<void>
  ) => {
    await use(new Checkout(page));
  },
  confirmation: async ({ page }, use) => {
    await use(new Confirmation(page));
  },
  user: async (
    { page }: { page: Page },
    use: (r: HeadlessRegisteredClient) => Promise<void>
  ) => {
    await page.goto(URLs.baseUrl);
    await use(await registerClientViaHeadless(page));
  },
  clientId: async ({ user }, use) => {
    await use(user.id);
  },
  /* Playwright fixtures are lazy — they only resolve when something downstream requests them.
    Depend on `user` (which registers and auto-logs-in) so auth is always ready. */
  _authReady: [
    async ({ user }, use) => {
      void user;
      await use();
    },
    { auto: true }
  ]
});

export const registeredUser = base.extend<{
  checkout: Checkout;
  confirmation: Confirmation;
  session: void;
  userLogin: string;
  userPassword: string;
  loginAs: (username: string, password: string) => Promise<void>;
  _authReady: void;
}>({
  userLogin: ["", { option: true }],
  userPassword: ["", { option: true }],
  checkout: async (
    { page }: { page: Page },
    use: (r: Checkout) => Promise<void>
  ) => {
    await use(new Checkout(page));
  },
  confirmation: async ({ page }, use) => {
    await use(new Confirmation(page));
  },
  session: async (
    {
      page,
      userLogin,
      userPassword
    }: {
      page: Page;
      userLogin: string;
      userPassword: string;
    },
    use: (r: void) => Promise<void>
  ) => {
    await page.goto(URLs.baseUrl);
    // This auto-fixture (via _authReady) runs for every test using this base,
    // including ones that authenticate per-test via `loginAs` and leave the
    // userLogin/userPassword options at their "" sentinel. Only log in when
    // credentials were actually provided via `test.use({ userLogin, ... })`.
    if (userLogin && userPassword) {
      await loginViaHeadless(page, userLogin, userPassword);
    }
    await use();
  },
  loginAs: async (
    { page }: { page: Page },
    use: (
      r: (username: string, password: string) => Promise<void>
    ) => Promise<void>
  ) => {
    await use(async (username: string, password: string) => {
      await page.goto(URLs.baseUrl);
      await loginViaHeadless(page, username, password);
    });
  },
  /* Playwright fixtures are lazy — they only resolve when something downstream requests them.
    To ensure session is always passed, we run this auto-fixture */
  _authReady: [
    async ({ session }, use) => {
      void session;
      await use();
    },
    { auto: true }
  ]
});

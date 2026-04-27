// e2e/support/fixtures/auth-context.ts
import { test as base, type Page, type BrowserContext } from "@playwright/test";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Confirmation } from "../page-objects/templates/confirmation";
import {
  getClientToken,
  getSessionToken,
  registerClient,
  getCurrentOrder
} from "../../support/api/index";
import { waitForSessionCookie } from "../helpers/session";
import { URLs } from "../constants/urls";
export { expect } from "@playwright/test";

export const newUser = base.extend<{
  checkout: Checkout;
  confirmation: Confirmation;
  session: any;
  token: string;
}>({
  checkout: async (
    { page, session }: { page: Page; session: any },
    use: (r: Checkout) => Promise<void>
  ) => {
    await use(new Checkout(page));
  },
  confirmation: async ({ page }, use) => {
    await use(new Confirmation(page));
  },
  session: async (
    { page, context }: { page: Page; context: BrowserContext },
    use: (r: any) => Promise<void>
  ) => {
    await page.goto(URLs.baseUrl);
    await waitForSessionCookie(context);
    const guestToken = await getSessionToken(context);
    const user = await registerClient(guestToken);
    const session = await getClientToken(page, user.email, user.password);
    await use(session);
  },
  token: async (
    { session }: { session: any },
    use: (r: string) => Promise<void>
  ) => {
    await use(session?.access_token);
  }
});

export const registeredUser = base.extend<{
  checkout: Checkout;
  confirmation: Confirmation;
  session: any;
  token: string;
  userLogin: string;
  userPassword: string;
  loginAs: (username: string, password: string) => Promise<any>;
}>({
  userLogin: ["", { option: true }],
  userPassword: ["", { option: true }],
  checkout: async (
    { page, session }: { page: Page; session: any },
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
      context,
      userLogin,
      userPassword
    }: {
      page: Page;
      context: BrowserContext;
      userLogin: string;
      userPassword: string;
    },
    use: (r: any) => Promise<void>
  ) => {
    await page.goto(URLs.baseUrl);
    await waitForSessionCookie(context);
    const session = await getClientToken(page, userLogin, userPassword);
    await use(session);
  },
  token: async (
    { session }: { session: any },
    use: (r: string) => Promise<void>
  ) => {
    await use(session?.access_token);
  },
  loginAs: async (
    { page, context }: { page: Page; context: BrowserContext },
    use: (
      r: (username: string, password: string) => Promise<any>
    ) => Promise<void>
  ) => {
    await use(async (username: string, password: string) => {
      await page.goto(URLs.baseUrl);
      await waitForSessionCookie(context);
      return await getClientToken(page, username, password);
    });
  }
});

// e2e/support/fixtures/auth-context.ts
import {
  test as base,
  request,
  expect,
  type Page,
  type BrowserContext
} from "@playwright/test";
import { Checkout } from "../../support/page-objects/templates/checkout";
import { Confirmation } from "../page-objects/templates/confirmation";
import {
  getClientToken,
  getSessionToken,
  registerClient,
  getCurrentOrder
} from "../../support/api/index";
import { URLs } from "../constants/urls";
export { expect } from "@playwright/test";

export const newUserSession = base.extend<{
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
    await expect
      .poll(
        async () => {
          const cookies = await context.cookies();
          return cookies.some(
            c =>
              c.name === "upm_guest_session" || c.name === "upm_client_session"
          );
        },
        { timeout: 30000 }
      )
      .toBeTruthy();
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

export const existingUserSession = base.extend<{
  checkout: Checkout;
  confirmation: Confirmation;
  session: any;
  token: string;
  orderId: string;
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
    await expect
      .poll(
        async () => {
          const cookies = await context.cookies();
          return cookies.some(
            c =>
              c.name === "upm_guest_session" || c.name === "upm_client_session"
          );
        },
        { timeout: 30000 }
      )
      .toBeTruthy();
    const session = await getClientToken(page, userLogin, userPassword);
    await use(session);
  },
  token: async (
    { session }: { session: any },
    use: (r: string) => Promise<void>
  ) => {
    await use(session?.access_token);
  },
  orderId: async (
    { token }: { token: string },
    use: (r: string) => Promise<void>
  ) => {
    const order = await getCurrentOrder(token);
    await use(order?.id as string);
  },
  loginAs: async (
    { page, context }: { page: Page; context: BrowserContext },
    use: (
      r: (username: string, password: string) => Promise<any>
    ) => Promise<void>
  ) => {
    await use(async (username: string, password: string) => {
      await page.goto(URLs.baseUrl);
      await expect
        .poll(
          async () => {
            const cookies = await context.cookies();
            return cookies.some(
              c =>
                c.name === "upm_guest_session" ||
                c.name === "upm_client_session"
            );
          },
          { timeout: 30000 }
        )
        .toBeTruthy();
      return await getClientToken(page, username, password);
    });
  }
});

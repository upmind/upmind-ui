// e2e/support/fixtures/auth-context.ts
import { test as base, request, Page, BrowserContext } from "@playwright/test";
import { URLs } from "../constants/urls";

type Credentials = {
  username: string;
  password: string;
};
type AuthFixtures = {
  authenticatedPage: (credentials: Credentials) => Promise<Page>;
};
export const authenticatedUserTest = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const contexts: BrowserContext[] = [];
    const factory = async (credentials: Credentials) => {
      const apiContext = await request.newContext();
      const response = await apiContext.post(
        "https://api.staging.upmind.io/oauth/access_token",
        {
          headers: {
            accept: "*/*",
            "content-type": "application/json",
            origin: URLs.baseUrl,
            referer: URLs.baseUrl
          },
          data: {
            currency_id: "3825d96e-763e-d091-3dc4-174825283406",
            grant_type: "password",
            password: credentials.password,
            username: credentials.username
          }
        }
      );
      const json = await response.json();
      const context = await browser.newContext();
      await context.addCookies([
        {
          name: "upm_client_session",
          value: JSON.stringify(json),
          domain: "qa-automation.local",
          path: "/",
          httpOnly: false,
          secure: false,
          sameSite: "Lax"
        }
      ]);
      contexts.push(context);
      return await context.newPage();
    };
    await use(factory);
    for (const ctx of contexts) {
      await ctx.close();
    }
  }
});
export { expect } from "@playwright/test";

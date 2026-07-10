import type { Page } from "@playwright/test";
import { faker } from "@faker-js/faker";
import { waitForUpmindBridge } from "./headless-bridge";

/** Optional overrides for headless client registration. */
export type HeadlessRegisterOptions = {
  /** Override the email address (default: auto-generated). */
  email?: string;
  /** Override the first name (default: faker-generated). */
  firstname?: string;
  /** Override the last name (default: faker-generated). */
  lastname?: string;
  /** Override the password (default: "Password1!"). */
  password?: string;
};

/** The registered client's details, as consumed by fixtures. */
export type HeadlessRegisteredClient = {
  /** The email used to register (carried in the auth `username`). */
  email: string;
  /** The password used to register. */
  password: string;
  /** The registered client's id. */
  id: string;
};

/**
 * Registers a new client by driving the REAL headless auth composable inside
 * the page, sharing the app's session (the FE-2784 requirement).
 *
 * Registration auto-logins on success, so the browser is left authenticated as
 * the new client — call sites that previously followed with a token fetch no
 * longer need a separate login step.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param options - Optional overrides for the registration fields.
 * @returns The registered client's email, password, and id.
 */
export async function registerClientViaHeadless(
  page: Page,
  options: HeadlessRegisterOptions = {}
): Promise<HeadlessRegisteredClient> {
  const email =
    options.email ??
    `nathan.robinson+${faker.string.alpha({ length: 10 })}@upmind.com`;
  const password = options.password ?? "Password1!";
  const firstname = options.firstname ?? faker.person.firstName();
  const lastname = options.lastname ?? faker.person.lastName();

  await waitForUpmindBridge(page);
  const id = await page.evaluate(
    async ({ email, firstname, lastname, password }) => {
      if (!window.Upmind?.useAuth || !window.Upmind?.useActiveSession) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      const actions = window.Upmind.useAuth()
        .as(window.Upmind.ScopeActorTypes.CLIENT)
        .useActions();
      if (!("registerAsGuest" in actions)) {
        throw new Error(
          "registerClientViaHeadless: client auth actions unavailable"
        );
      }
      await actions.isReady();
      const started = await actions.start("register");
      if (!started) {
        throw new Error(
          `registerClientViaHeadless: could not enter the register flow for ${email}`
        );
      }
      const registered = await actions.resolve({
        username: email,
        firstname,
        lastname,
        password
      });
      if (!registered) {
        throw new Error(
          `registerClientViaHeadless: registration failed for ${email}`
        );
      }
      // resolve() settles at machine-`authenticated`, but the session store
      // promotes the client only after an un-awaited `loadUser()`, so
      // `activeActor` is still guest for a beat and isAuthenticated() throws
      // until the promotion lands. Retry until it does.
      const session = window.Upmind.useActiveSession();
      const deadline = Date.now() + 30000;
      for (;;) {
        try {
          const user = await session.useActions().isAuthenticated();
          return user.id;
        } catch (error) {
          if (Date.now() > deadline) throw error;
          await new Promise(resolve => setTimeout(resolve, 250));
        }
      }
    },
    { email, firstname, lastname, password }
  );

  return { email, password, id };
}

/**
 * Logs in an existing client by driving the REAL headless auth composable
 * inside the page.
 *
 * @param page - The Playwright page (the live system lives on its `window`).
 * @param username - The login username (an email).
 * @param password - The login password.
 */
export async function loginViaHeadless(
  page: Page,
  username: string,
  password: string
): Promise<void> {
  await waitForUpmindBridge(page);
  await page.evaluate(
    async ({ username, password }) => {
      if (!window.Upmind?.useAuth || !window.Upmind?.useActiveSession) {
        throw new Error(
          "window.Upmind not exposed — is the cart running in test mode (pnpm start:test)?"
        );
      }
      const actions = window.Upmind.useAuth()
        .as(window.Upmind.ScopeActorTypes.CLIENT)
        .useActions();
      if (!("registerAsGuest" in actions)) {
        throw new Error("loginViaHeadless: client auth actions unavailable");
      }
      await actions.isReady();
      const started = await actions.start("login");
      if (!started) {
        throw new Error(
          `loginViaHeadless: could not enter the login flow for ${username}`
        );
      }
      const success = await actions.resolve({ username, password });
      if (!success) {
        throw new Error(`loginViaHeadless: login failed for ${username}`);
      }
      // resolve() settles at machine-`authenticated` (token obtained), but
      // loading the user + promoting the active session guest→client is the
      // session store's job and lands a beat later. Await that promotion
      // deterministically (resolves once the user is loaded) instead of
      // checking isAuthenticated() one tick too early.
      const session = window.Upmind.useActiveSession();

      const user = await session.useActions().whenAuthenticated();
      if (!user) {
        throw new Error(
          `loginViaHeadless: session not authenticated for ${username}`
        );
      }
    },
    { username, password }
  );
}

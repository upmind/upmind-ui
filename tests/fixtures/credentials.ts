/**
 * @fileoverview Shared API credentials for fixture generation
 *
 * These credentials are ONLY used for generating test fixtures from the API.
 * They are NOT included in the actual fixtures (fixtures are sanitized before saving).
 *
 * **Important:** These are test environment credentials and should NEVER be committed
 * to production or used outside of test fixture generation.
 */

export const API_CREDENTIALS = {
  client: {
    username: "nathan.robinson+checkouttest@upmind.com",
    password: "bnd0ATW-udt3bxr0zmw"
  },
  staff: {
    username: "nathan.robinson+staffuser@upmind.com",
    password: "password123"
  },
  // A SECOND, distinct client on the same staging brand — used only to capture a
  // real ownership denial (GET another client's basket → 403/404). Sourced from
  // the existing staging test accounts in
  // tests/Playwright/e2e/support/constants/logins.ts (the `english` locale
  // client). Never owns the checkout basket, so it can never convert it.
  otherClient: {
    username: "nathan.robinson+english@upmind.com",
    password: "Password1"
  }
};

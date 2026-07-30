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
  }
};

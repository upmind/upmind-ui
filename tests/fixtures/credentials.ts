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
  },
  /**
   * A delegate PAIR on the same staging brand, registered for FE-3036.
   *
   * `delegateOwner` has granted `delegateMember` full account access, so
   * `delegateMember`'s `/self` returns a POPULATED `delegated_ids` — the only
   * account on staging that does. Every other recorded `/self` in this repo
   * carries `null`, which is why the populated path had no fixture.
   *
   * The grant was made through the ORDINARY client-portal path: owner invites
   * by email, the invite lands in the member's own email history, the member
   * accepts via `/delegate_access/accept/{hash}`. No admin, no `skip_invite`.
   * `tests/fixtures/record-delegates.ts` reproduces it end-to-end.
   *
   * Today the grant is account-level only, so `delegated_ids` carries the
   * `client` key alone. The `contracts_product` and `ticket` keys need the
   * owner to hold a product / ticket to delegate — that rides FE-3041 (DG-2),
   * which owns per-product and per-ticket grants.
   */
  delegateOwner: {
    username: "nathan.robinson+delegateowner@upmind.com",
    password: "Password1"
  },
  delegateMember: {
    username: "nathan.robinson+delegatemember@upmind.com",
    password: "Password1"
  }
};

import { Page, Route } from "@playwright/test";
import {
  AccessRoleTypes,
  GrantTypes,
  TwofaProviders
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * @module mocks/two-factor
 *
 * Two tightly-scoped stubs on the shared `oauth/access_token` endpoint, each
 * keyed off the request's `grant_type` so everything they don't name falls
 * through to the real staging API:
 *   • `mockTwoFactorVerifySuccess`   — stubs `grant_type=twofa` (verify OK)
 *   • `mockEmailTwoFactorChallenge`  — stubs `grant_type=password` (EMAIL challenge)
 *
 * ## ⚠️ Documented P4 exception (mocking journey outcomes)
 * `mockTwoFactorVerifySuccess` mocks the *success* outcome of the 2FA verify
 * call — normally journey data we never mock (e2e rule P4). The exception is
 * deliberate and agreed: EMAIL-provider 2FA issues a random, server-sent code to
 * the account's inbox, there is no test-inbox in the suite, and the owner's
 * directive is explicitly "no mail-catcher, no mail reading". The happy path is
 * therefore impossible to drive with real data, so a deterministic mock is the
 * only way to give the login+verify flow a regression safety net. The success
 * body mirrors the real oauth token shape (a flat token — `post()` unwraps
 * `body.data || body`, and the endpoint replies with the token at the top
 * level). `actor_type: CLIENT` (not `twofa`) is what tells the session flow the
 * challenge is satisfied and a full client session is now held.
 *
 * ## Why the EMAIL challenge is mocked (FE-2794)
 * Per-user EMAIL 2FA does not exist — a user's 2FA is always TOTP, and the EMAIL
 * provider is a brand-wide switch forbidden on staging — so no real login can
 * return `twofa_provider: "Email"`. `mockEmailTwoFactorChallenge` flips *only*
 * the provider field of a real captured challenge (see its provenance note) so
 * the machine's EMAIL branch (`isEmailTwofa` → `clear2faToken`, FE-2638) becomes
 * reachable. Crucially the FAILURE path stays real: the challenge is mocked, but
 * the wrong-code `grant_type=twofa` verify is NOT — it hits the real API, is
 * rejected, and the genuine frontend clear-on-fail is what the spec asserts.
 */
// -----------------------------------------------------------------------------

// Login and 2FA-verify both POST here; the grant_type in the body is the only
// discriminator, so the route inspects it before deciding to stub.
const TOKEN_URL = "**/oauth/access_token**";

// -----------------------------------------------------------------------------
// EMAIL-provider challenge (FE-2794)
//
// Per-user EMAIL 2FA does not exist: a user's 2FA is always TOTP, and the EMAIL
// provider is a brand-wide switch that is forbidden on staging. So no real login
// can return `twofa_provider: "Email"`, and the EMAIL clear-on-fail path
// (auth.machine `isEmailTwofa` → `clear2faToken`, FE-2638) is unreachable with
// real data. This challenge supplies exactly that provider.
//
// PROVENANCE: this body is the grant_type=password challenge captured from a
// real `Logins.twoFactor` login against staging (2026-07-11). The ONE
// behaviourally-load-bearing delta from that capture is the provider:
//   twofa_provider "TOTP"  →  TwofaProviders.EMAIL
// which is what makes the machine take the EMAIL branch. Every other field
// (actor_type "twofa", `second_factor_required`, expiries) is the untouched
// staging shape. The only non-provider change is `access_token`: the capture's
// real 300s challenge JWT is redacted to an inert placeholder (matching the
// `mock-2fa-*` token idiom above) so no live credential is committed. That
// placeholder is deliberately unusable — the wrong-code VERIFY in the failure
// spec sends it to the REAL oauth endpoint, which rejects it, driving the
// genuine frontend clear-on-fail. Only grant_type=password is stubbed; the
// grant_type=twofa verify (and everything else) falls through to the real API.
// -----------------------------------------------------------------------------
const emailChallengeToken = {
  second_factor_required: true,
  password_change_required: false,
  refresh_expires_in: null,
  actor_id: "04038696-e547-21d5-6d5a-518d9305e7d2",
  actor_type: "twofa",
  // ── ONE-FIELD DELTA (FE-2794): captured value was "TOTP". ──
  twofa_provider: TwofaProviders.EMAIL,
  token_type: "Bearer",
  expires_in: 300,
  // Redacted: the capture held a real (now-expired) 2FA challenge JWT here.
  access_token: "mock-2fa-challenge-token"
};

const successToken = {
  access_token: "mock-2fa-access-token",
  refresh_token: "mock-2fa-refresh-token",
  token_type: "Bearer",
  expires_in: 28800,
  refresh_expires_in: 28800,
  actor_type: AccessRoleTypes.CLIENT,
  second_factor_required: false,
  twofa_provider: TwofaProviders.EMAIL
};

function grantTypeOf(route: Route): string | undefined {
  try {
    return JSON.parse(route.request().postData() ?? "{}").grant_type;
  } catch {
    return undefined;
  }
}

/**
 * Stub ONLY the 2FA verify call (`grant_type=twofa`) on the shared
 * oauth/access_token endpoint, returning a successful client token. The
 * preceding real password login, CORS preflight, refresh and every other grant
 * fall through to the real API untouched.
 */
export async function mockTwoFactorVerifySuccess(page: Page) {
  await page.route(TOKEN_URL, async (route: Route) => {
    if (route.request().method() !== "POST") return route.fallback();
    if (grantTypeOf(route) !== GrantTypes.TWOFA) return route.fallback();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(successToken)
    });
  });
}

/**
 * Stub ONLY the password login (`grant_type=password`) on the shared
 * oauth/access_token endpoint, returning the EMAIL-provider 2FA challenge
 * (`emailChallengeToken`) so the flow enters the challenge with
 * `twofa_provider: "Email"` — a state no real staging account can produce
 * (see the provenance note above). Every other grant, including the
 * `grant_type=twofa` verify, falls through to the real API untouched, so a
 * subsequent wrong-code verify is rejected for real and exercises the genuine
 * `clear2faToken` clear-on-fail path (FE-2638 / FE-2794).
 */
export async function mockEmailTwoFactorChallenge(page: Page) {
  await page.route(TOKEN_URL, async (route: Route) => {
    if (route.request().method() !== "POST") return route.fallback();
    if (grantTypeOf(route) !== GrantTypes.PASSWORD) return route.fallback();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(emailChallengeToken)
    });
  });
}

import { Page, Route } from "@playwright/test";

// -----------------------------------------------------------------------------
/**
 * @module mocks/verify-email
 *
 * ## ⚠️ Documented P4 exception (mocking journey outcomes)
 * These helpers mock the verify-code and resend outcomes — normally journey data
 * we never mock (e2e rule P4). The exception is deliberate and agreed: there is
 * no test-inbox in the suite and verification codes are random/server-issued, so
 * the success path is impossible to drive with real data. Email verification is
 * an uncommon, easy-to-miss feature; deterministic mocks are the only way to give
 * it a regression safety net. The gate (brand flag) and the routing/guard
 * behaviour are still exercised against real settings — only the verify/resend
 * *responses* are stubbed here.
 *
 * Response envelopes mirror the real API: success is the real `verification_code/
 * verify` shape (`{ status: "ok", data: null }`); failure uses the standard error
 * envelope so `setError` maps it the same way the real backend would.
 */
// -----------------------------------------------------------------------------

const VERIFY_URL = "**/verification_code/verify**";
const RESEND_URL = "**/clients/resend_verification**";

const okBody = JSON.stringify({
  status: "ok",
  data: null,
  related: null,
  total: null,
  error: null,
  messages: [],
  meta: null
});

const errorBody = (code: number, message: string) =>
  JSON.stringify({
    status: "error",
    data: null,
    total: null,
    error: { id: null, type: 1, code, message, data: null },
    messages: []
  });

async function fulfil(
  route: Route,
  outcome: "success" | "failure",
  failureCode: number,
  failureMessage: string
) {
  // Let CORS preflight through untouched.
  if (route.request().method() === "OPTIONS") return route.fallback();
  await route.fulfill(
    outcome === "success"
      ? { status: 200, contentType: "application/json", body: okBody }
      : {
          status: failureCode,
          contentType: "application/json",
          body: errorBody(failureCode, failureMessage)
        }
  );
}

/** Stub the verify-code endpoint. `success` → 200; `failure` → 403 (matches the
 * real staging response for an invalid code). */
export async function mockVerifyCode(
  page: Page,
  outcome: "success" | "failure"
) {
  await page.route(VERIFY_URL, route =>
    fulfil(route, outcome, 403, "The verification code you entered is invalid.")
  );
}

/** Stub the resend (send_verify) endpoint. `success` → 200; `failure` → 500. */
export async function mockResendVerification(
  page: Page,
  outcome: "success" | "failure"
) {
  await page.route(RESEND_URL, route =>
    fulfil(route, outcome, 500, "Could not resend the verification code")
  );
}

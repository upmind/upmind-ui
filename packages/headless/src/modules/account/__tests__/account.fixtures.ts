// -----------------------------------------------------------------------------
/**
 * @fileoverview Account Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real endpoints the `account` module hits and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir —
 * the same files the account integration tests replay through MSW. Run on
 * demand:
 *
 *   pnpm fixtures:generate account
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix (see the package vitest configs). It has
 * no assertions: an `it()` succeeds when the capture completes. `save()` in
 * `afterAll` writes every capture once.
 *
 * ## Documented omissions
 * - `clients/{id}/complete_registration` and `PUT clients/{id}` (guest email
 *   update) are NOT captured: both mutate the shared staging test account's
 *   credentials/email when run against a registered client, and a dedicated
 *   guest-customer client does not exist yet. Test layer to decide.
 * - `clients/verification_code/verify` happy path is NOT capturable — the real
 *   code only arrives by email. Only the invalid-code error variant is
 *   recorded.
 * - `GET /self` is ALSO captured here as its own copy (ADR-025 §A1.3: each
 *   unit owns its own copy) even though `session-store`'s service owns the
 *   endpoint — account needs it as D2 input material. Account's profile read
 *   proper is `GET clients/{id}`, captured separately below.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

// Mirrors session-store.fixtures.ts's SELF_QUERY exactly (ADR-025: each unit
// owns its own copy) so this unit's D2 input material matches the envelope
// shape the real service requests.
const SELF_QUERY =
  "with_count=actor.child_client_configs&with=" +
  [
    "actor",
    "actor.account",
    "actor.brand",
    "actor.image",
    "actor.parent_client_config.parent_client",
    "actor.parent_client_config.parent_client.image",
    "accounts",
    "delegated_ids",
    "enabled_modules"
  ].join();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set it " +
          "in .env.recording). The API resolves the brand from the Origin " +
          'header; without it every call returns 404 "Domain not found!".'
      );
    })();

// -----------------------------------------------------------------------------

/**
 * Mint a REAL (unsanitised) token outside the capture pipeline. The Generator
 * only ever returns sanitised bodies, so credentials for authed captures must
 * come from a plain fetch that never touches disk.
 */
async function mintToken(
  grant: Record<string, string>
): Promise<IToken | undefined> {
  const response = await fetch(`${API_URL}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Origin: ORIGIN
    },
    body: new URLSearchParams(grant).toString()
  });
  const body = await response.json().catch(() => null);
  const token = (body?.access_token ? body : body?.data) as IToken | undefined;
  return token?.access_token ? token : undefined;
}

/** Resolve the authed client's id from `/self` (not captured). */
async function fetchClientId(accessToken: string): Promise<string | undefined> {
  const response = await fetch(`${API_URL}/api/self?with=actor`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const body = await response.json().catch(() => null);
  return body?.data?.actor?.id ?? body?.data?.id;
}

// -----------------------------------------------------------------------------

describe("Account API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "account"
    });

    const token = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.client.username,
      password: API_CREDENTIALS.client.password
    });
    if (!token) {
      throw new Error(
        "Could not mint a client token with the staging credentials — " +
          "check tests/fixtures/credentials.ts against the recording brand."
      );
    }
    clientToken = token;

    const id = await fetchClientId(clientToken.access_token);
    if (!id) {
      throw new Error(
        "Could not resolve the client id from /self — cannot capture the " +
          "clients/{id} profile fixtures."
      );
    }
    clientId = id;
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/self (200, client)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/self?${SELF_QUERY}`);
    generator.clearBearerToken();
  });

  it("captures GET /api/clients/{id} (200, profile read)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/clients/${clientId}`);
    generator.clearBearerToken();
  });

  it("captures GET /api/clients/{id} unauthenticated (401)", async () => {
    generator.clearBearerToken();
    await generator.get(`/api/clients/${clientId}?case=unauthenticated`);
  });

  it("captures GET /api/clients_fields (200, order-form filter)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get("/api/clients_fields?filter[show_on_order_form]=true");
    generator.clearBearerToken();
  });

  it("captures POST /api/clients/resend_verification", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.post("/api/clients/resend_verification");
    generator.clearBearerToken();
    if (status !== 200) {
      console.warn(
        `[account.fixtures] resend_verification returned ${status} — kept ` +
          "(honest capture; the test account's email may already be verified)."
      );
    }
  });

  // NB: staging answers 204 even for a bogus code on an already-verified
  // account — the invalid-code 4xx variant is NOT producible with this account.
  it("captures POST /api/clients/verification_code/verify with a bad code", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.post(
      "/api/clients/verification_code/verify",
      { code: "000000" }
    );
    generator.clearBearerToken();
    if (status < 400) {
      console.warn(
        `[account.fixtures] bad verification code returned ${status}, ` +
          "expected 4xx — inspect the capture before committing."
      );
    }
  });
});

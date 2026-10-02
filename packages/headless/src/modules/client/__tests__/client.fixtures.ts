// -----------------------------------------------------------------------------
/**
 * @fileoverview Client API Fixtures Generator (ADR 025 §A1.3, ADR 035)
 *
 * ## Job To Be Done
 * Record, against real staging, the accounts read the `client` module's mapper
 * unit (`client.mappers.test.ts`) transforms into the primary-account slice of
 * `ClientRecord`. The mapper reads two shapes of the one client record: the
 * `custom_fields` read (`fixtures/get-clients-id.json`, maintained alongside the
 * other client-record fixtures) and this `accounts` read. Both are genuine
 * `clients/{id}` GETs whose id-templated identity is otherwise identical, so the
 * accounts read carries `case=accounts` to keep it a distinct file — the
 * `client-personal-details` generator's `case=not-found` precedent.
 *
 *   pnpm fixtures:generate client
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — EXCLUDED from the normal suites by the `*.fixtures.ts` suffix.
 * It has no assertions: an `it()` succeeds when the capture completes.
 *
 * ## Staging hygiene
 * Read-only: it mints a client token and issues one GET. It mutates nothing, so
 * it leaves the shared staging client exactly as it was found.
 */

import { join } from "node:path";
import { describe, it, beforeAll } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
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

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set " +
          "it in .env.recording). The API resolves the brand from the " +
          'Origin header; without it every call returns 404 "Domain not found!".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

/** The account read the billing-settings surface makes, re-used by the mapper. */
const ACCOUNTS_WITH = "with=accounts,accounts.currency";

// -----------------------------------------------------------------------------

async function fetchClientId(accessToken: string): Promise<string | undefined> {
  const response = await fetch(`${API_URL}/api/self?with=actor`, {
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    }
  });
  const body = await response.json().catch(() => null);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  return data?.actor?.id ?? data?.id;
}

// -----------------------------------------------------------------------------

describe("Client API Fixtures Generator — flat capture", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client"
    });
    clientToken = await mintClientToken();
    const id = await fetchClientId(clientToken.access_token);
    if (!id) throw new Error("Could not resolve the client id from /self.");
    clientId = id;
  }, 30000);

  // The account read of the one client record. `case=accounts` keeps it a
  // distinct file from the custom_fields read, whose id-templated path is
  // otherwise identical (`with` is excluded from the fixture identity).
  it("captures GET /api/clients/{id} with accounts (the mapper's primary-account input)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}?${ACCOUNTS_WITH}&case=accounts`
    );
    generator.clearBearerToken();
    generator.save();
    if (status !== 200) throw new Error(`Accounts capture returned ${status}.`);
  });
});

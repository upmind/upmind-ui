// -----------------------------------------------------------------------------
/**
 * @fileoverview scope wire-identity fixtures generator (ADR 025 §A1.3 / ADR 035)
 *
 * ## Job To Be Done
 * The scope module owns no endpoint of its own — its `resolveClientId` seam is
 * proven at the wire THROUGH a real consumer composable (`useClientAddresses`).
 * `scope.retarget-at-the-wire.int.test.ts` therefore needs its OWN co-located
 * recordings of the three requests that proof drives — the address list read, a
 * set-default PUT and a remove DELETE — captured against REAL staging, sanitised
 * and committed beside the test. Run on demand:
 *
 *   pnpm fixtures:generate scope
 *
 * The client-id path segment is id-templated by the fixture matcher, so ONE
 * recorded list answers both the self read (`.as(CLIENT)`) and the retarget read
 * (`.for(CLIENT, other)`); the proof asserts only the OUTBOUND request, never the
 * body, so which account the recording belongs to never enters an assertion.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal suites by the `*.fixtures.ts` suffix.
 *
 * ## Staging hygiene
 * The mutations target a throwaway address this run CREATES; `afterAll` restores
 * the account's original default and deletes the throwaway, so staging ends as
 * it was found.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import { find } from "lodash-es";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (set it in " +
          ".env.recording). The API resolves the brand from the Origin header; " +
          'without it every call returns 404 "Domain not found!".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");
const ADDRESS_WITH = "region,country";

type WireAddress = {
  id: string;
  country_id: string;
  default: boolean;
};

// -----------------------------------------------------------------------------

/** Plain, UNCAPTURED authed call — used for id lookup, arrangement and restore. */
async function call(
  method: string,
  path: string,
  accessToken: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null)
  };
}

async function fetchClientId(accessToken: string): Promise<string> {
  const { body } = await call("GET", "/api/self?with=actor", accessToken);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  const id = data?.actor?.id ?? data?.id;
  if (!id) throw new Error("Could not resolve the client id from /self.");
  return id;
}

// -----------------------------------------------------------------------------

describe("scope wire-identity fixtures", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let originalDefaultId: string | undefined;
  let throwawayId: string | undefined;

  const collection = (): string => `/api/clients/${clientId}/addresses`;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "scope"
    });
    clientToken = await mintClientToken();
    clientId = await fetchClientId(clientToken.access_token);

    const { body } = await call(
      "GET",
      `${collection()}?with=${ADDRESS_WITH}&limit=0`,
      clientToken.access_token
    );
    const rows = ((body as { data?: WireAddress[] })?.data ??
      []) as WireAddress[];
    if (!rows.length)
      throw new Error("The staging client holds no address to record from.");
    originalDefaultId = find(rows, row => Boolean(row.default))?.id;

    const created = await call("POST", collection(), clientToken.access_token, {
      name: "scope-wire-identity-throwaway",
      address_1: "1 Prover Way",
      city: "Leeds",
      postcode: "LS1 1AA",
      country_id: rows[0].country_id
    });
    throwawayId = (created.body as { data?: { id?: string } })?.data?.id;
    if (!throwawayId)
      throw new Error(
        `Could not arrange a throwaway address (${created.status}).`
      );
  }, 120000);

  afterAll(async () => {
    generator.save();
    if (originalDefaultId)
      await call(
        "PUT",
        `${collection()}/${originalDefaultId}`,
        clientToken.access_token,
        { default: true }
      ).catch(() => undefined);
    if (throwawayId)
      await call(
        "DELETE",
        `${collection()}/${throwawayId}`,
        clientToken.access_token
      ).catch(() => undefined);
  }, 120000);

  it("captures the collection list read", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `${collection()}?with=${ADDRESS_WITH}&limit=0`
    );
    generator.clearBearerToken();
    if (status !== 200) throw new Error(`List capture returned ${status}.`);
  });

  it("captures the set-default PUT and the remove DELETE", async () => {
    generator.setBearerToken(clientToken.access_token);
    const put = await generator.put(`${collection()}/${throwawayId}`, {
      default: true
    });
    if (put.status >= 400)
      throw new Error(`set-default capture returned ${put.status}.`);
    const del = await generator.delete(`${collection()}/${throwawayId}`);
    if (del.status >= 400)
      throw new Error(`remove capture returned ${del.status}.`);
    throwawayId = undefined;
    generator.clearBearerToken();
  });
});

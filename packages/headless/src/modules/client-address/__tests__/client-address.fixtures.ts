// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Address API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `clients/{id}/addresses[...]` endpoints (plus the form
 * editor's lookups — countries, regions, brand config) the `client-address`
 * module hits for its ONE in-scope cell (client × self) and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir. Run
 * on demand:
 *
 *   pnpm fixtures:generate client-address
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal `*.test.ts` / `*.int.test.ts` suites
 * by the `*.fixtures.ts` suffix. It has no assertions beyond "the capture
 * happened"; `save()` in `afterAll` writes every capture once.
 *
 * ## Captures (design.md §5 / tasks.md NFR-3)
 * `get-clients-id-addresses` (the production list, `with=region,country`,
 * `limit=0` — AC-1/2/3/5/6/7/31/32) · `-case-page-1` / `-case-page-2` (a real
 * `limit=2` walk — AC-9) · `-case-query-filter` (the free-text filter request
 * — AC-8) · `get-clients-id-addresses-id` (the per-address read the manager
 * seeds from — AC-17) · `post-clients-id-addresses` (create, carrying
 * `type: 3` and `verified: 2` — AC-22/24/32) ·
 * `put-clients-id-addresses-id` (a city-only edit — AC-23) ·
 * `-case-set-default` (AC-12) · `-case-set-default-rejected` (the real 422 the
 * API answers for an unknown address id — AC-40's setDefault-failure
 * material) · `delete-clients-id-addresses-id` (AC-10) ·
 * `-case-remove-rejected` (the real 409 for an undeletable row — AC-14/AC-40)
 * · `get-countries` (AC-18) · `get-countries-id-regions-case-country-a` /
 * `-case-country-b` (two DISJOINT real region sets — AC-19) ·
 * `get-config-brand-values` (`REQUIRE_REGION_IN_ADDRESS` +
 * `CLIENT_ALLOW_ADDRESS_UPDATE` — AC-20/AC-21).
 *
 * ## Recording limits (surfaced, not papered over)
 * 1. **`state` is never on the wire.** `IAddress` declares `state`, but this
 *    API returns `county` and no `state` key at all — verified live against
 *    every row on the account and against a `PUT {state}` that came back
 *    `state: null`. AC-31's description ORDER is therefore asserted over the
 *    six components the wire really carries; the `state` slot has no real
 *    datum on any leg reachable with these credentials, and none is invented.
 * 2. **`verified: null` cannot be recorded.** The API rejects it
 *    (`422 "The verified must be an integer"`). AC-32's two values are the
 *    REAL ones: every existing row is `verified: 0` and this run creates one
 *    at `verified: 2`, which discriminates the unreduced level from the
 *    boolean coercion at least as sharply as `null` would.
 * 3. **Brand config is `allow_address_update: true`,
 *    `required_region_in_address: false` on this brand**, and neither is
 *    settable with a client credential. The captures carry those REAL values;
 *    the opposite-config cases (AC-20's required region, AC-21's locked
 *    country) are served by an MSW override carrying the SAME recorded
 *    envelope with the boolean flipped — declared at the call site as a
 *    boundary construction, never presented as a recording. Same pattern
 *    `client-company.int-helpers` uses for its genuinely-unreachable
 *    empty-collection state.
 *
 * ## Staging hygiene
 * Every mutation targets an address this run CREATES, and the run deletes it
 * again. The account's own default address is read before the set-default
 * capture and restored afterwards, so a re-record never leaves the shared
 * staging client's default pointed at a throwaway.
 */

import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { BrandConfigKeys, GrantTypes } from "@upmind-automation/types";
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

const ADDRESS_WITH = "region,country";
const BRAND_CONFIG_KEYS = [
  BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS,
  BrandConfigKeys.CLIENT_ALLOW_ADDRESS_UPDATE
].join(",");

/** A UUID the API is guaranteed not to hold — the rejected-write material. */
const UNKNOWN_ADDRESS_ID = "00000000-0000-0000-0000-000000000000";

type WireAddress = {
  id: string;
  name: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  postcode: string | null;
  region_id?: string | null;
  country_id: string;
  type: number | null;
  default: boolean;
  verified: number | null;
  can_delete: boolean;
};

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

/** Plain, UNCAPTURED authed call — used for id lookup and staging restore. */
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

/**
 * Cap a staging-restore call. Vitest's `afterAll` has been observed not to
 * settle on an otherwise-successful `fetch` here (the restore lands on the
 * server, the promise never resolves), which failed a run whose captures were
 * already on disk. The cap keeps teardown honest without letting it swallow a
 * completed recording.
 */
function withCap<T>(work: Promise<T>): Promise<T | undefined> {
  return Promise.race([
    work.catch(() => undefined),
    new Promise<undefined>(resolve =>
      setTimeout(() => resolve(undefined), 15000)
    )
  ]);
}

/** Resolve the authed client's id from `/self` (not captured). */
async function fetchClientId(accessToken: string): Promise<string | undefined> {
  const { body } = await call("GET", "/api/self?with=actor", accessToken);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  return data?.actor?.id ?? data?.id;
}

// -----------------------------------------------------------------------------

describe("Client-Address API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let throwawayAddressId: string | undefined;
  let originalDefaultAddressId: string | undefined;
  let undeletableAddressId: string | undefined;
  let regionId: string | undefined;
  let countryAId: string | undefined;
  let countryBId: string | undefined;

  const stamp = Date.now();
  const throwawayName = `client-address-fixture-${stamp}`;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-address"
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
          "clients/{id}/addresses fixtures."
      );
    }
    clientId = id;

    const { body } = await call(
      "GET",
      `/api/clients/${clientId}/addresses?with=${ADDRESS_WITH}&limit=0`,
      clientToken.access_token
    );
    const rows = ((body as { data?: WireAddress[] })?.data ??
      []) as WireAddress[];
    if (!rows.length) {
      throw new Error(
        "The staging client holds no address — every capture below has " +
          "nothing real to address."
      );
    }

    // The account's current default, so the set-default capture can be
    // reverted and the shared staging client left as it was found.
    originalDefaultAddressId = rows.find(row => Boolean(row.default))?.id;

    // A row the API itself refuses to delete — the rejected-remove material.
    undeletableAddressId = rows.find(row => !row.can_delete)?.id;

    // A REAL region on a REAL country, so the throwaway address the mutation
    // captures target is a fully-populated row rather than a bare one.
    const withRegion = rows.find(
      row => row.region_id && row.region_id !== "none"
    );
    regionId = withRegion?.region_id ?? undefined;
    countryAId = withRegion?.country_id;

    // A second country whose region set is DISJOINT from country A's (AC-19).
    countryBId = rows.find(
      row =>
        row.country_id !== countryAId &&
        row.region_id &&
        row.region_id !== "none"
    )?.country_id;
  }, 60000);

  afterAll(async () => {
    // Save FIRST: the captures are the deliverable, and a slow staging
    // restore must never be able to swallow a completed recording.
    generator.save();

    if (throwawayAddressId) {
      await withCap(
        call(
          "DELETE",
          `/api/clients/${clientId}/addresses/${throwawayAddressId}`,
          clientToken.access_token
        )
      );
    }
    if (originalDefaultAddressId) {
      await withCap(
        call(
          "PUT",
          `/api/clients/${clientId}/addresses/${originalDefaultAddressId}`,
          clientToken.access_token,
          { default: true }
        )
      );
    }
  }, 60000);

  // --- the collection --------------------------------------------------------

  it("captures GET /api/clients/{id}/addresses (the production list — AC-1/2/3/5/6/7/31/32)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/addresses?with=${ADDRESS_WITH}&limit=0`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
  });

  it("captures GET .../addresses?case=page-1/page-2 (a real limit=2 walk — AC-9)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const pageOne = await generator.get(
      `/api/clients/${clientId}/addresses?with=${ADDRESS_WITH}&limit=2&offset=0&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/clients/${clientId}/addresses?with=${ADDRESS_WITH}&limit=2&offset=2&case=page-2`
    );
    generator.clearBearerToken();
    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged list capture returned ${pageOne.status}/${pageTwo.status}.`
      );
    }
  });

  it("captures GET .../addresses?query=... (the free-text filter request — AC-8)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/addresses?with=${ADDRESS_WITH}&limit=0&query=London&case=query-filter`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Filtered list capture returned ${status}.`);
    }
  });

  // --- mutations (a real throwaway address) ----------------------------------

  it("captures POST /api/clients/{id}/addresses (create — AC-22/AC-24/AC-32)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/addresses`,
      {
        name: throwawayName,
        // `type: 3` (Holiday) and `verified: 2` are what AC-22 and AC-32 read
        // back — captured from the API's own echo, never asserted from input.
        type: 3,
        verified: 2,
        address_1: "1 Prover Street",
        address_2: "Flat 2",
        city: "Guildford",
        postcode: "GU4 8PH",
        region_id: regionId,
        country_id: countryAId
      }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Create capture returned ${status}; cannot continue.`);
    }
    throwawayAddressId = (body as { data?: { id?: string } })?.data?.id;
    if (!throwawayAddressId) {
      throw new Error(
        "The create capture returned no id — the remaining per-address " +
          "captures have nothing to address."
      );
    }
  });

  it("captures GET /api/clients/{id}/addresses/{id} (the per-address read — AC-17)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/addresses/${throwawayAddressId}?with=${ADDRESS_WITH}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Single-row capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}/addresses/{id} (a city-only edit — AC-23)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/addresses/${throwawayAddressId}`,
      { city: "Manchester" }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Update capture returned ${status}.`);
    }
  });

  it("captures PUT .../addresses/{id}?case=set-default (AC-12)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/addresses/${throwawayAddressId}?case=set-default`,
      { default: true }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Set-default capture returned ${status}.`);
    }
  });

  it("captures PUT .../addresses/{unknown}?case=set-default-rejected (the real 422 — AC-40)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/addresses/${UNKNOWN_ADDRESS_ID}?case=set-default-rejected`,
      { default: true }
    );
    generator.clearBearerToken();
    if (status < 400) {
      throw new Error(
        `The unknown-id set-default returned ${status}, expected 4xx — ` +
          "AC-40's failure capture no longer carries an error body."
      );
    }
  });

  it("captures DELETE .../addresses/{undeletable}?case=remove-rejected (the real 409 — AC-14/AC-40)", async () => {
    if (!undeletableAddressId) {
      throw new Error(
        "Every address on this staging client reports can_delete — there is " +
          "no real rejected-delete response to capture."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/clients/${clientId}/addresses/${undeletableAddressId}?case=remove-rejected`
    );
    generator.clearBearerToken();
    if (status < 400) {
      throw new Error(
        `The undeletable-row DELETE returned ${status}, expected 4xx — and ` +
          `address ${undeletableAddressId} may now be gone from staging.`
      );
    }
  });

  it("captures DELETE /api/clients/{id}/addresses/{id} (AC-10)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/clients/${clientId}/addresses/${throwawayAddressId}`
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Delete capture returned ${status} — the throwaway address ` +
          `${throwawayAddressId} may still be on the staging client.`
      );
    }
    // Captured and consumed — afterAll's cleanup no-ops on a second delete.
    throwawayAddressId = undefined;
  });

  // --- the form editor's lookups (AC-18/AC-19/AC-20/AC-21) --------------------

  it("captures GET /api/countries (AC-18)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/countries?limit=0");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Countries capture returned ${status}.`);
    }
  });

  it("captures GET /api/countries/{id}/regions?case=country-a/-b (two disjoint real region sets — AC-19)", async () => {
    if (!countryAId || !countryBId) {
      throw new Error(
        "Could not resolve two distinct countries carrying regions from the " +
          "account's own addresses — AC-19 needs two real, disjoint region sets."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const regionsA = await generator.get(
      `/api/countries/${countryAId}/regions?limit=0&case=country-a`
    );
    const regionsB = await generator.get(
      `/api/countries/${countryBId}/regions?limit=0&case=country-b`
    );
    generator.clearBearerToken();
    if (regionsA.status !== 200 || regionsB.status !== 200) {
      throw new Error(
        `Regions capture returned ${regionsA.status}/${regionsB.status}.`
      );
    }
  });

  it("captures GET /api/config/brand/values (REQUIRE_REGION_IN_ADDRESS + CLIENT_ALLOW_ADDRESS_UPDATE — AC-20/AC-21)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/config/brand/values?keys=${BRAND_CONFIG_KEYS}`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Brand-config capture returned ${status}.`);
    }
  });
});

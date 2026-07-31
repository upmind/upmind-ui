// -----------------------------------------------------------------------------
/**
 * @fileoverview client-address-dry Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real address endpoints the `client-address-dry` module hits and
 * (re)generate their sanitised fixtures into this module's OWN co-located
 * `fixtures/` dir — the files the integration tests replay through MSW. Records
 * BOTH ADR-001 cells against staging:
 *   - Cell 1 (client/self):     clients/{clientId}/addresses[/{id}]        (client token)
 *   - Cell 2 (staff-on-behalf): admin/clients/{targetId}/addresses[/{id}] (staff token)
 * plus edge/control cases (validation 4xx, 401). Run on demand:
 *
 *   pnpm fixtures:generate client-address-dry
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix. No assertions: an `it()` succeeds when
 * the capture completes; `save()` in `afterAll` writes every capture once.
 * Same-endpoint variants carry a synthetic `?case=<purpose>` identity param
 * (inert server-side). An "error" capture that unexpectedly succeeds (2xx) is
 * dropped, not saved.
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
        "VITE_API_URL is required to generate fixtures (set it in packages/headless/.env.recording)."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required — the API resolves the brand from the Origin header."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

const FORM_URLENCODED = { "Content-Type": "application/x-www-form-urlencoded" };

// -----------------------------------------------------------------------------

/** Mint a REAL token outside the capture pipeline (the Generator only returns sanitised bodies). */
async function mintToken(
  grant: Record<string, string>
): Promise<IToken | undefined> {
  const response = await fetch(`${API_URL}/oauth/access_token`, {
    method: "POST",
    headers: { ...FORM_URLENCODED, Accept: "application/json", Origin: ORIGIN },
    body: new URLSearchParams(grant).toString()
  });
  const body = await response.json().catch(() => null);
  const token = (body?.access_token ? body : body?.data) as IToken | undefined;
  return token?.access_token ? token : undefined;
}

/** Resolve the authenticated client's own id from /self. */
async function resolveSelfId(token: string): Promise<string | undefined> {
  const response = await fetch(`${API_URL}/api/self`, {
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${token}`
    }
  });
  const body = await response.json().catch(() => null);
  return body?.data?.actor_id ?? body?.data?.actor?.id ?? body?.data?.id;
}

/** Resolve a real country id (needed for a valid `country_id` on write). */
async function resolveFirstCountryId(
  token: string
): Promise<string | undefined> {
  const response = await fetch(`${API_URL}/api/countries?limit=1`, {
    headers: {
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${token}`
    }
  });
  const body = await response.json().catch(() => null);
  const first = Array.isArray(body?.data) ? body.data[0] : body?.data;
  return first?.id;
}

function dropCapture(generator: Generator, caseTag: string): void {
  const captures = generator.getCapturedFixtures();
  for (const [key, { fixture }] of captures) {
    if (fixture.request.path.includes(`case=${caseTag}`)) captures.delete(key);
  }
}

// -----------------------------------------------------------------------------

describe("client-address-dry API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken | undefined;
  let staffToken: IToken | undefined;
  let clientId: string | undefined;
  let countryId: string | undefined;
  let createdAddressId: string | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-address-dry"
    });

    clientToken = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.client.username,
      password: API_CREDENTIALS.client.password
    });
    if (!clientToken)
      throw new Error("Could not mint a client token with staging creds.");

    staffToken = await mintToken({
      grant_type: GrantTypes.ADMIN,
      username: API_CREDENTIALS.staff.username,
      password: API_CREDENTIALS.staff.password
    });
    if (!staffToken) {
      console.warn(
        "[client-address-dry.fixtures] OMISSION: could not mint a staff token; Cell 2 captures skipped."
      );
    }

    clientId = await resolveSelfId(clientToken.access_token);
    if (!clientId)
      throw new Error("Could not resolve the client's own id from /self.");

    countryId = await resolveFirstCountryId(clientToken.access_token);
    if (!countryId) {
      console.warn(
        "[client-address-dry.fixtures] OMISSION: could not resolve a country id; add/update captures may 422."
      );
    }
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  function newAddressBody() {
    return {
      name: `Fixture Address ${Date.now()}`,
      address_1: "1 Fixture Street",
      address_2: "",
      city: "Fixture City",
      postcode: "FX1 1FX",
      country_id: countryId,
      type: 1
    };
  }

  // --- Cell 1 (client/self) — AC-A1, AC-A2, AC-S1, AC-REGION, AC-STAGED -----

  it("captures GET clients/{id}/addresses (200, list + staged)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    await generator.get(
      `/api/clients/${clientId}/addresses?with=region,country&with_staged_imports=1`
    );
  });

  it("captures POST clients/{id}/addresses (200, add)", async () => {
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/addresses`,
      newAddressBody()
    );
    const data = (body as { data?: { id?: string } })?.data;
    if (status === 200 || status === 201) createdAddressId = data?.id;
    else
      console.warn(
        `[client-address-dry.fixtures] add returned ${status}, not 2xx.`
      );
  });

  it("captures PUT clients/{id}/addresses/{id} (200, update)", async () => {
    if (!createdAddressId) {
      console.warn(
        "[client-address-dry.fixtures] OMISSION: no created address id; update capture skipped."
      );
      return;
    }
    await generator.put(
      `/api/clients/${clientId}/addresses/${createdAddressId}`,
      { ...newAddressBody(), type: 2 }
    );
  });

  it("captures PUT clients/{id}/addresses/{id} set-default (200)", async () => {
    if (!createdAddressId) return;
    await generator.put(
      `/api/clients/${clientId}/addresses/${createdAddressId}?case=set-default`,
      { default: 1 }
    );
  });

  it("captures POST clients/{id}/addresses invalid (4xx, missing type)", async () => {
    const invalid = newAddressBody() as Record<string, unknown>;
    delete invalid.type;
    const { status } = await generator.post(
      `/api/clients/${clientId}/addresses?case=invalid`,
      invalid
    );
    if (status < 400) {
      dropCapture(generator, "invalid");
      console.warn(
        `[client-address-dry.fixtures] OMISSION: invalid add returned ${status}; capture dropped.`
      );
    }
  });

  it("captures DELETE clients/{id}/addresses/{id} (200, cleanup)", async () => {
    if (!createdAddressId) return;
    await generator.delete(
      `/api/clients/${clientId}/addresses/${createdAddressId}`
    );
  });

  it("captures GET clients/{id}/addresses unauthorised (401)", async () => {
    generator.clearBearerToken();
    const { status } = await generator.get(
      `/api/clients/${clientId}/addresses?case=unauthorised`
    );
    if (status !== 401) {
      dropCapture(generator, "unauthorised");
      console.warn(
        `[client-address-dry.fixtures] OMISSION: unauth returned ${status}, not 401; capture dropped.`
      );
    }
  });

  // --- Cell 2 (staff on behalf) — AC-B1, AC-B2 -------------------------------

  it("captures GET admin/clients/{id}/addresses (200, staff list)", async () => {
    if (!staffToken) return;
    generator.setBearerToken(staffToken.access_token);
    await generator.get(
      `/api/admin/clients/${clientId}/addresses?with=region,country&with_staged_imports=1`
    );
  });

  it("captures POST admin/clients/{id}/addresses (200, staff add)", async () => {
    if (!staffToken) return;
    generator.setBearerToken(staffToken.access_token);
    const { status, body } = await generator.post(
      `/api/admin/clients/${clientId}/addresses`,
      newAddressBody()
    );
    const adminAddressId = (body as { data?: { id?: string } })?.data?.id;
    if ((status === 200 || status === 201) && adminAddressId) {
      await generator.put(
        `/api/admin/clients/${clientId}/addresses/${adminAddressId}`,
        { ...newAddressBody(), type: 3 }
      );
      await generator.delete(
        `/api/admin/clients/${clientId}/addresses/${adminAddressId}`
      );
    } else {
      console.warn(
        `[client-address-dry.fixtures] staff add returned ${status}; admin update/delete skipped.`
      );
    }
  });
});

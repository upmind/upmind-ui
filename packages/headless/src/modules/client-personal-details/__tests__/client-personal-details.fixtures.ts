// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Personal-Details API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `clients/{id}` endpoints this module hits for its ONE
 * in-scope cell (client × self) and (re)generate their sanitised v3 fixtures
 * into this module's OWN co-located `fixtures/` dir — the same files the
 * integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate client-personal-details
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal `*.test.ts` / `*.int.test.ts` suites
 * by the `*.fixtures.ts` suffix (see the package vitest configs). It has no
 * assertions: an `it()` succeeds when the capture completes. `save()` in
 * `afterAll` writes every capture once.
 *
 * ## Captures
 * `get-clients-id` (`with=custom_fields,custom_fields.field` — the read half,
 * AC-30/AC-31/AC-41) · `put-clients-id-case-change-firstname` (AC-45 diff-only)
 * · `put-clients-id-case-clear-custom-field` (AC-46 — clears the real NUMBER
 * definition `age`) · `put-clients-id-case-native-falsy` (AC-47 — `public_name:
 * ""`).
 *
 * ## Staging reality (recorded, not assumed)
 * This brand has exactly two real client custom-field definitions — NUMBER
 * (`age`) and IMAGE (`profile_picture`). Clearing a value returns the row with
 * `value: null` PRESENT, not omitted — the capture below is what proves that,
 * rather than a claim taken on trust.
 *
 * ## What is deliberately NOT captured here
 * A brand-differing language list (AC-34/AC-35) and a required-field
 * rejection (AC-51) are not captured: AC-51's read-back is that `update()`
 * rejects BEFORE any request is issued (client-side AJV validation, zero
 * requests), so there is nothing to record; AC-34/AC-35's wire source is not
 * named by this module's public surface or by `design.md` — see this
 * dispatch's `contract_gaps`. A 500 (AC-31/AC-40) is fault-injected in the
 * integration specs themselves (a generic transport-layer failure, not a
 * captured success body being dressed up).
 *
 * ## Staging hygiene
 * The firstname edit is reverted to the account's own recorded value at the
 * end of the run so a re-record does not leave the shared staging client
 * permanently renamed.
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

type WireClient = {
  id: string;
  firstname?: string;
  lastname?: string;
  public_name?: string;
  interface_language_id?: string;
  document_language_id?: string;
  custom_fields?: Array<{ field_id: string; value: unknown; field?: unknown }>;
};

// -----------------------------------------------------------------------------

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

async function fetchClientId(accessToken: string): Promise<string | undefined> {
  const { body } = await call("GET", "/api/self?with=actor", accessToken);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  return data?.actor?.id ?? data?.id;
}

// -----------------------------------------------------------------------------

describe("Client-Personal-Details API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let originalFirstname: string | undefined;
  let originalPublicName: string | undefined;
  let originalAgeValue: unknown;
  let ageFieldId: string | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-personal-details"
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
          "clients/{id} fixtures."
      );
    }
    clientId = id;

    const { body, status } = await call(
      "GET",
      `/api/clients/${clientId}?with=custom_fields,custom_fields.field`,
      clientToken.access_token
    );
    if (status !== 200) {
      throw new Error(
        `Baseline profile read returned ${status} — cannot resolve the ` +
          "account's current values to restore after the write captures."
      );
    }
    const client = (body as { data: WireClient }).data;
    originalFirstname = client.firstname;
    originalPublicName = client.public_name;

    const ageRow = (client.custom_fields ?? []).find(
      row =>
        (row.field as { code?: string } | undefined)?.code === "age" ||
        row.field_id === "age"
    );
    ageFieldId = ageRow?.field_id;
    originalAgeValue = ageRow?.value;
  }, 30000);

  afterAll(async () => {
    generator.save();
    // Restore the account's own native fields so a re-record does not leave
    // the shared staging client permanently altered by this run's captures.
    if (clientToken && clientId && originalFirstname !== undefined) {
      await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
        firstname: originalFirstname,
        public_name: originalPublicName
      });
    }
  });

  it("captures GET /api/clients/{id}?with=custom_fields,custom_fields.field (read — AC-30/AC-31/AC-41)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}?with=custom_fields,custom_fields.field`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `Read capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable profile."
      );
    }
  });

  it("captures GET /api/brand/settings (AC-34/AC-35 — the brand's language list)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/brand/settings");
    generator.clearBearerToken();
    if (status !== 200) {
      console.warn(
        `[client-personal-details.fixtures] brand/settings capture returned ` +
          `${status} — AC-34/AC-35 fall back to a labelled constructed ` +
          "languages payload if this fixture is unusable."
      );
    }
  });

  it("captures PUT /api/clients/{id} ?case=change-firstname (AC-45 diff-only)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=change-firstname`,
      { firstname: `prover-${Date.now()}` }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Firstname-change capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id} ?case=clear-custom-field (AC-46 — clears the real NUMBER field 'age')", async () => {
    if (!ageFieldId) {
      throw new Error(
        "Could not resolve the 'age' custom field's id from the baseline " +
          "read — AC-46 has no real field to clear against."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=clear-custom-field`,
      { custom_fields: { age: null } }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Clear-custom-field capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id} ?case=native-falsy (AC-47 — public_name cleared to empty string)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=native-falsy`,
      { public_name: "" }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      console.warn(
        `[client-personal-details.fixtures] native-falsy capture returned ` +
          `${status} — kept as an honest capture; inspect before relying on it.`
      );
    }
  });

  it("captures PUT /api/clients/{id} ?case=restore-age (staging hygiene — restores the real 'age' value)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.put(`/api/clients/${clientId}?case=restore-age`, {
      custom_fields: { age: originalAgeValue ?? null }
    });
    generator.clearBearerToken();
  });
});

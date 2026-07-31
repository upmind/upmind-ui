// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone-dry Module Fixture Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real phone endpoints the `client-phone-dry` module hits and
 * (re)generate their sanitised fixtures into this module's OWN co-located
 * `fixtures/` dir — the files the integration tests replay through MSW. Records
 * BOTH ADR-001 cells against staging:
 *   - Cell A (client/self):  clients/{clientId}/phones[/{id}]        (client token)
 *   - Cell B (staff-on-behalf): admin/clients/{targetId}/phones[/{id}] (staff token)
 * plus edge/control cases (empty list, validation 4xx, 401). Run on demand:
 *
 *   pnpm fixtures:generate client-phone-dry
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix. No assertions: an `it()` succeeds when the
 * capture completes; `save()` in `afterAll` writes every capture once. Same-endpoint
 * variants carry a synthetic `?case=<purpose>` identity param (inert server-side).
 * An "error" capture that unexpectedly succeeds (2xx) is dropped, not saved.
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

/**
 * A valid new phone body. `type` is an integer 1..5 (staging: "must be between
 * 1 and 5"). The number is unique per run so the add doesn't collide with a
 * prior run's row ("Phone number already exists"); the add→delete lifecycle
 * self-cleans, and the recorded body is sanitised by the fixture pipeline.
 */
const NEW_PHONE = {
  phone: `79${String(Date.now()).slice(-8)}`,
  phone_code: "+44",
  phone_country_code: "GB",
  type: 1
} as const;

/**
 * A second unique number for the staff-on-behalf add. The client add→delete
 * soft-deletes its row (`deleted_at` set) but the number stays uniqueness-
 * reserved, so the staff add must not reuse `NEW_PHONE` or staging 422s
 * ("Phone number already exists").
 */
const STAFF_NEW_PHONE = {
  ...NEW_PHONE,
  phone: `78${String(Date.now() + 90000000).slice(-8)}`
} as const;

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

function dropCapture(generator: Generator, caseTag: string): void {
  const captures = generator.getCapturedFixtures();
  for (const [key, { fixture }] of captures) {
    if (fixture.request.path.includes(`case=${caseTag}`)) captures.delete(key);
  }
}

// -----------------------------------------------------------------------------

describe("client-phone-dry API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken | undefined;
  let staffToken: IToken | undefined;
  let clientId: string | undefined;
  let createdPhoneId: string | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-phone-dry"
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
        "[client-phone-dry.fixtures] OMISSION: could not mint a staff token; Cell B captures skipped."
      );
    }

    clientId = await resolveSelfId(clientToken.access_token);
    if (!clientId)
      throw new Error("Could not resolve the client's own id from /self.");
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  // --- Cell A (client/self) — AC-A1, AC-A2, AC-S1, AC-12a -------------------

  it("captures GET clients/{id}/phones (200, list + staged)", async () => {
    generator.setBearerToken(clientToken!.access_token);
    await generator.get(
      `/api/clients/${clientId}/phones?with_staged_imports=1`
    );
  });

  it("captures POST clients/{id}/phones (200, add)", async () => {
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/phones`,
      NEW_PHONE
    );
    const data = (body as { data?: { id?: string } })?.data;
    if (status === 200 || status === 201) createdPhoneId = data?.id;
    else
      console.warn(
        `[client-phone-dry.fixtures] add returned ${status}, not 2xx.`
      );
  });

  it("captures PUT clients/{id}/phones/{id} (200, update)", async () => {
    if (!createdPhoneId) {
      console.warn(
        "[client-phone-dry.fixtures] OMISSION: no created phone id; update capture skipped."
      );
      return;
    }
    await generator.put(`/api/clients/${clientId}/phones/${createdPhoneId}`, {
      ...NEW_PHONE,
      type: 2
    });
  });

  it("captures PUT clients/{id}/phones/{id} set-default (200)", async () => {
    if (!createdPhoneId) return;
    await generator.put(
      `/api/clients/${clientId}/phones/${createdPhoneId}?case=set-default`,
      { ...NEW_PHONE, default: 1 }
    );
  });

  it("captures POST clients/{id}/phones invalid (4xx, missing type)", async () => {
    const { status } = await generator.post(
      `/api/clients/${clientId}/phones?case=invalid`,
      { ...NEW_PHONE, type: 99 }
    );
    if (status < 400) {
      dropCapture(generator, "invalid");
      console.warn(
        `[client-phone-dry.fixtures] OMISSION: invalid add returned ${status}; capture dropped.`
      );
    }
  });

  it("captures DELETE clients/{id}/phones/{id} (200, cleanup)", async () => {
    if (!createdPhoneId) return;
    await generator.delete(`/api/clients/${clientId}/phones/${createdPhoneId}`);
  });

  it("captures GET clients/{id}/phones unauthorised (401)", async () => {
    generator.clearBearerToken();
    const { status } = await generator.get(
      `/api/clients/${clientId}/phones?case=unauthorised`
    );
    if (status !== 401) {
      dropCapture(generator, "unauthorised");
      console.warn(
        `[client-phone-dry.fixtures] OMISSION: unauth returned ${status}, not 401; capture dropped.`
      );
    }
  });

  // --- Cell B (staff on behalf) — AC-B1, AC-B2 -----------------------------

  it("captures GET admin/clients/{id}/phones (200, staff list)", async () => {
    if (!staffToken) return;
    generator.setBearerToken(staffToken.access_token);
    await generator.get(
      `/api/admin/clients/${clientId}/phones?with_staged_imports=1`
    );
  });

  it("captures POST admin/clients/{id}/phones (200, staff add)", async () => {
    if (!staffToken) return;
    generator.setBearerToken(staffToken.access_token);
    const { status, body } = await generator.post(
      `/api/admin/clients/${clientId}/phones`,
      STAFF_NEW_PHONE
    );
    const adminPhoneId = (body as { data?: { id?: string } })?.data?.id;
    if ((status === 200 || status === 201) && adminPhoneId) {
      await generator.put(
        `/api/admin/clients/${clientId}/phones/${adminPhoneId}`,
        {
          ...STAFF_NEW_PHONE,
          type: 3
        }
      );
      await generator.delete(
        `/api/admin/clients/${clientId}/phones/${adminPhoneId}`
      );
    } else {
      console.warn(
        `[client-phone-dry.fixtures] staff add returned ${status}; admin update/delete skipped.`
      );
    }
  });
});

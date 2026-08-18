// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Phone API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `clients/{id}/phones[...]` endpoints (plus `/countries`,
 * which `loadLookups` depends on) the `client-phone` module hits for its ONE
 * in-scope cell (client × self) and (re)generate their sanitised v3 fixtures
 * into this module's OWN co-located `fixtures/` dir — the same files the
 * integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate client-phone
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` /
 * `*.int.test.ts` suites by the `*.fixtures.ts` suffix (see the package vitest
 * configs). It has no assertions: an `it()` succeeds when the capture
 * completes. `save()` in `afterAll` writes every capture once.
 *
 * This module starts from ZERO baseline coverage (parity.yaml row X4) — there
 * is no prior recorded acceptance to regress against, so every capture below
 * is a first recording, not a re-recording.
 *
 * ## Captures (design.md §8.2 / tasks.md T-1)
 * `get-clients-id-phones` (list, ≥3 rows — the account's own default plus two
 * throwaway numbers this run creates and deletes) · `get-clients-id-phones-id`
 * (the manager's per-record read) · `get-clients-id-phones-case-page-1` /
 * `-case-page-2` (a caller-supplied `limit=2` walk) · `post-clients-id-phones`
 * (add) · `put-clients-id-phones-id` (edit) ·
 * `put-clients-id-phones-id-case-set-default` (AC-8 success) ·
 * `put-clients-id-phones-id-case-error` (a genuine 4xx against a
 * non-existent phone id — AC-9's rejected-mutation material) ·
 * `delete-clients-id-phones-id` · `get-countries` (loadLookups) ·
 * `get-org-modules` / `get-brand-settings` / `get-config-brand-values` /
 * `get-config-organisation-values` — the brand-readiness bootstrap
 * `loadLookups` waits on via `useSystem().ensureCountries() ->
 * ensureBrandReady() -> useBrand().isReady()` before it ever reaches
 * `/countries`. Captured from the SAME staging session/brand as every other
 * capture in this file so `brand/settings`'s `country_id` genuinely resolves
 * against THIS run's own `get-countries` list — a cross-brand reuse of
 * another module's brand fixtures was tried first and rejected because its
 * `country_id` cannot resolve against this module's own recorded countries
 * (see the prover's Test-stage gate notes).
 * NO `admin/*` captures — those belong to the dropped staff cell (S1-S7).
 *
 * ## Why the paged captures carry a `?case=` marker
 * `limit` and `offset` are in the naming utility's `EXCLUDE_PARAMS`
 * (`tests/fixtures/fixture-naming.mjs`), so two reads of the same collection at
 * different offsets share ONE fixture identity and would overwrite each other.
 * `case` is an identity param, so `?case=page-1` / `?case=page-2` keep the two
 * REAL responses as two files — the same disambiguator the set-default and
 * error captures use.
 *
 * ## Recording limits (surfaced, not papered over)
 * - `meta.isVerified` / `meta.canDelete`: whichever of the account's real
 *   phones or this run's throwaway numbers the API actually returns those
 *   flags as is what the mapper tests and int fixtures see — neither is
 *   forced client-side. If the captured list happens to hold no
 *   `verified:0` or no `can_delete:false` row, `client-phone.mappers.test.ts`
 *   and `collection.int.test.ts` build the AC-2 literal combination by
 *   OVERRIDING a recorded row (the client-email `acTwoRow()` pattern), never
 *   by hand-writing a wire body from nothing.
 * - The AC-9 error capture targets a well-formed but NON-EXISTENT phone id
 *   rather than a business-rule rejection (no known client-triggerable
 *   business rule exists for phone set-default/delete, unlike client-email's
 *   unverified-default 409) — a genuine recorded 4xx for exactly the
 *   `remove`/`setDefault` request shape AC-9 exercises.
 *
 * ## Staging hygiene
 * Every mutation targets a phone number this run CREATES, and the run deletes
 * it again — including the extra number the paging capture needs. The
 * account's own default is set-defaulted back onto itself (or left alone if
 * it never had one) so a re-record cannot leave the shared staging client
 * pointing at a throwaway default.
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

type WirePhone = {
  id: string;
  phone: string;
  phone_code?: string;
  phone_country_code?: string;
  default?: boolean | number;
  verified?: boolean | number;
  can_delete?: boolean | number;
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

/** Resolve the authed client's id from `/self` (not captured). */
async function fetchClientId(accessToken: string): Promise<string | undefined> {
  const { body } = await call("GET", "/api/self?with=actor", accessToken);
  const data = (body as { data?: { id?: string; actor?: { id?: string } } })
    ?.data;
  return data?.actor?.id ?? data?.id;
}

const isTruthyFlag = (value: unknown): boolean =>
  value === true || value === 1 || value === "1";

// -----------------------------------------------------------------------------

describe("Client-Phone API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let createdPhoneId: string | undefined;
  let pagingPhoneId: string | undefined;
  let originalDefaultId: string | undefined;

  // UK mobile numbers are 10 digits (7XXXXXXXXX). A 4-digit literal prefix +
  // a 7-digit stamp produces 11 digits, which libphonenumber-js's GB
  // metadata rejects as syntactically invalid (captured proof: this bug
  // shipped `post-clients-id-phones.json` / `put-clients-id-phones-id.json`
  // with `"syntax_valid": false` and a 77009330616 / 77019330616 body — see
  // parity row M7/M8's Test-stage gate notes). A 3-digit literal prefix
  // keeps the total at 10 digits and a genuinely valid GB mobile shape.
  const stamp = Date.now().toString().slice(-7);

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-phone"
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
          "clients/{id}/phones fixtures."
      );
    }
    clientId = id;

    // The account's current default, so the run can leave the shared staging
    // client pointing at the same default it started with.
    const { body } = await call(
      "GET",
      `/api/clients/${clientId}/phones`,
      clientToken.access_token
    );
    const rows = ((body as { data?: WirePhone[] })?.data ?? []) as WirePhone[];
    originalDefaultId = rows.find(row => isTruthyFlag(row.default))?.id;
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET /api/clients/{id}/phones (list — AC-1/AC-2)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(`/api/clients/${clientId}/phones`);
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
  });

  it("captures POST /api/clients/{id}/phones (add — AC-13/AC-22)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/phones`,
      {
        phone: `770${stamp}`,
        phone_code: "+44",
        phone_country_code: "GB"
      }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Add capture returned ${status}; cannot continue.`);
    }
    const added = (body as { data?: { id?: string; syntax_valid?: boolean } })
      ?.data;
    createdPhoneId = added?.id;
    if (!createdPhoneId) {
      throw new Error(
        "The add capture returned no id — the remaining per-phone captures " +
          "have nothing to address."
      );
    }
    if (added?.syntax_valid === false) {
      throw new Error(
        `The add capture's own number ${`770${stamp}`} came back ` +
          "syntax_valid:false — the API itself rejects this number's shape. " +
          "Every downstream save read-back (AC-22/AC-23/AC-24) would replay an " +
          "invalid number. Refusing to ship it; adjust the generator's number " +
          "shape and re-run."
      );
    }
  });

  it("captures GET /api/clients/{id}/phones/{id} (load one — M2/loadOne)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get(`/api/clients/${clientId}/phones/${createdPhoneId}`);
    generator.clearBearerToken();
  });

  it("captures PUT /api/clients/{id}/phones/{id} (edit — AC-23)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.put(
      `/api/clients/${clientId}/phones/${createdPhoneId}`,
      {
        phone: `771${stamp}`,
        phone_code: "+44",
        phone_country_code: "GB"
      }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      console.warn(
        `[client-phone.fixtures] edit returned ${status} — kept as an honest ` +
          "capture; inspect it before the integration tests rely on it."
      );
    }
    const edited = (body as { data?: { syntax_valid?: boolean } })?.data;
    if (edited?.syntax_valid === false) {
      throw new Error(
        `The edit capture's own number ${`771${stamp}`} came back ` +
          "syntax_valid:false — AC-23's save-a-change read-back would replay " +
          "an invalid number. Refusing to ship it; adjust the generator's " +
          "number shape and re-run."
      );
    }
  });

  it("captures PUT /api/clients/{id}/phones/{id} ?case=set-default (AC-8)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/phones/${createdPhoneId}?case=set-default`,
      { default: true }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Set-default capture returned ${status} against this run's own ` +
          "throwaway number — AC-8 has no recorded success to replay."
      );
    }

    // Staging hygiene: restore whichever number was the account's default
    // before this run moved it.
    if (originalDefaultId && originalDefaultId !== createdPhoneId) {
      await call(
        "PUT",
        `/api/clients/${clientId}/phones/${originalDefaultId}`,
        clientToken.access_token,
        { default: true }
      );
    }
  });

  it("captures PUT /api/clients/{id}/phones/{id} ?case=error (a real 4xx against a non-existent phone — AC-9)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/phones/00000000-0000-0000-0000-000000000000?case=error`,
      { default: true }
    );
    generator.clearBearerToken();
    if (status < 400) {
      console.warn(
        `[client-phone.fixtures] set-default against a non-existent phone ` +
          `returned ${status}, expected 4xx — AC-9's rejected-mutation ` +
          "capture no longer carries an error body. Inspect before relying on it."
      );
    }
  });

  it("captures GET /api/clients/{id}/phones?limit=2 pages 1 and 2 (pagination, caller-supplied limit)", async () => {
    // The paged walk needs a collection larger than one page. The account
    // holds its own numbers plus this run's throwaway (1 so far); a second
    // throwaway makes `limit=2` a genuine two-page read.
    const created = await call(
      "POST",
      `/api/clients/${clientId}/phones`,
      clientToken.access_token,
      {
        phone: `772${stamp}`,
        phone_code: "+44",
        phone_country_code: "GB"
      }
    );
    pagingPhoneId = (created.body as { data?: { id?: string } })?.data?.id;
    if (!pagingPhoneId) {
      throw new Error(
        `Could not create the second throwaway number the paging capture ` +
          `needs (status ${created.status}) — pagination has no recorded second page.`
      );
    }

    try {
      generator.setBearerToken(clientToken.access_token);
      const pageOne = await generator.get(
        `/api/clients/${clientId}/phones?limit=2&offset=0&case=page-1`
      );
      const pageTwo = await generator.get(
        `/api/clients/${clientId}/phones?limit=2&offset=2&case=page-2`
      );
      generator.clearBearerToken();

      if (pageOne.status !== 200 || pageTwo.status !== 200) {
        throw new Error(
          `Paged list capture returned ${pageOne.status}/${pageTwo.status} — ` +
            "refusing to ship a fixture that does not represent a real page."
        );
      }
    } finally {
      await call(
        "DELETE",
        `/api/clients/${clientId}/phones/${pagingPhoneId}`,
        clientToken.access_token
      );
    }
  });

  it("captures GET /api/countries (loadLookups)", async () => {
    generator.setBearerToken(clientToken.access_token);
    await generator.get("/api/countries");
    generator.clearBearerToken();
  });

  it("captures GET /api/countries?filter[code]=GB — this run's ORIGINAL /countries capture predates limit=0 and holds only the API's default 10-row page (of 248), which does not include GB; every GB-context manager scenario needs a genuinely recorded GB row. `filter[code]` keeps this a SEPARATE fixture identity from the bare /countries capture above (never touched), served alongside it by the test harness rather than replacing it.", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      "/api/countries?filter[code]=GB"
    );
    generator.clearBearerToken();
    if (status !== 200 || !(body as { data?: unknown[] })?.data?.length) {
      throw new Error(
        `GB country capture returned ${status} with no row — every GB-context ` +
          "manager scenario (AC-18, AC-20, AC-21, AC-23...) has no recorded " +
          "country to resolve against."
      );
    }
  });

  it("captures the brand-readiness bootstrap loadLookups waits on before /countries (org/modules, brand/settings, config/brand/values, config/organisation/values)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const modules = await generator.get("/api/org/modules");
    const settings = await generator.get("/api/brand/settings");
    const brandConfig = await generator.get(
      "/api/config/brand/values?keys=ui.basket.default_currency"
    );
    const orgConfig = await generator.get(
      "/api/config/organisation/values?keys=package.enabled_features.product_provisioning"
    );
    generator.clearBearerToken();

    if (
      modules.status !== 200 ||
      settings.status !== 200 ||
      brandConfig.status !== 200 ||
      orgConfig.status !== 200
    ) {
      throw new Error(
        `Brand-readiness bootstrap capture returned ` +
          `${modules.status}/${settings.status}/${brandConfig.status}/${orgConfig.status} — ` +
          "loadLookups cannot resolve country from an unreadable brand."
      );
    }

    const settingsData = (settings.body as { data?: { country_id?: string } })
      ?.data;
    if (!settingsData?.country_id) {
      throw new Error(
        "brand/settings captured with no country_id — loadLookups's default " +
          "country resolution would throw on this recording exactly as it did " +
          "against the hand-stubbed empty body this capture replaces."
      );
    }
  });

  it("captures DELETE /api/clients/{id}/phones/{id}", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/clients/${clientId}/phones/${createdPhoneId}`
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Delete capture returned ${status} — the throwaway number ` +
          `${createdPhoneId} is still on the staging client. Clean it up.`
      );
    }
  });
});

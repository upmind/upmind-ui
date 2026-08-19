// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Company API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `clients/{id}/companies[...]` endpoints (plus the manager's
 * sibling lookups — addresses, emails, phones, countries, regions, brand
 * config) the `client-company` module hits for its ONE in-scope cell
 * (client × self) and (re)generate their sanitised v3 fixtures into this
 * module's OWN co-located `fixtures/` dir. Run on demand:
 *
 *   pnpm fixtures:generate client-company
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal `*.test.ts` / `*.int.test.ts` suites
 * by the `*.fixtures.ts` suffix. It has no assertions beyond "the capture
 * happened"; `save()` in `afterAll` writes every capture once.
 *
 * ## Captures (design.md D10 / requirements.md NFR-2)
 * `get-clients-id-companies` (list, real params) ·
 * `-case-order-check` (descending — AC-8's "raw order is NOT already
 * ascending" material; `order` is excluded from fixture identity, so this
 * SAME file replays for the production ascending request too) ·
 * `-case-page-1` / `-case-page-2` (a real `limit=2` walk — AC-9) ·
 * `get-clients-id-companies-id` (single row — AC-14/AC-21) ·
 * `post-clients-id-companies` (create — AC-19) ·
 * `put-clients-id-companies-id` (update, name only — AC-19/G3) ·
 * `-case-set-default` (AC-11) · `-case-update-rejected` (the real 422 the API
 * answers for an unknown `address_id` — AC-23's rejected-save material) ·
 * `delete-clients-id-companies-id` (AC-10) ·
 * `get-clients-id-addresses` / `-emails` / `-phones` (AC-16 sibling lookups) ·
 * `post-clients-id-emails` (an inline email create — AC-20/C26) ·
 * `get-countries` (AC-16/AC-17) ·
 * `get-countries-id-regions-case-country-a` / `-case-country-b` (two
 * DISJOINT real region sets — AC-17) ·
 * `get-config-brand-values` (`TAX_NUMBER_VALIDATION_ENABLED` +
 * `REQUIRE_REGION_IN_ADDRESS` — AC-2/AC-7/AC-16).
 *
 * ## Recording limits (surfaced, not papered over — NFR-2)
 * 1. This staging client's brand has `price_tax.tax.enable_automatic_vat_validation`
 *    OFF, and no company on the account carries `vat_validated: true` (VAT
 *    validation is triggered by staff, a dropped cell — parity.yaml C42). The
 *    "brand has tax validation ON" and "a VALIDATED VAT number" cases have no
 *    real row to capture from any leg reachable with the credentials this run
 *    has. `client-company.collection.int.test.ts` / `.mappers.test.ts`
 *    `it.skip` those specific sub-cases with this same note, rather than
 *    fabricate either.
 * 2. This staging client already holds ten real companies (no leg of this run
 *    can produce a genuinely EMPTY collection for it without deleting real
 *    seed data). The "empty collection" state is served through an
 *    MSW-override handler carrying zero rows of the SAME recorded shape — the
 *    same "server's own post-effect, replayed" pattern
 *    `client-email.int-helpers.ts`'s `installEmailsListHandler([])` already
 *    uses, never a hand-typed body.
 *
 * ## Staging hygiene
 * Every mutation targets a company (and, for AC-20, an email) this run
 * CREATES, and the run deletes it again. The account's own default company is
 * read before the set-default capture and re-asserted afterwards, so a
 * re-record never leaves the shared staging client's default pointed at a
 * throwaway. (This sandbox client is observed to auto-replenish deleted seed
 * companies — confirmed live before this generator was authored — but the
 * explicit revert is kept regardless, on the same discipline client-email's
 * generator uses.)
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

const COMPANY_WITH = "address,address.country,address.region";
const BRAND_CONFIG_KEYS = [
  "price_tax.tax.enable_automatic_vat_validation",
  "invoices.common.required_region_in_address"
].join(",");

type WireCompany = {
  id: string;
  name: string;
  default?: boolean | number;
  created_at: string;
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

// -----------------------------------------------------------------------------

describe("Client-Company API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let throwawayCompanyId: string | undefined;
  let throwawayEmailId: string | undefined;
  let originalDefaultCompanyId: string | undefined;
  let defaultAddressId: string | undefined;
  let countryAId: string | undefined;
  let countryBId: string | undefined;

  const stamp = Date.now();
  const throwawayName = `client-company-fixture-${stamp}`;
  const inlineEmail = `client-company-fixture-${stamp}@example.com`;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-company"
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
          "clients/{id}/companies fixtures."
      );
    }
    clientId = id;

    // The account's current default company, so the set-default capture can
    // be reverted and the shared staging client left as it was found.
    const { body } = await call(
      "GET",
      `/api/clients/${clientId}/companies`,
      clientToken.access_token
    );
    const rows = ((body as { data?: WireCompany[] })?.data ??
      []) as WireCompany[];
    originalDefaultCompanyId = rows.find(row => Boolean(row.default))?.id;

    // A create requires an existing address_id (or an inline address) — the
    // account's own default address, resolved live rather than hardcoded.
    const addressesResp = await call(
      "GET",
      `/api/clients/${clientId}/addresses`,
      clientToken.access_token
    );
    const addresses = ((
      addressesResp.body as {
        data?: { id: string; default?: boolean | number }[];
      }
    )?.data ?? []) as { id: string; default?: boolean | number }[];
    defaultAddressId =
      addresses.find(address => Boolean(address.default))?.id ??
      addresses[0]?.id;
    if (!defaultAddressId) {
      throw new Error(
        "The staging client has no address on file — the create capture " +
          "has no address_id to satisfy the API's required-field rule."
      );
    }

    // Two countries with DISJOINT real region sets (AC-17). Resolved from the
    // live /countries list rather than hardcoded — a re-record survives an id
    // reshuffle on this sandbox.
    const countriesResp = await call(
      "GET",
      "/api/countries?limit=0",
      clientToken.access_token
    );
    const countries = ((
      countriesResp.body as { data?: { id: string; name: string }[] }
    )?.data ?? []) as { id: string; name: string }[];
    countryAId = countries.find(c => c.name === "Afghanistan")?.id;
    countryBId = countries.find(c => c.name === "Canada")?.id;
  }, 60000);

  afterAll(async () => {
    // Clean up the throwaway company/email this run created, and restore the
    // account's original default company if a later capture moved it.
    if (throwawayCompanyId) {
      await call(
        "DELETE",
        `/api/clients/${clientId}/companies/${throwawayCompanyId}`,
        clientToken.access_token
      ).catch(() => undefined);
    }
    if (throwawayEmailId) {
      await call(
        "DELETE",
        `/api/clients/${clientId}/emails/${throwawayEmailId}`,
        clientToken.access_token
      ).catch(() => undefined);
    }
    if (originalDefaultCompanyId) {
      await call(
        "PUT",
        `/api/clients/${clientId}/companies/${originalDefaultCompanyId}`,
        clientToken.access_token,
        { default: true }
      ).catch(() => undefined);
    }

    generator.save();
  }, 30000);

  // --- the collection --------------------------------------------------------

  it("captures GET /api/clients/{id}/companies (list — AC-1/AC-2/AC-3/AC-6)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/companies?with=${COMPANY_WITH}&with_staged_imports=1&order=created_at`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
  });

  it("captures GET .../companies?case=order-check (a REAL descending dump — AC-8)", async () => {
    // `order` is excluded from fixture identity, so this capture's raw
    // (descending) row order is what AC-8's assertion sees regardless of
    // which `order` value the production request under test sends — the
    // point being the raw order is NOT already ascending.
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}/companies?order=-created_at&case=order-check`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(`Order-check capture returned ${status}.`);
    }
  });

  it("captures GET .../companies?case=page-1/page-2 (a real limit=2 walk — AC-9)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const pageOne = await generator.get(
      `/api/clients/${clientId}/companies?limit=2&offset=0&order=created_at&case=page-1`
    );
    const pageTwo = await generator.get(
      `/api/clients/${clientId}/companies?limit=2&offset=2&order=created_at&case=page-2`
    );
    generator.clearBearerToken();
    if (pageOne.status !== 200 || pageTwo.status !== 200) {
      throw new Error(
        `Paged list capture returned ${pageOne.status}/${pageTwo.status}.`
      );
    }
  });

  it("captures GET /api/clients/{id}/companies/{id} (single row — AC-14/AC-21)", async () => {
    // Pick a recorded row that carries a NON-empty reg_number/vat_number, so
    // AC-21's description assertion has real, non-blank values to contain.
    const { body } = await call(
      "GET",
      `/api/clients/${clientId}/companies`,
      clientToken.access_token
    );
    const rows = ((
      body as {
        data?: (WireCompany & { vat_number?: string; reg_number?: string })[];
      }
    )?.data ?? []) as (WireCompany & {
      vat_number?: string;
      reg_number?: string;
    })[];
    const target =
      rows.find(row => row.vat_number && row.reg_number) ?? rows[0];
    if (!target) {
      throw new Error("No company row available to capture a single read.");
    }

    generator.setBearerToken(clientToken.access_token);
    const single = await generator.get(
      `/api/clients/${clientId}/companies/${target.id}?with=${COMPANY_WITH}`
    );
    generator.clearBearerToken();
    if (single.status !== 200) {
      throw new Error(`Single-row capture returned ${single.status}.`);
    }
  });

  // --- mutations (a real throwaway company) ----------------------------------

  it("captures POST /api/clients/{id}/companies (create — AC-19)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/companies`,
      {
        name: throwawayName,
        reg_number: "PROVER-REG-1",
        vat_number: "",
        address_id: defaultAddressId
      }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Create capture returned ${status}; cannot continue.`);
    }
    throwawayCompanyId = (body as { data?: { id?: string } })?.data?.id;
    if (!throwawayCompanyId) {
      throw new Error(
        "The create capture returned no id — the remaining per-company " +
          "captures have nothing to address."
      );
    }
  });

  it("captures PUT /api/clients/{id}/companies/{id} (update, name only — AC-19/G3)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/companies/${throwawayCompanyId}`,
      { name: `${throwawayName}-edited` }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      console.warn(
        `[client-company.fixtures] update returned ${status} — kept as an ` +
          "honest capture; inspect it before the integration tests rely on it."
      );
    }
  });

  it("captures PUT /api/clients/{id}/companies/{id}?case=set-default (AC-11)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/companies/${throwawayCompanyId}?case=set-default`,
      { default: true }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Set-default capture returned ${status}.`);
    }
  });

  it("captures PUT ...?case=update-rejected (the real 422 for an unknown address_id — AC-23)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}/companies/${throwawayCompanyId}?case=update-rejected`,
      { address_id: "00000000-0000-0000-0000-000000000000" }
    );
    generator.clearBearerToken();
    if (status < 400) {
      console.warn(
        `[client-company.fixtures] the invalid-address_id update returned ` +
          `${status}, expected 4xx — AC-23's rejected-save capture no longer ` +
          "carries an error body. Inspect before relying on it."
      );
    }
  });

  it("captures DELETE /api/clients/{id}/companies/{id} (AC-10)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.delete(
      `/api/clients/${clientId}/companies/${throwawayCompanyId}`
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(
        `Delete capture returned ${status} — the throwaway company ` +
          `${throwawayCompanyId} may still be on the staging client.`
      );
    }
    // Captured and consumed — afterAll's cleanup no-ops on a second delete.
    throwawayCompanyId = undefined;
  });

  // --- the manager's sibling lookups (AC-16/AC-17/AC-20) ----------------------

  it("captures the sibling collections a form editor loads (AC-16) — addresses, emails, phones", async () => {
    generator.setBearerToken(clientToken.access_token);
    const addresses = await generator.get(`/api/clients/${clientId}/addresses`);
    const emails = await generator.get(`/api/clients/${clientId}/emails`);
    const phones = await generator.get(`/api/clients/${clientId}/phones`);
    generator.clearBearerToken();
    if (
      addresses.status !== 200 ||
      emails.status !== 200 ||
      phones.status !== 200
    ) {
      throw new Error(
        `Sibling-lookup capture returned ${addresses.status}/${emails.status}/${phones.status}.`
      );
    }
  });

  it("captures POST /api/clients/{id}/emails (an inline dependency create — AC-20/C26)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.post(
      `/api/clients/${clientId}/emails`,
      { email: inlineEmail }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`Inline email create capture returned ${status}.`);
    }
    throwawayEmailId = (body as { data?: { id?: string } })?.data?.id;
  });

  it("captures GET /api/countries (AC-16/AC-17)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/countries?limit=0");
    generator.clearBearerToken();
    if (status !== 200)
      throw new Error(`Countries capture returned ${status}.`);
  });

  it("captures GET /api/countries/{id}/regions?case=country-a/-b (two disjoint real region sets — AC-17)", async () => {
    if (!countryAId || !countryBId) {
      throw new Error(
        "Could not resolve both Afghanistan and Canada from /countries — " +
          "AC-17's two-country regions capture needs two real, distinct countries."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const regionsA = await generator.get(
      `/api/countries/${countryAId}/regions?case=country-a`
    );
    const regionsB = await generator.get(
      `/api/countries/${countryBId}/regions?case=country-b`
    );
    generator.clearBearerToken();
    if (regionsA.status !== 200 || regionsB.status !== 200) {
      throw new Error(
        `Regions capture returned ${regionsA.status}/${regionsB.status}.`
      );
    }
  });

  it("captures GET /api/config/brand/values (TAX_NUMBER_VALIDATION_ENABLED + REQUIRE_REGION_IN_ADDRESS — AC-2/AC-7/AC-16)", async () => {
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

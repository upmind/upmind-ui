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
 *    has. `client-company.mappers.test.ts` `it.todo`s that sub-case with this
 *    same note, rather than fabricate it.
 * 2. The genuinely-empty collection state is captured as a REAL zero-row
 *    filtered read (a needle no company holds), replayed by the @AC-36
 *    scenario. No MSW-override empty body is used.
 *
 * ## The two fixture kinds (operator ruling 2026-09-24)
 * This generator writes BOTH: the flat `fixtures/*.json` (one file per request,
 * read by the pure `mappers.test.ts` unit and served by identity), and the
 * per-step `scenarios/<slug>/<NN>/` recordings for every DRIVEN
 * `client-company.feature` scenario — the module keeps NO capability
 * `*.int.test.ts`.
 *
 * ## Staging hygiene
 * Every mutation targets a company (and, for AC-20, an email) this run
 * CREATES, and the run deletes it again. The account's own default company is
 * read before any set-default/clear-default capture and re-asserted afterwards,
 * so a re-record never leaves the shared staging client's default pointed at a
 * throwaway or unset.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { ForcedErrorCode } from "@upmind-automation/test-fixtures/types";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import { filter, find, includes, kebabCase, map } from "lodash-es";
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

    const token = await mintClientToken();
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
    // `limit=0` is the labs page's boot read (the module's unpaged window); it is
    // excluded from the fixture name, so this stays `get-clients-id-companies-…`
    // and only its recorded query gains the limit the forced-state corpus matches
    // the page's real read on (FE-3145, ADR 035).
    const { status } = await generator.get(
      `/api/clients/${clientId}/companies?with=${COMPANY_WITH}&with_staged_imports=1&order=created_at&limit=0`
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

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145; operator ruling 2026-09-24) — one recording per DRIVEN
// `client-company.feature` scenario, one fixtures folder per step, named from
// the feature by `recordedStepDir`. Each scenario reads the collection its
// Background opens and records the requests its own steps make, in order.
// `@todo` scenarios are skipped by the replay runner and recorded here not at
// all. `with`, `order`, `limit`, `offset` and `with_staged_imports` follow the
// collection's boot query; the needle is percent-wrapped and encoded as the
// module's query serializer emits it, so the recorded path matches the wire.
// -----------------------------------------------------------------------------

const LIST = `?with=${COMPANY_WITH}&with_staged_imports=1&order=created_at&limit=0&offset=0`;

const filteredByName = (needle: string): string =>
  `?with=${COMPANY_WITH}&with_staged_imports=1&filter[name|like]=${encodeURIComponent(
    `%${needle}%`
  )}&order=created_at&limit=0&offset=0`;

const NAME_NEEDLE = "Heg";
const NO_MATCH_NEEDLE = "zzz-no-such-company-zzz";

type WireRow = { id: string; default?: boolean | number };

const feature = readFileSync(
  join(import.meta.dirname, "client-company.feature"),
  "utf-8"
);

const OPEN = "I am an authenticated client acting on my own account";

describe("Client-Company scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let defaultAddressId: string | undefined;
  let originalDefaultId: string | undefined;
  let originalIds: string[] = [];
  const prepared = new Set<string>();

  const companies = (): string => `/api/clients/${clientId}/companies`;
  const brandConfig = (): string =>
    `/api/config/brand/values?keys=${BRAND_CONFIG_KEYS}`;

  async function createCompany(name: string): Promise<string> {
    const { body } = await call("POST", companies(), clientToken.access_token, {
      name,
      reg_number: "PROVER-REG",
      vat_number: "",
      address_id: defaultAddressId
    });
    const id = (body as { data?: { id?: string } })?.data?.id;
    if (!id)
      throw new Error(`Could not arrange a throwaway company (${name}).`);
    return id;
  }

  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, feature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        feature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: kebabCase(scenario)
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.clearBearerToken();
    generator.save();
  }

  const boot = async (generator: Generator): Promise<void> => {
    await generator.get(`${companies()}${LIST}`);
    await generator.get(brandConfig());
  };

  const readList = (generator: Generator): Promise<unknown> =>
    generator.get(`${companies()}${LIST}`);

  async function restoreStaging(): Promise<void> {
    if (originalDefaultId)
      await call(
        "PUT",
        `${companies()}/${originalDefaultId}`,
        clientToken.access_token,
        { default: true }
      ).catch(() => undefined);
    const { body } = await call("GET", companies(), clientToken.access_token);
    const added = filter(
      (body as { data?: WireRow[] })?.data ?? [],
      ({ id }) => !includes(originalIds, id)
    );
    for (const { id } of added)
      await call(
        "DELETE",
        `${companies()}/${id}`,
        clientToken.access_token
      ).catch(() => undefined);
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";
    if (!clientId)
      throw new Error("Could not resolve the client id from /self.");

    const { body } = await call("GET", companies(), clientToken.access_token);
    const rows = ((body as { data?: WireRow[] })?.data ?? []) as WireRow[];
    originalIds = map(rows, "id");
    originalDefaultId = find(rows, row => Boolean(row.default))?.id;

    const addressesResp = await call(
      "GET",
      `/api/clients/${clientId}/addresses`,
      clientToken.access_token
    );
    const addresses = ((addressesResp.body as { data?: WireRow[] })?.data ??
      []) as WireRow[];
    defaultAddressId = (
      find(addresses, address => Boolean(address.default)) ?? addresses[0]
    )?.id;
    if (!defaultAddressId)
      throw new Error(
        "The staging client has no address — a create capture has no address_id."
      );
  }, 60000);

  afterAll(restoreStaging, 30000);

  describe("See the companies on my own account", () => {
    const scenario = "See the companies on my own account";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
  });

  // AC-2 — the boot records the list AND the brand config that gates the tax
  // display, so a real row's name/registration/tax number can be read back.
  describe("See what each company is", () => {
    const scenario = "See what each company is";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
  });

  describe("I narrow my companies by name, and clear it back", () => {
    const scenario = "I narrow my companies by name, and clear it back";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I search my companies for a word", () =>
      recordStep(scenario, "I search my companies for a word", generator =>
        generator.get(`${companies()}${filteredByName(NAME_NEEDLE)}`)
      ));
    it('I search my companies for "Heg"', () =>
      recordStep(scenario, 'I search my companies for "Heg"', generator =>
        generator.get(`${companies()}${filteredByName(NAME_NEEDLE)}`)
      ));
  });

  describe("I choose the order my companies come in", () => {
    const scenario = "I choose the order my companies come in";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I sort my companies by name descending", () =>
      recordStep(
        scenario,
        "I sort my companies by name descending",
        generator =>
          generator.get(
            `${companies()}?with=${COMPANY_WITH}&with_staged_imports=1&order=-name&limit=0&offset=0`
          )
      ));
  });

  describe("Delete one of my companies", () => {
    const scenario = "Delete one of my companies";
    let deletableId: string;
    beforeAll(async () => {
      deletableId = await createCompany(`prover-delete-${Date.now()}`);
    });
    afterAll(restoreStaging, 30000);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I delete a company the server lets me delete", () =>
      recordStep(
        scenario,
        "I delete a company the server lets me delete",
        async generator => {
          await generator.delete(`${companies()}/${deletableId}`);
          await readList(generator);
        }
      ));
  });

  describe("Make one of my companies the default", () => {
    const scenario = "Make one of my companies the default";
    let nonDefaultId: string;
    beforeAll(async () => {
      nonDefaultId = await createCompany(`prover-set-default-${Date.now()}`);
    });
    afterAll(restoreStaging, 30000);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I make a non-default company my default", () =>
      recordStep(
        scenario,
        "I make a non-default company my default",
        async generator => {
          await generator.put(`${companies()}/${nonDefaultId}`, {
            default: true
          });
          await readList(generator);
        }
      ));
  });

  describe("Refresh my companies", () => {
    const scenario = "Refresh my companies";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I refresh my companies", () =>
      recordStep(scenario, "I refresh my companies", readList));
  });

  describe("Page through my companies", () => {
    const scenario = "Page through my companies";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
  });

  describe("An empty list tells me whether it is empty because I filtered it", () => {
    const scenario =
      "An empty list tells me whether it is empty because I filtered it";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I search my companies for something none of them are called", () =>
      recordStep(
        scenario,
        "I search my companies for something none of them are called",
        generator =>
          generator.get(`${companies()}${filteredByName(NO_MATCH_NEEDLE)}`)
      ));
  });

  describe("A request the schema rejects leaves the live list standing and reports itself", () => {
    const scenario =
      "A request the schema rejects leaves the live list standing and reports itself";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I search my companies for a value the field cannot hold", () =>
      recordStep(
        scenario,
        "I search my companies for a value the field cannot hold",
        () => Promise.resolve()
      ));
  });

  describe("Know which company is my default, even when I have none", () => {
    const scenario = "Know which company is my default, even when I have none";
    // ARRANGE the no-default state with the account, record it, restore it —
    // never flipped inside a recording. Best-effort: if staging refuses to hold
    // zero defaults, the recorded list keeps its default and the scenario still
    // boots without failure (DECISIONS).
    beforeAll(async () => {
      if (originalDefaultId)
        await call(
          "PUT",
          `${companies()}/${originalDefaultId}`,
          clientToken.access_token,
          { default: false }
        ).catch(() => undefined);
    });
    afterAll(restoreStaging, 30000);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
  });

  describe("My companies record a failed read for me to read back", () => {
    const scenario = "My companies record a failed read for me to read back";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("a read of my companies fails at the server", () =>
      recordStep(
        scenario,
        "a read of my companies fails at the server",
        generator =>
          generator.get(
            `${companies()}${LIST}`,
            undefined,
            ForcedErrorCode.Internal_Server_Error
          )
      ));
  });

  // The three @signed-out guards ask the server for nothing — the module is
  // guarded before any request, and they carry no signed-in Background. Only
  // their scenario dirs are prepared (from their own first step), so the replay
  // wall proves the silence: any request they send fails the scenario by name.
  describe("My companies are not mine to read until I sign in", () => {
    const scenario = "My companies are not mine to read until I sign in";
    const step = "I look at my companies while signed out";
    it(step, () => recordStep(scenario, step, () => Promise.resolve()));
  });

  describe("Nothing touches a company without an authenticated client session", () => {
    const scenario =
      "Nothing touches a company without an authenticated client session";
    const step =
      "either my companies or a company form is used while signed out";
    it(step, () => recordStep(scenario, step, () => Promise.resolve()));
  });

  describe("No destructive request escapes without a signed-in client", () => {
    const scenario =
      "No destructive request escapes without a signed-in client";
    const step = "a delete or a set-default is forced while signed out";
    it(step, () => recordStep(scenario, step, () => Promise.resolve()));
  });

  describe("Add a new company to my account", () => {
    const scenario = "Add a new company to my account";
    afterAll(restoreStaging, 30000);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I add a new company to my account", () =>
      recordStep(
        scenario,
        "I add a new company to my account",
        async generator => {
          // `ensure` resolves the form's own dependencies before it creates, so
          // the create step records the sibling reads the collection's ensure
          // makes as well as the POST and the re-read.
          await generator.get(`/api/clients/${clientId}/addresses?limit=0`);
          await generator.get(`/api/clients/${clientId}/emails?limit=0`);
          await generator.get(
            `/api/clients/${clientId}/phones?with_staged_imports=1&order=created_at&limit=0`
          );
          await generator.get("/api/countries?limit=0");
          await generator.get(brandConfig());
          await generator.post(companies(), {
            name: `prover-add-${Date.now()}`,
            reg_number: "PROVER-REG",
            vat_number: "",
            address_id: defaultAddressId
          });
          await readList(generator);
        }
      ));
  });
});

// -----------------------------------------------------------------------------
// MANAGER SCENARIOS — the form editor booted under its own scenario key. Each
// scenario's Background opens the collection, then the manager step boots the
// editor over one company by id and records everything the form loads
// (the company, my addresses/emails/phones, the countries, my brand's config,
// the default country's regions). Edit-and-save runs against a THROWAWAY; open,
// validate and the rejected-save run read-only against a real company.
// -----------------------------------------------------------------------------

describe("Client-Company manager scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let targetCompanyId: string | undefined;
  let throwawayId: string | undefined;
  let defaultAddressId: string | undefined;
  let defaultCountryId: string | undefined;
  const prepared = new Set<string>();

  const companies = (): string => `/api/clients/${clientId}/companies`;
  const brandConfig = (): string =>
    `/api/config/brand/values?keys=${BRAND_CONFIG_KEYS}`;

  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, feature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        feature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: kebabCase(scenario)
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.clearBearerToken();
    generator.save();
  }

  const boot = async (generator: Generator): Promise<void> => {
    await generator.get(
      `${companies()}?with=${COMPANY_WITH}&with_staged_imports=1&order=created_at&limit=0&offset=0`
    );
    await generator.get(brandConfig());
  };

  const openManager = async (
    generator: Generator,
    companyId: string
  ): Promise<void> => {
    await generator.get(`${companies()}/${companyId}?with=${COMPANY_WITH}`);
    await generator.get(`/api/clients/${clientId}/addresses?limit=0`);
    await generator.get(`/api/clients/${clientId}/emails?limit=0`);
    await generator.get(
      `/api/clients/${clientId}/phones?with_staged_imports=1&order=created_at&limit=0`
    );
    await generator.get("/api/countries?limit=0");
    await generator.get(brandConfig());
    if (defaultCountryId)
      await generator.get(`/api/countries/${defaultCountryId}/regions`);
  };

  /** A fresh (new-draft) form loads the same siblings but opens no company. */
  const freshManager = async (generator: Generator): Promise<void> => {
    await generator.get(`/api/clients/${clientId}/addresses?limit=0`);
    await generator.get(`/api/clients/${clientId}/emails?limit=0`);
    await generator.get(
      `/api/clients/${clientId}/phones?with_staged_imports=1&order=created_at&limit=0`
    );
    await generator.get("/api/countries?limit=0");
    await generator.get(brandConfig());
    if (defaultCountryId)
      await generator.get(`/api/countries/${defaultCountryId}/regions`);
  };

  const createdInline = new Set<string>();
  const createdInlineEmails = new Set<string>();

  beforeAll(async () => {
    clientToken = await mintClientToken();
    clientId = (await fetchClientId(clientToken.access_token)) ?? "";
    if (!clientId)
      throw new Error("Could not resolve the client id from /self.");

    const { body } = await call("GET", companies(), clientToken.access_token);
    const rows = ((
      body as {
        data?: (WireRow & { vat_number?: string; reg_number?: string })[];
      }
    )?.data ?? []) as (WireRow & {
      vat_number?: string;
      reg_number?: string;
    })[];
    targetCompanyId =
      find(rows, row => row.vat_number && row.reg_number)?.id ?? rows[0]?.id;

    const addressesResp = await call(
      "GET",
      `/api/clients/${clientId}/addresses`,
      clientToken.access_token
    );
    const addresses = ((addressesResp.body as { data?: WireRow[] })?.data ??
      []) as WireRow[];
    const defaultAddress =
      find(addresses, address => Boolean(address.default)) ?? addresses[0];
    defaultAddressId = defaultAddress?.id;
    defaultCountryId = defaultAddress?.country_id;
    if (!defaultAddressId)
      throw new Error(
        "The staging client has no address for a manager capture."
      );

    const created = await call("POST", companies(), clientToken.access_token, {
      name: `prover-manager-${Date.now()}`,
      reg_number: "PROVER-REG",
      vat_number: "",
      address_id: defaultAddressId
    });
    throwawayId = (created.body as { data?: { id?: string } })?.data?.id;
    if (!throwawayId)
      throw new Error("Could not arrange a throwaway company for the manager.");
  }, 60000);

  afterAll(async () => {
    if (throwawayId)
      await call(
        "DELETE",
        `${companies()}/${throwawayId}`,
        clientToken.access_token
      ).catch(() => undefined);
    for (const id of createdInline)
      await call(
        "DELETE",
        `${companies()}/${id}`,
        clientToken.access_token
      ).catch(() => undefined);
    for (const id of createdInlineEmails)
      await call(
        "DELETE",
        `/api/clients/${clientId}/emails/${id}`,
        clientToken.access_token
      ).catch(() => undefined);
  }, 30000);

  describe("I start a brand-new company", () => {
    const scenario = "I start a brand-new company";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I start adding a company", () =>
      recordStep(scenario, "I start adding a company", freshManager));
  });

  // AC-20 — a fresh draft with an address id, the pre-selected emailId cleared and
  // a brand-new inline email. On save the module's ensure creates the email, then
  // the company is created against it; the collection re-reads. The throwaway email
  // and company are cleaned in the describe's afterAll.
  describe("I supply a brand-new inline email and my company is saved against it", () => {
    const scenario =
      "I supply a brand-new inline email and my company is saved against it";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I am starting a new company", () =>
      recordStep(scenario, "I am starting a new company", freshManager));
    it("I supply a brand-new email inline and save", () =>
      recordStep(
        scenario,
        "I supply a brand-new email inline and save",
        async generator => {
          const emailResp = await generator.post(
            `/api/clients/${clientId}/emails`,
            { email: `prover-inline-${Date.now()}@example.com` }
          );
          const emailId = (emailResp.body as { data?: { id?: string } })?.data
            ?.id;
          if (emailId) createdInlineEmails.add(emailId);
          const companyResp = await generator.post(companies(), {
            name: `prover-inline-${Date.now()}`,
            address_id: defaultAddressId,
            email_id: emailId
          });
          const companyId = (companyResp.body as { data?: { id?: string } })
            ?.data?.id;
          if (companyId) createdInline.add(companyId);
          await generator.get(
            `${companies()}?with=${COMPANY_WITH}&with_staged_imports=1&order=created_at&limit=0&offset=0`
          );
        }
      ));
  });

  describe("I open a company for editing, with what I already have on file", () => {
    const scenario =
      "I open a company for editing, with what I already have on file";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I open one of my companies for editing", () =>
      recordStep(
        scenario,
        "I open one of my companies for editing",
        generator => openManager(generator, targetCompanyId!)
      ));
  });

  describe("The form tells me what is wrong before it saves", () => {
    const scenario = "The form tells me what is wrong before it saves";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I am editing one of my companies", () =>
      recordStep(scenario, "I am editing one of my companies", generator =>
        openManager(generator, throwawayId!)
      ));
  });

  describe("Save a change to a company I am editing", () => {
    const scenario = "Save a change to a company I am editing";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I am editing one of my companies", () =>
      recordStep(scenario, "I am editing one of my companies", generator =>
        openManager(generator, throwawayId!)
      ));
    it("I change its name and save", () =>
      recordStep(scenario, "I change its name and save", async generator => {
        await generator.put(`${companies()}/${throwawayId}`, {
          name: `prover-manager-${Date.now()}-renamed`
        });
        await generator.get(
          `${companies()}/${throwawayId}?with=${COMPANY_WITH}`
        );
      }));
  });

  describe("I am told when a save fails, where I am working", () => {
    const scenario = "I am told when a save fails, where I am working";
    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I am editing one of my companies", () =>
      recordStep(scenario, "I am editing one of my companies", generator =>
        openManager(generator, throwawayId!)
      ));
    it("a save of mine is rejected", () =>
      recordStep(scenario, "a save of mine is rejected", async generator => {
        const { status } = await generator.put(
          `${companies()}/${throwawayId}`,
          { address_id: "00000000-0000-0000-0000-000000000000" }
        );
        if (status < 400)
          console.warn(
            `[client-company.fixtures] manager save-rejected expected a 4xx, ` +
              `got ${status} — inspect before the scenario relies on it.`
          );
      }));
  });

  describe("Choosing a country re-offers the right regions", () => {
    const scenario = "Choosing a country re-offers the right regions";
    let otherCountryId: string | undefined;

    beforeAll(async () => {
      const { body } = await call(
        "GET",
        "/api/countries?limit=0",
        clientToken.access_token
      );
      const countries = ((body as { data?: { id: string; name: string }[] })
        ?.data ?? []) as { id: string; name: string }[];
      const canada = find(countries, c => c.name === "Canada");
      const afghanistan = find(countries, c => c.name === "Afghanistan");
      otherCountryId =
        (canada?.id !== defaultCountryId ? canada?.id : afghanistan?.id) ??
        canada?.id;
      if (!otherCountryId)
        throw new Error("Could not resolve a second country with regions.");
    }, 30000);

    it(OPEN, () => recordStep(scenario, OPEN, boot));
    it("I am editing one of my companies", () =>
      recordStep(scenario, "I am editing one of my companies", generator =>
        openManager(generator, throwawayId!)
      ));
    it("I change my company's country to another country", () =>
      recordStep(
        scenario,
        "I change my company's country to another country",
        generator => generator.get(`/api/countries/${otherCountryId}/regions`)
      ));
  });
});

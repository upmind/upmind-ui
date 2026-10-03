// -----------------------------------------------------------------------------
/**
 * @fileoverview Stats Scenario Fixtures Generator (ADR 035, FE-3145)
 *
 * ## Job To Be Done
 * Record ONE folder per step of each DRIVEN `stats.feature` scenario against
 * real staging — the verbatim answers `stats.replay.int.test.ts` replays. Run on
 * demand, ONE scenario at a time:
 *
 *   pnpm fixtures:generate stats --scenario "<exact scenario title>"
 *
 * A bare `pnpm fixtures:generate stats` re-records EVERY scenario.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — so it is EXCLUDED from the normal `*.test.ts` / `*.int.test.ts`
 * suites by the `*.fixtures.ts` suffix. It has no assertions: an `it()` succeeds
 * when the capture completes.
 *
 * ## The four counts, absence, zero, and usage
 * The signed-in client's four `GET api/stats` reads (orders, invoices,
 * unpaid-category, open-tickets) carry whatever counts staging holds for that
 * client — the business outcome each scenario asserts is read off the recording,
 * never a copied literal. The default staging client holds real non-zero counts;
 * the absent (null category) and zero (0 tickets) states it does NOT hold are
 * recorded for that ONE read against the second staging client
 * (`mintOtherClientToken`), who genuinely holds them. The stats reads are id-less
 * on the wire (bearer-only), so the recording answers the default session's
 * identical request by exact identity at replay (ADR 035 §6).
 *
 * ## The usage refusal
 * The default staging client is not an Upmind client, so `GET
 * api/clients/upmind_usage` answers the real 409 "This client is not an Upmind
 * client!" — the refusal AC-13/AC-14 replay. No 500 is fabricated (handover §6).
 *
 * ## date_to and the frozen clock
 * Each stats read carries `date_to=<local today>`. `setup.integration.ts` freezes
 * the replay clock to {@link RECORD_DATE} at local noon, so the composable emits
 * the same `date_to` at replay. Re-record and move `RECORDED_DATE` in
 * `setup.integration.ts` to match {@link RECORD_DATE} below.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintOtherClientToken,
  mintStaffToken
} from "../../auth/__tests__/auth.tokens";
import { filter, find, forEach, split } from "lodash-es";
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

const feature = readFileSync(
  join(import.meta.dirname, "stats.feature"),
  "utf-8"
);

/**
 * The calendar date each stats read binds `date_to` to, and the date the replay
 * clock is frozen to in `setup.integration.ts` (`RECORDED_DATE`). FIXED, not
 * today's date: `date_to` is part of the recorded request path, so a floating
 * date would rename every recording on each re-record and break the step
 * catalog's static imports. On a deliberate re-record, bump this AND
 * `RECORDED_DATE` in `setup.integration.ts` together, and the step-catalog
 * imports that name the date.
 */
const RECORD_DATE = "2026-10-03";

/** The four `GET api/stats` reads, exactly as the composable serialises them. */
type StatType = "contracts" | "invoices" | "invoices_category" | "tickets";

function statUrl(type: StatType): string {
  const params = new URLSearchParams();
  params.set("type", type);
  if (type === "invoices_category") {
    params.set("report", '["total"]');
    params.set("invoice_status", '["invoice_unpaid","invoice_overdue"]');
  }
  if (type === "tickets") params.set("report", '["open"]');
  params.set("date_to", RECORD_DATE);
  if (type !== "tickets") params.set("currency_code", "ALL");
  return `/api/stats?${params.toString()}`;
}

const STAT_TYPES: readonly StatType[] = [
  "contracts",
  "invoices",
  "invoices_category",
  "tickets"
];

const USAGE_URL = "/api/clients/upmind_usage";

/**
 * The exact `keys` set the session boot's `GET /api/config/brand/values` request
 * carries — observed off the real boot (`stats.replay`), and the set `useBrand`
 * caches for `useStats` to read the support-system flag from in-memory
 * (design 8.5, "No second fetch"). `ui.client_area.disable_support_system` is in
 * it, so recording this request after arranging that flag ON overrides the brand
 * owner fixture for AC-7's boot alone. `keys` is an order-insensitive identity
 * param, so the SET must match the boot's verbatim.
 */
const BRAND_CONFIG_KEYS = [
  "analytics.google.measurement_id",
  "analytics.gtm.container_id",
  "ui.basket.default_currency",
  "ui.basket.add_to_basket_funnelling",
  "ui.basket.payment_term_descriptions",
  "billing.gateway.force_auto_payment_for_stored_details",
  "billing.gateway.force_card_storage",
  "ui.checkout.checkout_flow",
  "ui.checkout.hide_promotions_field",
  "invoices.common.require_phone_for_orders",
  "ui.checkout.checkout_summary_color_stop1",
  "ui.checkout.checkout_summary_color_stop2",
  "ui.checkout.checkout_summary_contrast_mode",
  "security.ui.allow_vault",
  "ui.client_area.homepage",
  "invoices.common.default_payment_period",
  "ui.client_area.hide_registration_forms",
  "invoices.guest_checkout.enabled",
  "provisioning.domain_names.search_method",
  "billing.gateway.client_allow_partial_payments",
  "invoices.common.is_available_pay_later",
  "billing.gateway.allow_card_removal_replacement",
  "invoices.common.display_price_type",
  "invoices.common.require_address_for_orders",
  "invoices.common.require_company_for_orders",
  "ui.client_registration.require_phone",
  "invoices.common.required_region_in_address",
  "security.orders.require_verified_email",
  "ui.basket.truncate_product_description",
  "ui.client_area.show_catalog",
  "invoices.common.show_promotion_as",
  "tickets.support.support_pin_enabled",
  "price_tax.tax.enable_automatic_vat_validation",
  "ui.client_area.disable_support_system",
  "ui.client_area.page_after_login",
  "ui.client_area.enter_key_action",
  "ui.client_area.price_before_discount_position"
].join(",");

const BRAND_CONFIG_URL = `/api/config/brand/values?keys=${BRAND_CONFIG_KEYS}`;

/** The brand setting AC-7 arranges off, as its dotted config key. */
const SUPPORT_SYSTEM_DISABLE_KEY = "ui.client_area.disable_support_system";

/** Plain, UNCAPTURED authed call — admin listing, impersonation, id resolution. */
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

/** The staging brand id the acting client resolves to. */
async function resolveBrandId(accessToken: string): Promise<string> {
  const { body } = await call("GET", "/api/brand/settings", accessToken);
  return String((body as { data?: { id?: string } })?.data?.id ?? "");
}

/**
 * The admin brand-config group's fields, keyed by code — the whole group must be
 * echoed back on a write (a single-field body 422s a group with interdependent
 * fields). Mirrors `invoices.fixtures.ts` `readBrandGroupFields`, which owns the
 * same gate's own scenarios.
 */
async function readBrandGroupFields(
  staffAccessToken: string,
  brandId: string,
  category: string,
  group: string
): Promise<Record<string, unknown>> {
  const { status, body } = await call(
    "GET",
    `/api/admin/config/brand/categories/${category}/groups?brand_id=${brandId}&with=fields.value`,
    staffAccessToken
  );
  if (status !== 200)
    throw new Error(`admin read of ${category}/${group} returned ${status}.`);
  type Field = { code?: string; value?: { value?: unknown } | null };
  type Group = { code?: string; fields?: Field[] | { data?: Field[] } };
  const groups = (body as { data?: Group[] })?.data ?? [];
  const grp = find(groups, g => g.code === group);
  if (!grp) throw new Error(`admin group ${category}/${group} not found.`);
  const fieldList = Array.isArray(grp.fields)
    ? grp.fields
    : (grp.fields?.data ?? []);
  const fields: Record<string, unknown> = {};
  forEach(fieldList, f => {
    if (f.code)
      fields[f.code] = (f.value as { value?: unknown })?.value ?? null;
  });
  return fields;
}

async function readBrandValue(
  staffAccessToken: string,
  brandId: string,
  dottedKey: string
): Promise<unknown> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readBrandGroupFields(
    staffAccessToken,
    brandId,
    category,
    group
  );
  return fields[field] ?? null;
}

async function writeBrandValue(
  staffAccessToken: string,
  brandId: string,
  dottedKey: string,
  value: unknown
): Promise<void> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readBrandGroupFields(
    staffAccessToken,
    brandId,
    category,
    group
  );
  fields[field] = value;
  const { status, body } = await call(
    "PUT",
    `/api/admin/config/brand/${category}?brand_id=${brandId}`,
    staffAccessToken,
    { groups: { [group]: { fields } } }
  );
  if (status !== 200)
    throw new Error(
      `admin write of ${dottedKey}=${JSON.stringify(value)} returned ${status}: ${JSON.stringify(body).slice(0, 200)}`
    );
}

/** Mint a client's own token the legacy "login as" way, or `undefined` if refused. */
async function impersonate(
  staffToken: string,
  clientId: string
): Promise<IToken | undefined> {
  const { body } = await call(
    "POST",
    `/api/admin/clients/${clientId}/access_token`,
    staffToken
  );
  const token = (
    (body as { access_token?: string }).access_token
      ? body
      : (body as { data?: IToken }).data
  ) as IToken | undefined;
  return token?.access_token ? token : undefined;
}

/** The `data.total` report an impersonated client's unpaid-category read returns. */
async function categoryReportOf(clientToken: string): Promise<unknown> {
  const { body } = await call("GET", statUrl("invoices_category"), clientToken);
  return (body as { data?: { total?: unknown } })?.data?.total;
}

// -----------------------------------------------------------------------------

describe("Stats scenario recordings", () => {
  let clientToken: IToken;
  let otherToken: IToken;
  let staffToken: string;
  const prepared = new Set<string>();

  /** Records the requests one step makes into that step's own folder. */
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
      name: "stats"
    });
    await requests(generator);
    generator.save();
  }

  /**
   * Records a scenario's boot: the four stat reads AND the usage read, which the
   * in-context (localhost) usage query fires on mount, so every scenario's boot
   * must answer it. `overrides` names the read types recorded against a token
   * other than the default client's — the absent-category impersonation and the
   * second client's zero-tickets — the states the default client does not hold.
   * Every other read is the default client's own; the usage read is the default
   * client's real 409 refusal.
   */
  const recordBoot =
    (
      overrides: Partial<Record<StatType, IToken>> = {},
      withBrandConfig = false
    ) =>
    async (generator: Generator): Promise<void> => {
      if (withBrandConfig) {
        generator.setBearerToken(clientToken.access_token);
        await generator.get(BRAND_CONFIG_URL);
      }
      for (const type of STAT_TYPES) {
        generator.setBearerToken((overrides[type] ?? clientToken).access_token);
        await generator.get(statUrl(type));
      }
      generator.setBearerToken(clientToken.access_token);
      await generator.get(USAGE_URL);
      generator.clearBearerToken();
    };

  beforeAll(async () => {
    clientToken = await mintClientToken();
    otherToken = await mintOtherClientToken();
    staffToken = (await mintStaffToken()).access_token;
  }, 30000);

  /**
   * Impersonates an admin-listed client whose unpaid-category report is a true
   * absence (`data.total === null`) — the "nothing to report" state the two
   * default staging clients no longer hold. The owner is PICKED from the admin
   * listing each run (legacy "login as", vue-app `impersonateClient`), never a
   * copied literal; a read, so nothing on staging is mutated (ADR 035 §3).
   */
  async function absentCategoryToken(): Promise<IToken> {
    const { body } = await call(
      "GET",
      "/api/admin/clients?limit=50&order=-created_at",
      staffToken
    );
    const rows = filter(
      (body as { data?: Array<{ id?: string }> })?.data ?? [],
      row => !!row.id
    );
    for (const row of rows) {
      const token = await impersonate(staffToken, row.id!);
      if (!token) continue;
      if ((await categoryReportOf(token.access_token)) === null) return token;
    }
    throw new Error(
      "absent-category arrange: no admin-listed client reports a null " +
        "unpaid-category — cannot record the absence state."
    );
  }

  afterAll(() => undefined);

  // --- AC-1..4: the four dashboard counts, the default client's own ----------

  const BG = "I am an authenticated client reading my own dashboard counts";

  for (const title of [
    "See how many orders I have placed",
    "See how many invoices I hold, in every currency I hold them in",
    "See how many of my invoices I have still to pay",
    "See how many of my support tickets are still open"
  ]) {
    describe(title, () => {
      it(BG, () => recordStep(title, BG, recordBoot()));
    });
  }

  // --- AC-6: absence — the unpaid-category read the default client does not
  // hold as null is recorded against the second client, who does -------------

  describe("Having none of something shows me nothing, and never a zero", () => {
    const scenario =
      "Having none of something shows me nothing, and never a zero";
    let absentToken: IToken;
    beforeAll(async () => {
      absentToken = await absentCategoryToken();
    }, 120000);
    it(BG, () =>
      recordStep(scenario, BG, recordBoot({ invoices_category: absentToken }))
    );
  });

  // --- AC-6: zero — the open-tickets read as a genuine 0 (second client) -----

  describe("Having zero of something shows me the zero", () => {
    const scenario = "Having zero of something shows me the zero";
    it(BG, () => recordStep(scenario, BG, recordBoot({ tickets: otherToken })));
  });

  // --- AC-23: a true zero (tickets) among the default client's real numbers --

  describe("Holding a real zero does not tell me my account is empty", () => {
    const scenario = "Holding a real zero does not tell me my account is empty";
    it(BG, () => recordStep(scenario, BG, recordBoot({ tickets: otherToken })));
  });

  // --- AC-13 / AC-14: the usage refusal (the real 409) ----------------------
  // The usage read fires on mount with the counts, so the boot step records it;
  // the later "I ask for my usage" step re-reads the same identity, answered by
  // the boot recording.

  for (const scenario of [
    "I am offered no usage block when my usage is refused me",
    "A refused usage read is reported as refused"
  ]) {
    describe(scenario, () => {
      it(BG, () => recordStep(scenario, BG, recordBoot()));
    });
  }

  // --- AC-7: the brand turns its support system off --------------------------
  // The support-system flag is a brand CONFIG value the session boot caches and
  // `useStats` reads in-memory (no fetch of its own). Staff ARRANGES the flag ON,
  // the boot step records the brand-config read carrying it (overriding the brand
  // owner fixture for THIS scenario alone), and the original value is RESTORED in
  // afterAll (ADR 035 §3). The staff token only arranges; it is never an actor.

  describe("My ticket count is not offered when my brand turns its support system off", () => {
    const scenario =
      "My ticket count is not offered when my brand turns its support system off";
    let brandId: string;
    let original: unknown;

    beforeAll(async () => {
      brandId = await resolveBrandId(clientToken.access_token);
      if (!brandId)
        throw new Error(`${scenario}: could not resolve the brand id.`);
      original = await readBrandValue(
        staffToken,
        brandId,
        SUPPORT_SYSTEM_DISABLE_KEY
      );
      await writeBrandValue(
        staffToken,
        brandId,
        SUPPORT_SYSTEM_DISABLE_KEY,
        true
      );
    }, 120000);

    afterAll(async () => {
      if (brandId)
        await writeBrandValue(
          staffToken,
          brandId,
          SUPPORT_SYSTEM_DISABLE_KEY,
          original
        );
    });

    it(BG, () => recordStep(scenario, BG, recordBoot({}, true)));
  });

  // --- Flat forced-state one-offs (labs force mode + fixture-provenance) ------
  // The handover layout reserves `fixtures/*.json` for the labs playground's
  // forced states. These are the module's default corpus — the four counts and
  // the usage refusal — recorded flat (dateless identity names) as the "default"
  // forced state the force mode arms. Real recordings, one request each.

  describe("Stats labs forced-state fixtures", () => {
    const flatDir = join(import.meta.dirname, "fixtures");
    const recordFlat = async (path: string): Promise<void> => {
      const generator = new Generator(API_URL, {
        recordingsDir: flatDir,
        origin: ORIGIN,
        source: "case",
        name: "stats"
      });
      generator.setBearerToken(clientToken.access_token);
      await generator.get(path);
      generator.clearBearerToken();
      generator.save();
    };

    for (const type of STAT_TYPES)
      it(`forces the ${type} count`, () => recordFlat(statUrl(type)));
    it("forces the usage refusal", () => recordFlat(USAGE_URL));
  });
});

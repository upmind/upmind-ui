// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Billing-Settings scenario recorder (FE-3145, ADR 035)
 *
 * ## Job To Be Done
 * Record ONE recording per DRIVEN `client-billing-settings.feature` scenario,
 * one fixtures folder per step, named from the feature by `recordedStepDir`.
 * Each scenario records the module's OWN requests its steps make against real
 * staging, in step order, and leaves staging exactly as it found it. Run:
 *
 *   pnpm fixtures:generate client-billing-settings
 *
 * The module's own reads are the client record (`GET clients/{id}`) and its
 * brand-gate config call (`GET config/brand/values`); its own write is the
 * consolidation `PUT clients/{id}`. Boot reads the session makes (brand
 * settings, system, basket, token, `/self`) are answered at replay by the
 * OWNER modules' recordings, never recorded here.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal suites by the `*.fixtures.ts` suffix.
 * It has no assertions: an `it()` succeeds when the capture completes.
 *
 * ## Staging hygiene
 * The account's five `invoice_consolidation_*` fields are restored to their
 * recorded baseline after every scenario that writes them, so a re-record never
 * leaves the shared staging client altered.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, beforeAll, afterAll, afterEach } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import { GrantTypes } from "@upmind-automation/types";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
import { filter, find, forEach, kebabCase, map, split } from "lodash-es";
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
  join(import.meta.dirname, "client-billing-settings.feature"),
  "utf-8"
);

/**
 * The brand-gate config call the module makes on boot — the two gate keys plus
 * the four brand consolidation defaults the schedule rules read. Recorded in
 * the SAME `?keys=<comma-joined>&lang=en` form the module (via
 * `useBrand().ensureConfig`) sends, so the recording matches by identity.
 * Confirmed against the replay's capture-gap message.
 */
const GATE_KEYS = [
  "invoices.consolidation.restrict_to_staff",
  "billing.payment_currencies.enable_different_currency_payment",
  "invoices.consolidation.enabled",
  "invoices.consolidation.base_rule",
  "invoices.consolidation.base_rule_day_of_week",
  "invoices.consolidation.base_rule_date_of_month_day"
].join(",");

type WireClient = {
  id: string;
  never_suspend?: boolean;
  invoice_consolidation_enabled?: number;
  invoice_consolidation_base_rule?: string | null;
  invoice_consolidation_base_rule_day_of_week?: string | null;
  invoice_consolidation_base_rule_date_of_month_day?: number | null;
  invoice_consolidation_due_date_day?: number | null;
};

/** The session account carries the billing currency + optional preferred payment currency. */
type WireAccount = {
  id?: string;
  currency_id?: string;
  preferred_payment_currency_id?: string | null;
};

/** `/self` — the session account id and the account list the manager reads currencies off. */
type WireSelf = {
  account_id?: string;
  accounts?: WireAccount[];
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
// Admin brand-config arrange (FE-3145) — set a brand gate with the STAFF
// (administrator) account, record the client's boot with that value, then
// restore the original. Dotted key `{category}.{group}.{field}`; write body
// `{ groups: { <group>: { fields: { <field>: value } } } }` on `brand/{category}`.
// -----------------------------------------------------------------------------

type BrandField = { code?: string; value?: { value?: unknown } | null };
type BrandGroup = {
  code?: string;
  fields?: { data?: BrandField[] } | BrandField[];
};

async function mintStaffToken(): Promise<string> {
  const token = await mintToken({
    grant_type: GrantTypes.ADMIN,
    username: API_CREDENTIALS.staff.username,
    password: API_CREDENTIALS.staff.password
  });
  if (!token?.access_token)
    throw new Error(
      "Could not mint a staff (admin) token for the brand arrange."
    );
  return token.access_token;
}

async function resolveBrandId(clientAccessToken: string): Promise<string> {
  const { body } = await call("GET", "/api/brand/settings", clientAccessToken);
  const id = String((body as { data?: { id?: string } })?.data?.id ?? "");
  if (!id)
    throw new Error(
      "Could not resolve the staging brand id for the admin arrange."
    );
  return id;
}

/** Every field of a category group as `{ code: currentValue }` (the value's `.value`). */
async function readGroupFields(
  staffToken: string,
  brandId: string,
  category: string,
  group: string
): Promise<Record<string, unknown>> {
  const { status, body } = await call(
    "GET",
    `/api/admin/config/brand/categories/${category}/groups?brand_id=${brandId}&with=fields.value`,
    staffToken
  );
  if (status !== 200)
    throw new Error(`admin read of ${category}/${group} returned ${status}.`);
  const groups = (body as { data?: BrandGroup[] })?.data ?? [];
  const grp = find(groups, g => g.code === group);
  if (!grp) throw new Error(`admin group ${category}/${group} not found.`);
  const fields = Array.isArray(grp.fields)
    ? grp.fields
    : (grp.fields?.data ?? []);
  const map: Record<string, unknown> = {};
  forEach(fields, f => {
    if (f.code) map[f.code] = (f.value as { value?: unknown })?.value ?? null;
  });
  return map;
}

async function readBrandValue(
  staffToken: string,
  brandId: string,
  dottedKey: string
): Promise<unknown> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readGroupFields(staffToken, brandId, category, group);
  return fields[field] ?? null;
}

/**
 * Writes `{category}.{group}.{field}`. The whole group's current fields are
 * echoed back with only the target changed — a group with interdependent fields
 * (e.g. `invoices.consolidation`) 422s a single-field body.
 */
async function writeBrandValue(
  staffToken: string,
  brandId: string,
  dottedKey: string,
  value: unknown
): Promise<void> {
  const [category, group, field] = split(dottedKey, ".");
  const fields = await readGroupFields(staffToken, brandId, category, group);
  fields[field] = value;
  const { status, body } = await call(
    "PUT",
    `/api/admin/config/brand/${category}?brand_id=${brandId}`,
    staffToken,
    { groups: { [group]: { fields } } }
  );
  if (status !== 200)
    throw new Error(
      `admin write of ${dottedKey}=${JSON.stringify(value)} returned ${status}: ${JSON.stringify(body).slice(0, 300)}`
    );
}

// -----------------------------------------------------------------------------
// SCENARIOS — one recording per DRIVEN `.feature` scenario.
// -----------------------------------------------------------------------------

describe("Client-Billing-Settings scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let baseline: WireClient | undefined;
  const prepared = new Set<string>();

  const clientRecord = () => `/api/clients/${clientId}`;
  const withCustomFields = "?with=custom_fields,custom_fields.field";

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
      name: kebabCase(scenario)
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.save();
  }

  /** The module's boot reads — the client record and the brand-gate config. */
  const readBoot = async (generator: Generator) => {
    await generator.get(`${clientRecord()}${withCustomFields}`);
    await generator.get(`/api/config/brand/values?keys=${GATE_KEYS}&lang=en`);
  };

  /** A consolidation write, echoing the saved field(s). */
  const putConsolidation =
    (body: Record<string, unknown>) => (generator: Generator) =>
      generator.put(clientRecord(), body);

  /** Restores the account's five consolidation fields to the recorded baseline. */
  async function restoreStaging(): Promise<void> {
    if (!baseline) return;
    await call("PUT", clientRecord(), clientToken.access_token, {
      invoice_consolidation_enabled: baseline.invoice_consolidation_enabled,
      invoice_consolidation_base_rule: baseline.invoice_consolidation_base_rule,
      invoice_consolidation_base_rule_day_of_week:
        baseline.invoice_consolidation_base_rule_day_of_week,
      invoice_consolidation_base_rule_date_of_month_day:
        baseline.invoice_consolidation_base_rule_date_of_month_day,
      invoice_consolidation_due_date_day:
        baseline.invoice_consolidation_due_date_day
    });
  }

  beforeAll(async () => {
    const token = await mintToken({
      grant_type: GrantTypes.PASSWORD,
      username: API_CREDENTIALS.client.username,
      password: API_CREDENTIALS.client.password
    });
    if (!token)
      throw new Error(
        "Could not mint a client token with the staging credentials — " +
          "check tests/fixtures/credentials.ts against the recording brand."
      );
    clientToken = token;

    const id = await fetchClientId(clientToken.access_token);
    if (!id)
      throw new Error(
        "Could not resolve the client id from /self — cannot capture the " +
          "clients/{id} fixtures."
      );
    clientId = id;

    const { body, status } = await call(
      "GET",
      `${clientRecord()}${withCustomFields}`,
      clientToken.access_token
    );
    if (status !== 200)
      throw new Error(
        `Baseline read returned ${status} — cannot resolve the account's ` +
          "current consolidation values to restore after the write captures."
      );
    baseline = (body as { data: WireClient }).data;
  }, 30000);

  afterEach(restoreStaging);

  const OPEN = "I am an authenticated client";

  // --- read-only: only the Background boot is recorded ---------------------
  forEach(
    [
      "My preference shows my actual saved values, addressed to my own record",
      "I am told when I have unsaved changes, compared against what was last loaded",
      "I can abandon my unsaved changes and get back exactly what was last loaded",
      "I cannot save an invalid value — the save is refused and nothing is sent"
    ],
    scenario => {
      it(`${scenario} — ${OPEN}`, () => recordStep(scenario, OPEN, readBoot));
    }
  );

  // --- AC-3: turn consolidation on / off / inherit -------------------------
  describe("I can turn consolidation on, off, or set it to follow my brand", () => {
    const scenario =
      "I can turn consolidation on, off, or set it to follow my brand";
    it(OPEN, () => recordStep(scenario, OPEN, readBoot));
    it("I choose to turn consolidation on, off, or to follow my brand, and save", () =>
      recordStep(
        scenario,
        "I choose to turn consolidation on, off, or to follow my brand, and save",
        putConsolidation({ invoice_consolidation_enabled: 0 })
      ));
  });

  // --- AC-4: base rule set / clear -----------------------------------------
  describe("I can choose a base rule for my consolidation cadence, or follow my brand's", () => {
    const scenario =
      "I can choose a base rule for my consolidation cadence, or follow my brand's";
    it(OPEN, () => recordStep(scenario, OPEN, readBoot));
    it("I choose a base rule and save, and later clear that choice and save again", () =>
      recordStep(
        scenario,
        "I choose a base rule and save, and later clear that choice and save again",
        putConsolidation({ invoice_consolidation_base_rule: "day_of_week" })
      ));
    it("clearing it is saved as an explicit choice to follow my brand's rule, not left unspecified", () =>
      recordStep(
        scenario,
        "clearing it is saved as an explicit choice to follow my brand's rule, not left unspecified",
        putConsolidation({ invoice_consolidation_base_rule: null })
      ));
  });

  // --- AC-5: day of week set / clear ---------------------------------------
  describe("I can choose which day of the week my weekly cadence runs on, or follow my brand's", () => {
    const scenario =
      "I can choose which day of the week my weekly cadence runs on, or follow my brand's";
    it(OPEN, () => recordStep(scenario, OPEN, readBoot));
    it("my base rule is a weekly cadence", () =>
      recordStep(
        scenario,
        "my base rule is a weekly cadence",
        putConsolidation({ invoice_consolidation_base_rule: "day_of_week" })
      ));
    it("I choose a day of the week and save, and later clear that choice and save again", () =>
      recordStep(
        scenario,
        "I choose a day of the week and save, and later clear that choice and save again",
        putConsolidation({
          invoice_consolidation_base_rule_day_of_week: "monday"
        })
      ));
    it("clearing it is saved as an explicit choice to follow my brand's day, not left unspecified", () =>
      recordStep(
        scenario,
        "clearing it is saved as an explicit choice to follow my brand's day, not left unspecified",
        putConsolidation({ invoice_consolidation_base_rule_day_of_week: null })
      ));
  });

  // --- AC-6: day of month set / restore ------------------------------------
  describe("I can choose which day of the month my monthly cadence runs on, or restore my brand's default", () => {
    const scenario =
      "I can choose which day of the month my monthly cadence runs on, or restore my brand's default";
    it(OPEN, () => recordStep(scenario, OPEN, readBoot));
    it("my base rule is a monthly cadence", () =>
      recordStep(
        scenario,
        "my base rule is a monthly cadence",
        // The monthly rule's wire value is `date_of_month`
        // (`InvoiceConsolidationRuleTypes.DAY_OF_MONTH`), and the API refuses
        // it without a day, so a day rides in the recorded arrangement.
        putConsolidation({
          invoice_consolidation_base_rule: "date_of_month",
          invoice_consolidation_base_rule_date_of_month_day: 1
        })
      ));
    it("I choose a valid day of the month and save, and later restore the default and save again", () =>
      recordStep(
        scenario,
        "I choose a valid day of the month and save, and later restore the default and save again",
        putConsolidation({
          invoice_consolidation_base_rule_date_of_month_day: 15
        })
      ));
    it("restoring the default is saved as an explicit choice to follow my brand's day, not left unspecified", () =>
      recordStep(
        scenario,
        "restoring the default is saved as an explicit choice to follow my brand's day, not left unspecified",
        putConsolidation({
          invoice_consolidation_base_rule_date_of_month_day: null
        })
      ));
  });

  // --- AC-7: due-date day (never-suspended client + monthly rule) -----------
  // The due-date field is drawn only for a monthly rule on a never-suspended
  // client. Staff sets never_suspend on the shared client via the admin route;
  // the monthly rule is re-arranged before each captured PUT because the
  // describe's afterEach restores the consolidation baseline between steps.
  // never_suspend is restored to its recorded baseline in afterAll.
  describe("I can choose the day my invoice is due, or leave it at the earliest available day", () => {
    const scenario =
      "I can choose the day my invoice is due, or leave it at the earliest available day";
    const WHEN =
      "I choose a valid due-date day and save, and later clear that choice and save again";
    const CLEAR =
      "clearing it is saved as an explicit choice for the earliest available day, not left unspecified";
    let staffToken: string;

    const adminClient = () => `/api/admin/clients/${clientId}`;
    const arrangeMonthly = () =>
      call("PUT", clientRecord(), clientToken.access_token, {
        invoice_consolidation_enabled: 1,
        invoice_consolidation_base_rule: "date_of_month",
        invoice_consolidation_base_rule_date_of_month_day: 1
      });
    const putDueDate = (day: number | null) => async (generator: Generator) => {
      await arrangeMonthly();
      await generator.put(clientRecord(), {
        invoice_consolidation_due_date_day: day
      });
    };

    beforeAll(async () => {
      staffToken = await mintStaffToken();
      await call("PUT", adminClient(), staffToken, { never_suspend: true });
      await arrangeMonthly();
    }, 30000);

    afterAll(async () => {
      await call("PUT", adminClient(), staffToken, {
        never_suspend: baseline?.never_suspend ?? false
      });
    }, 30000);

    it(OPEN, () => recordStep(scenario, OPEN, readBoot));
    it(WHEN, () => recordStep(scenario, WHEN, putDueDate(10)));
    it(CLEAR, () => recordStep(scenario, CLEAR, putDueDate(null)));
  });

  // --- AC-13: the in-flight save window. Boot, then ONE consolidation PUT whose
  // response the replay holds open (replayStep `delayMs`) so `isProcessing` is
  // observable while the save is in flight. Only the boot + the PUT are recorded;
  // the When/Then/And steps make no request.
  describe("While my save is in progress, every control is unavailable, and recovers once the save settles", () => {
    const scenario =
      "While my save is in progress, every control is unavailable, and recovers once the save settles";
    it(OPEN, () => recordStep(scenario, OPEN, readBoot));
    it("I have started saving a change to my consolidation preference", () =>
      recordStep(
        scenario,
        "I have started saving a change to my consolidation preference",
        putConsolidation({ invoice_consolidation_enabled: 0 })
      ));
  });

  // --- AC-23 / AC-17: brand-gated availability, split one scenario per gate
  // state (operator option B). Each arranges its gate value with the staff admin,
  // records the client's boot with that value, and restores the original. ------

  function gateScenario(
    title: string,
    dottedKey: string,
    gateValue: boolean
  ): void {
    describe(title, () => {
      let staffToken: string;
      let brandId: string;
      let original: unknown;
      beforeAll(async () => {
        staffToken = await mintStaffToken();
        brandId = await resolveBrandId(clientToken.access_token);
        original = await readBrandValue(staffToken, brandId, dottedKey);
        await writeBrandValue(staffToken, brandId, dottedKey, gateValue);
      }, 30000);
      afterAll(async () => {
        await writeBrandValue(staffToken, brandId, dottedKey, original);
      }, 30000);
      it(OPEN, () => recordStep(title, OPEN, readBoot));
    });
  }

  // AC-17: restricted brand — the client's manager must report itself unavailable.
  // Staff sets `restrict_to_staff:true`, the client's boot is recorded reading it,
  // and it is restored. Only the boot is recorded: a restricted editor issues no
  // write, so any PUT at replay is an unmatched request the wall fails.
  gateScenario(
    "My preference surface is hidden unless my brand has explicitly opted clients in",
    "invoices.consolidation.restrict_to_staff",
    true
  );

  gateScenario(
    "My preferred payment currency choice is not offered when my brand disallows a different currency",
    "billing.payment_currencies.enable_different_currency_payment",
    false
  );
  gateScenario(
    "My preferred payment currency choice is offered once my brand allows a different currency",
    "billing.payment_currencies.enable_different_currency_payment",
    true
  );

  // ---------------------------------------------------------------------------
  // AC-20/21/22/26: the account currencies. The client's own account carries a
  // billing `currency_id` and an optional `preferred_payment_currency_id`; the
  // manager reads them off the session account and writes them through
  // `PUT accounts/{id}` (design.md §15.3 — confirmed by the module's existing flat
  // fixtures `put-accounts-id-case-*.json`). The preferred-payment-currency field
  // is offered only when the brand allows a different payment currency, so the gate
  // `billing.payment_currencies.enable_different_currency_payment` is staff-arranged
  // ON for these scenarios and restored after. The account id, its current
  // currency, and a real alternate currency (a brand-supported currency other than
  // the account's own, off `GET brand/settings`) are resolved live inside the run
  // and logged; the account's `currency_id` + `preferred_payment_currency_id` are
  // restored to their recorded baseline after every step that writes them.
  // ---------------------------------------------------------------------------
  describe("account currencies (AC-20/21/22/26)", () => {
    let staffToken: string;
    let brandId: string;
    let gateOriginal: unknown;
    let accountId: string;
    let baseCurrencyId: string;
    let basePreferred: string | null;
    let altCurrencyId: string;
    let altCurrencyId2: string;

    const CURRENCY_GATE =
      "billing.payment_currencies.enable_different_currency_payment";
    const accountRecord = () => `/api/accounts/${accountId}`;
    const putCurrencies =
      (body: Record<string, unknown>) => (generator: Generator) =>
        generator.put(accountRecord(), body);

    async function restoreAccount(): Promise<void> {
      await call("PUT", accountRecord(), clientToken.access_token, {
        currency_id: baseCurrencyId,
        preferred_payment_currency_id: basePreferred
      });
    }

    beforeAll(async () => {
      staffToken = await mintStaffToken();
      brandId = await resolveBrandId(clientToken.access_token);
      gateOriginal = await readBrandValue(staffToken, brandId, CURRENCY_GATE);
      await writeBrandValue(staffToken, brandId, CURRENCY_GATE, true);

      // The module takes the account from `first(activeUser.accounts)`, and the
      // session reads it with `with=accounts` — a bare `/self` omits the list.
      const { body } = await call(
        "GET",
        "/api/self?with=actor,accounts",
        clientToken.access_token
      );
      const account = (body as { data?: WireSelf })?.data?.accounts?.[0];
      if (!account?.id || !account?.currency_id)
        throw new Error(
          "Could not resolve the session account (accounts[0]) / currency from /self?with=accounts."
        );
      accountId = account.id;
      baseCurrencyId = account.currency_id;
      basePreferred = account.preferred_payment_currency_id ?? null;

      const brand = await call(
        "GET",
        "/api/brand/settings",
        clientToken.access_token
      );
      const supported = filter(
        map(
          (brand.body as { data?: { currencies?: Array<{ id: string }> } })
            ?.data?.currencies ?? [],
          currency => currency.id
        ),
        id => id !== baseCurrencyId
      );
      altCurrencyId = supported[0];
      altCurrencyId2 = supported[1] ?? supported[0];
      if (!altCurrencyId)
        throw new Error(
          "The brand supports no currency other than the account's own — cannot record a currency change."
        );

      console.log(
        `[client-billing-settings recorder] account=${accountId} currency=${baseCurrencyId} preferred=${basePreferred ?? "none"} alt=${altCurrencyId} alt2=${altCurrencyId2}`
      );
    }, 30000);

    afterEach(restoreAccount);

    afterAll(async () => {
      await restoreAccount();
      await writeBrandValue(staffToken, brandId, CURRENCY_GATE, gateOriginal);
    }, 30000);

    // AC-20 — read only: the boot carries the gate-on config and the session
    // account currencies, so only the boot is recorded.
    it(`${OPEN} — account currencies read (AC-20)`, () =>
      recordStep(
        "I can see the currency my account bills in, and my preferred payment currency if I have one",
        OPEN,
        readBoot
      ));

    // AC-21 — set a preferred payment currency, then clear it. The no-change save
    // step makes no request.
    describe("I can choose a preferred payment currency for my account, and clear it again", () => {
      const scenario =
        "I can choose a preferred payment currency for my account, and clear it again";
      it(OPEN, () => recordStep(scenario, OPEN, readBoot));
      it("I choose a preferred payment currency and save, and later clear that choice and save again", () =>
        recordStep(
          scenario,
          "I choose a preferred payment currency and save, and later clear that choice and save again",
          putCurrencies({ preferred_payment_currency_id: altCurrencyId })
        ));
      it("clearing it is recorded as an explicit choice to have no preferred payment currency, not left unspecified", () =>
        recordStep(
          scenario,
          "clearing it is recorded as an explicit choice to have no preferred payment currency, not left unspecified",
          putCurrencies({ preferred_payment_currency_id: null })
        ));
    });

    // AC-22 — change the billing currency; then change both currencies in one PUT.
    describe("I can change the currency my account bills in", () => {
      const scenario = "I can change the currency my account bills in";
      it(OPEN, () => recordStep(scenario, OPEN, readBoot));
      it("I change the currency my account bills in and save", () =>
        recordStep(
          scenario,
          "I change the currency my account bills in and save",
          putCurrencies({ currency_id: altCurrencyId })
        ));
      it("changing both my billing currency and my preferred payment currency together saves them in one request", () =>
        recordStep(
          scenario,
          "changing both my billing currency and my preferred payment currency together saves them in one request",
          putCurrencies({
            currency_id: altCurrencyId2,
            preferred_payment_currency_id: altCurrencyId
          })
        ));
    });

    // AC-26 — save a new preferred payment currency; the re-read is served from the
    // save response, so only the boot + the save PUT are recorded.
    describe("After I save a new preferred payment currency, that is what I and the rest of the app see next", () => {
      const scenario =
        "After I save a new preferred payment currency, that is what I and the rest of the app see next";
      it(OPEN, () => recordStep(scenario, OPEN, readBoot));
      it("I have just saved a new preferred payment currency for my account", () =>
        recordStep(
          scenario,
          "I have just saved a new preferred payment currency for my account",
          putCurrencies({ preferred_payment_currency_id: altCurrencyId })
        ));
    });
  });
});

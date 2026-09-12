// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-Billing-Settings API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Declare the real `clients/{id}` and `brand/settings` endpoints this module
 * hits for its ONE in-scope cell (client × settings) and (re)generate their
 * sanitised v3 fixtures into this module's OWN co-located `fixtures/` dir —
 * the same files the integration tests replay through MSW. Run on demand:
 *
 *   pnpm fixtures:generate client-billing-settings
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal `*.test.ts` / `*.int.test.ts` suites
 * by the `*.fixtures.ts` suffix (see `vitest.fixtures.config.ts`). It has no
 * assertions: an `it()` succeeds when the capture completes. `save()` in
 * `afterAll` writes every capture once.
 *
 * ## Captures
 * `get-clients-id` (the read half, AC1/AC2/AC16/AC19) · one `PUT` case per
 * legacy state this module's write half must reach the wire — `enabled`
 * on/off/inherit (AC3, and AC18's literal zero), `base_rule` set/clear (AC4),
 * `day_of_week` set/clear (AC5), `day_of_month` set/clear (AC6),
 * `due_date_day` set/clear (AC7), and one multi-field `diff-only` case
 * (AC12's exact-key-set assertion) · `get-brand-settings` (O8/AC17 — the
 * brand's own `restrict_to_staff` value, replayed as recorded and, inside the
 * integration specs, cloned with ONLY that one key overridden to exercise the
 * other two branches — the same single-flag-override technique the exemplar
 * uses for its own `required: true` case, never a fabricated body).
 *
 * ## Staging reality (recorded, not assumed)
 * This is the same staging client account `client-personal-details` records
 * against (`API_CREDENTIALS.client`). Its live `invoice_consolidation_*`
 * values are whatever the account currently holds — not asserted on here;
 * only the OUTBOUND PUT bodies these captures produce matter to the read-backs.
 *
 * ## What is deliberately NOT captured here
 * The staged-import lockout (AC14) has no real staged-import account on this
 * brand to capture against — the integration spec clones the real
 * `get-clients-id` envelope and overrides only `staged_import` to `true`
 * (the same single-flag-override technique as the brand-gate case above,
 * never a fabricated envelope). A `500` (AC16) is fault-injected in the
 * integration spec itself (a generic transport-layer failure, not a captured
 * success body dressed up).
 *
 * ## Staging hygiene
 * Every field this run touches is restored to the account's own recorded
 * baseline value at the end of the run so a re-record does not leave the
 * shared staging client permanently altered.
 *
 * ## Account-currency slice captures (folded in 2026-09-09, T23/T24)
 * `GET config/brand/values` with BOTH gate keys (O8's `restrict_to_staff`
 * AND B6's `enable_different_currency_payment`) — re-recorded here because
 * `design.md` §15.6 widens the single `ensureConfig()` call to carry both
 * keys, which changes the outbound key set AC17's landed read-back already
 * depends on (T23). `GET brand/settings` — a REAL `currencies` array for
 * AC24, replacing the throwaway `{ languages: [] }` stub the harness answers
 * with elsewhere. `PUT accounts/{accountId}` — one case per AC21/AC22
 * branch (`case-currency-set`, `case-preferred-set`, `case-preferred-clear`,
 * `case-both`), against the SAME staging account `client-personal-details`
 * and this module's own consolidation captures use. `GET self` re-captured
 * once, immediately after `case-preferred-set`, into this module's own
 * `fixtures/` (never into `session-store`'s) — the "a preference IS set"
 * read state AC20/AC26 need, which the shared `session-store` capture
 * cannot supply (its own recorded baseline has `preferred_payment_currency_id:
 * null`). Every account field this run touches is restored at the end,
 * mirroring the existing consolidation restore.
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
  invoice_consolidation_enabled?: number;
  invoice_consolidation_base_rule?: string | null;
  invoice_consolidation_base_rule_day_of_week?: string | null;
  invoice_consolidation_base_rule_date_of_month_day?: number | null;
  invoice_consolidation_due_date_day?: number | null;
};

type WireAccount = {
  id: string;
  currency_id: string;
  preferred_payment_currency_id: string | null;
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

describe("Client-Billing-Settings API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let clientId: string;
  let baseline: WireClient | undefined;
  let accountBaseline: WireAccount | undefined;
  /** A REAL currency id from the brand's own list, distinct from the account's baseline currency (case-currency-set / case-both). */
  let altCurrencyId: string | undefined;
  /** A SECOND real currency id, distinct from both the baseline and `altCurrencyId` (case-preferred-set / case-both). */
  let altPreferredCurrencyId: string | undefined;

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-billing-settings"
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
        `Baseline read returned ${status} — cannot resolve the account's ` +
          "current consolidation values to restore after the write captures."
      );
    }
    baseline = (body as { data: WireClient }).data;

    // The account-currency slice's own baseline (T24) — a RAW, unrecorded
    // read (mirrors `baseline` above), so the real ids below never touch a
    // saved fixture; only the sanitised captures do.
    const selfWithAccounts = await call(
      "GET",
      "/api/self?with=accounts",
      clientToken.access_token
    );
    const account = (
      selfWithAccounts.body as {
        data?: { accounts?: WireAccount[] };
      }
    )?.data?.accounts?.[0];
    if (selfWithAccounts.status !== 200 || !account) {
      throw new Error(
        `Account baseline read returned ${selfWithAccounts.status} — cannot ` +
          "resolve the session's own account to capture or restore the " +
          "account-currency writes."
      );
    }
    accountBaseline = account;

    const brandSettings = await call(
      "GET",
      "/api/brand/settings",
      clientToken.access_token
    );
    const currencies =
      (
        brandSettings.body as {
          data?: { currencies?: { id: string; code: string }[] };
        }
      )?.data?.currencies ?? [];
    if (brandSettings.status !== 200 || currencies.length === 0) {
      throw new Error(
        `Brand settings read returned ${brandSettings.status} with ` +
          `${currencies.length} currencies — cannot pick real, distinct ` +
          "currency ids for the account-currency write captures."
      );
    }
    altCurrencyId = currencies.find(
      currency => currency.id !== accountBaseline?.currency_id
    )?.id;
    altPreferredCurrencyId = currencies.find(
      currency =>
        currency.id !== accountBaseline?.currency_id &&
        currency.id !== altCurrencyId
    )?.id;
    if (!altCurrencyId || !altPreferredCurrencyId) {
      throw new Error(
        "Could not find two REAL currency ids distinct from the account's " +
          "own baseline currency — the brand's currency list is too small " +
          "to capture the account-currency write cases."
      );
    }
  }, 30000);

  afterAll(async () => {
    generator.save();
    if (clientToken && clientId && baseline) {
      await call("PUT", `/api/clients/${clientId}`, clientToken.access_token, {
        invoice_consolidation_enabled: baseline.invoice_consolidation_enabled,
        invoice_consolidation_base_rule:
          baseline.invoice_consolidation_base_rule,
        invoice_consolidation_base_rule_day_of_week:
          baseline.invoice_consolidation_base_rule_day_of_week,
        invoice_consolidation_base_rule_date_of_month_day:
          baseline.invoice_consolidation_base_rule_date_of_month_day,
        invoice_consolidation_due_date_day:
          baseline.invoice_consolidation_due_date_day
      });
    }
    if (clientToken && accountBaseline) {
      await call(
        "PUT",
        `/api/accounts/${accountBaseline.id}`,
        clientToken.access_token,
        {
          currency_id: accountBaseline.currency_id,
          preferred_payment_currency_id:
            accountBaseline.preferred_payment_currency_id
        }
      );
    }
  });

  it("captures GET /api/clients/{id}?with=custom_fields,custom_fields.field (read — AC1/AC2/AC16/AC19)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/clients/${clientId}?with=custom_fields,custom_fields.field`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `Read capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable client record."
      );
    }
  });

  it("captures GET /api/config/brand/values?keys=invoices.consolidation.restrict_to_staff (O8/AC17)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/config/brand/values?keys=invoices.consolidation.restrict_to_staff"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `restrict_to_staff config capture returned ${status} — AC17 has no ` +
          "real brand-gate fixture to replay."
      );
    }
  });

  it("captures PUT /api/clients/{id}?case=enabled-on (AC3 — enabled=1)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=enabled-on`,
      { invoice_consolidation_enabled: 1 }
    );
    generator.clearBearerToken();
    if (status >= 400)
      throw new Error(`enabled-on capture returned ${status}.`);
  });

  it("captures PUT /api/clients/{id}?case=enabled-off (AC3/AC18 — the literal zero)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=enabled-off`,
      { invoice_consolidation_enabled: 0 }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`enabled-off capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=enabled-inherit (AC3 — enabled=2)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=enabled-inherit`,
      { invoice_consolidation_enabled: 2 }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`enabled-inherit capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=base-rule-set (AC4 — day_of_week rule)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=base-rule-set`,
      { invoice_consolidation_base_rule: "day_of_week" }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`base-rule-set capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=base-rule-clear (AC4 — explicit null)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=base-rule-clear`,
      { invoice_consolidation_base_rule: null }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`base-rule-clear capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=day-of-week-set (AC5 — monday)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=day-of-week-set`,
      { invoice_consolidation_base_rule_day_of_week: "monday" }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`day-of-week-set capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=day-of-week-clear (AC5 — explicit null)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=day-of-week-clear`,
      { invoice_consolidation_base_rule_day_of_week: null }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`day-of-week-clear capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=day-of-month-set (AC6 — 15)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=day-of-month-set`,
      { invoice_consolidation_base_rule_date_of_month_day: 15 }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`day-of-month-set capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=day-of-month-clear (AC6 — explicit null)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=day-of-month-clear`,
      { invoice_consolidation_base_rule_date_of_month_day: null }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`day-of-month-clear capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=due-date-day-set (AC7 — 7)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=due-date-day-set`,
      { invoice_consolidation_due_date_day: 7 }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`due-date-day-set capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=due-date-day-clear (AC7 — explicit null)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=due-date-day-clear`,
      { invoice_consolidation_due_date_day: null }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`due-date-day-clear capture returned ${status}.`);
    }
  });

  it("captures PUT /api/clients/{id}?case=diff-only (AC12 — a two-field diff, exact key set)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/clients/${clientId}?case=diff-only`,
      {
        invoice_consolidation_enabled: 1,
        invoice_consolidation_base_rule: "daily"
      }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`diff-only capture returned ${status}.`);
    }
  });

  // === Account-currency slice (T23/T24) ===================================

  it("captures GET /api/config/brand/values with BOTH gate keys (O8's restrict_to_staff + B6's enable_different_currency_payment)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/config/brand/values?keys=invoices.consolidation.restrict_to_staff,billing.payment_currencies.enable_different_currency_payment"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `Two-key brand-gates capture returned ${status} — AC17 and AC23 ` +
          "have no real two-key brand-gate fixture to replay."
      );
    }
  });

  it("captures GET /api/config/brand/values with the gate keys AND the brand's four consolidation defaults (legacy showBasicRuleFields / effectiveBaseRule)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      "/api/config/brand/values?keys=invoices.consolidation.restrict_to_staff,billing.payment_currencies.enable_different_currency_payment,invoices.consolidation.enabled,invoices.consolidation.base_rule,invoices.consolidation.base_rule_day_of_week,invoices.consolidation.base_rule_date_of_month_day"
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `Six-key brand-gates capture returned ${status} — the schedule ` +
          "show/hide rules have no real brand-defaults fixture to replay."
      );
    }
  });

  it("captures GET /api/brand/settings (AC24 — a real currencies array)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get("/api/brand/settings");
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `brand/settings capture returned ${status} — AC24 has no real ` +
          "currency-options fixture to replay."
      );
    }
  });

  it("captures PUT /api/accounts/{accountId}?case=currency-set (AC22 — currency_id alone)", async () => {
    if (!accountBaseline || !altCurrencyId) {
      throw new Error("No account baseline/altCurrencyId — see beforeAll.");
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/accounts/${accountBaseline.id}?case=currency-set`,
      { currency_id: altCurrencyId }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`currency-set capture returned ${status}.`);
    }
  });

  /**
   * `preferred_payment_currency_id` set to a non-null value is REJECTED by
   * the real API on this staging brand with a genuine `409` — "Payments in
   * different than the document (invoice) currencies are disabled!" — because
   * `billing.payment_currencies.enable_different_currency_payment` is
   * genuinely `false` here (confirmed by the two-key capture above). This is
   * the backend's OWN enforcement of row B6's gate, not a fixture artefact.
   * Recording it honestly (as a real `409`) is correct; presenting it as a
   * `200` would be fabrication. The SUCCESS shape AC21/AC22/AC26 need for the
   * "preference is set" case cannot be recorded on this brand without an
   * admin enabling that brand-wide setting — a cross-cutting change no
   * prover run makes unilaterally. Per `design.md` §15.10's own anticipated
   * risk and `tasks.md` T24 action 4, that state is instead DERIVED — a
   * single-field override of this exact `currency-set` success envelope's
   * shape, declared as a derivation at its point of use in
   * `client-billing-settings.int-helpers.ts`, never dressed up as a capture.
   */
  it("captures PUT /api/accounts/{accountId}?case=preferred-set (AC21 — the REAL 409 this brand's closed B6 gate returns)", async () => {
    if (!accountBaseline || !altPreferredCurrencyId) {
      throw new Error(
        "No account baseline/altPreferredCurrencyId — see beforeAll."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/accounts/${accountBaseline.id}?case=preferred-set`,
      { preferred_payment_currency_id: altPreferredCurrencyId }
    );
    generator.clearBearerToken();
    if (status !== 409) {
      throw new Error(
        `preferred-set capture returned ${status}, expected the KNOWN real ` +
          "409 (brand gate closed) — if this brand's config changed and a " +
          "200 is now possible, replace this derivation-based case with a " +
          "genuine recorded success and update the int-helpers docstring."
      );
    }
  });

  it("captures PUT /api/accounts/{accountId}?case=preferred-clear (AC21 — the explicit null clear)", async () => {
    if (!accountBaseline) {
      throw new Error("No account baseline — see beforeAll.");
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/accounts/${accountBaseline.id}?case=preferred-clear`,
      { preferred_payment_currency_id: null }
    );
    generator.clearBearerToken();
    if (status >= 400) {
      throw new Error(`preferred-clear capture returned ${status}.`);
    }
  });

  /**
   * The joint write is REJECTED for the SAME reason as `case-preferred-set`
   * above — the non-null `preferred_payment_currency_id` leaf alone trips
   * the real, server-side B6 gate on this brand, regardless of what
   * `currency_id` carries in the same body. Recorded honestly as the real
   * `409`; AC22's "both keys in one request" success shape is DERIVED from
   * `case-currency-set`'s genuine success envelope (see int-helpers).
   */
  it("captures PUT /api/accounts/{accountId}?case=both (AC22 — the REAL 409 this brand's closed B6 gate returns)", async () => {
    if (!accountBaseline || !altCurrencyId || !altPreferredCurrencyId) {
      throw new Error("No account baseline/alt currency ids — see beforeAll.");
    }
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.put(
      `/api/accounts/${accountBaseline.id}?case=both`,
      {
        currency_id: altCurrencyId,
        preferred_payment_currency_id: altPreferredCurrencyId
      }
    );
    generator.clearBearerToken();
    if (status !== 409) {
      throw new Error(
        `both capture returned ${status}, expected the KNOWN real 409 ` +
          "(brand gate closed) — if this brand's config changed and a 200 " +
          "is now possible, replace this derivation-based case with a " +
          "genuine recorded success and update the int-helpers docstring."
      );
    }
  });

  it("captures PUT /api/accounts/{accountId}?case=restore (staging hygiene — restores the account's own baseline)", async () => {
    if (!accountBaseline) {
      throw new Error(
        "No account baseline captured — cannot record the account restore case."
      );
    }
    generator.setBearerToken(clientToken.access_token);
    await generator.put(`/api/accounts/${accountBaseline.id}?case=restore`, {
      currency_id: accountBaseline.currency_id,
      preferred_payment_currency_id:
        accountBaseline.preferred_payment_currency_id
    });
    generator.clearBearerToken();
  });

  it("captures PUT /api/clients/{id}?case=restore (staging hygiene — restores the account's own baseline)", async () => {
    if (!baseline) {
      throw new Error("No baseline captured — cannot record the restore case.");
    }
    generator.setBearerToken(clientToken.access_token);
    await generator.put(`/api/clients/${clientId}?case=restore`, {
      invoice_consolidation_enabled: baseline.invoice_consolidation_enabled,
      invoice_consolidation_base_rule: baseline.invoice_consolidation_base_rule,
      invoice_consolidation_base_rule_day_of_week:
        baseline.invoice_consolidation_base_rule_day_of_week,
      invoice_consolidation_base_rule_date_of_month_day:
        baseline.invoice_consolidation_base_rule_date_of_month_day,
      invoice_consolidation_due_date_day:
        baseline.invoice_consolidation_due_date_day
    });
    generator.clearBearerToken();
  });
});

// -----------------------------------------------------------------------------
/**
 * @fileoverview client mappers — the one client record read off the wire (unit)
 *
 * ## Job To Be Done
 * `mapClientRecord` is the single place `clients/{id}?with=custom_fields,
 * custom_fields.field` becomes the `ClientRecord` the sibling client modules
 * read their slice from. Prove it carries the identity/profile fields, the
 * invoice-consolidation slice (null where the record follows the brand), the
 * custom-field values verbatim with their nested `field` relation intact, and
 * that it honours the `ClientRecord` contract for nullish input — a
 * `customFieldValues` that is `NonNullable`, and consolidation rules that stay
 * `null` rather than collapsing.
 *
 * The record is read out of a recording captured against staging
 * (`get-clients-id.json`, the `custom_fields,custom_fields.field` read) — no
 * test types a wire body.
 *
 * ## What Breaks If These Fail
 * Every sibling that reads this one record — billing settings, personal
 * details — reads a dropped field, a custom-field bag stripped of its `field`
 * relation, or a brand-follow `null` silently turned into a value.
 */

import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { mapClientRecord } from "..";
import type { IClient } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

type Envelope<T> = { data: T };
type WireClient = {
  id: string;
  brand_id: string;
  firstname: string;
  lastname: string;
  public_name: string;
  interface_language_id: string;
  interface_language_code: string;
  never_suspend: boolean;
  meta: Record<string, unknown>;
  invoice_consolidation_enabled: number;
  invoice_consolidation_base_rule: string | null;
  invoice_consolidation_base_rule_date_of_month_day: number | null;
  invoice_consolidation_base_rule_day_of_week: string | null;
  invoice_consolidation_due_date_day: number | null;
  custom_fields?: unknown[] | null;
  accounts?: WireAccount[] | null;
};

type WireAccount = {
  id: string;
  currency_id: string;
  preferred_payment_currency_id: string | null;
  topup_enabled: boolean;
  currency?: { id: string; code: string };
};

function recordedClient(): WireClient {
  return getFixtureBody<Envelope<WireClient>>("get-clients-id", {
    recordingsDir
  }).data;
}

function recordedClientWithAccounts(): WireClient {
  return getFixtureBody<Envelope<WireClient>>("get-clients-id-case-accounts", {
    recordingsDir
  }).data;
}

const asClient = (row: WireClient): IClient => row as unknown as IClient;

// -----------------------------------------------------------------------------

describe("mapClientRecord — identity and profile off the recorded record", () => {
  it("carries the client's identity and profile fields", () => {
    const row = recordedClient();

    const mapped = mapClientRecord(asClient(row));

    expect(mapped.id).toBe(row.id);
    expect(mapped.brandId).toBe(row.brand_id);
    expect(mapped.firstName).toBe(row.firstname);
    expect(mapped.lastName).toBe(row.lastname);
    expect(mapped.publicName).toBe(row.public_name);
    expect(mapped.language).toBe(row.interface_language_id);
    expect(mapped.interfaceLanguageCode).toBe(row.interface_language_code);
    expect(mapped.neverSuspend).toBe(row.never_suspend);
    expect(mapped.meta).toEqual(row.meta);
  });

  it("leaves excludeDelegatedProducts unset when the UI meta carries no flag", () => {
    const row = recordedClient();
    expect(row.meta).not.toHaveProperty("products-exclude-delegates");

    const mapped = mapClientRecord(asClient(row));

    expect(mapped.excludeDelegatedProducts).toBeUndefined();
  });
});

describe("mapClientRecord — the invoice-consolidation slice", () => {
  it("carries the recorded consolidation values, keeping null where the record follows the brand", () => {
    const row = recordedClient();

    const mapped = mapClientRecord(asClient(row));

    expect(mapped.enabled).toBe(row.invoice_consolidation_enabled);
    expect(mapped.baseRule).toBe(row.invoice_consolidation_base_rule);
    expect(mapped.dateOfMonthDay).toBe(
      row.invoice_consolidation_base_rule_date_of_month_day
    );
    expect(mapped.dayOfWeek).toBeNull();
    expect(mapped.dueDateDay).toBeNull();
  });

  it("keeps a null base rule as null (follow the brand)", () => {
    const mapped = mapClientRecord(
      asClient({ ...recordedClient(), invoice_consolidation_base_rule: null })
    );

    expect(mapped.baseRule).toBeNull();
  });
});

describe("mapClientRecord — custom-field values", () => {
  it("maps the custom-field values verbatim, nested field relation intact", () => {
    const row = recordedClient();
    expect(row.custom_fields).toHaveLength(3);

    const mapped = mapClientRecord(asClient(row));

    expect(mapped.customFieldValues).toEqual(row.custom_fields);
  });

  it("defaults customFieldValues to a non-null array when the record has none", () => {
    for (const absent of [undefined, null] as const) {
      const mapped = mapClientRecord(
        asClient({ ...recordedClient(), custom_fields: absent })
      );

      expect(Array.isArray(mapped.customFieldValues)).toBe(true);
      expect(mapped.customFieldValues).toHaveLength(0);
    }
  });
});

describe("mapClientRecord — the primary account", () => {
  it("maps the first recorded account, carrying its loaded currency relation", () => {
    const row = recordedClientWithAccounts();
    const account = row.accounts?.[0];
    expect(account?.currency?.code).toBeTruthy();

    const mapped = mapClientRecord(asClient(row));

    expect(mapped.account).not.toBeNull();
    expect(mapped.account?.id).toBe(account?.id);
    expect(mapped.account?.currencyId).toBe(account?.currency_id);
    expect(mapped.account?.preferredPaymentCurrencyId).toBe(
      account?.preferred_payment_currency_id
    );
    expect(mapped.account?.currency?.code).toBe(account?.currency?.code);
  });

  it("maps account to null when the record carries no accounts", () => {
    for (const absent of [undefined, null] as const) {
      const mapped = mapClientRecord(
        asClient({ ...recordedClientWithAccounts(), accounts: absent })
      );

      expect(mapped.account).toBeNull();
    }
  });
});

import { describe, expect, it } from "vitest";
import { mapBillingSettings } from "../client-billing-settings.mappers";
import { useSchema } from "../client-billing-settings.schemas";
import { useValidation } from "../../../utils/useValidation";
import type { BillingSettingsContext } from "../client-billing-settings.types";
import type { IClient } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module client-billing-settings/__tests__/client-billing-settings.empty-string-unset
 * @description Regression control for the wire's SECOND spelling of "unset".
 *
 * Observed LIVE 2026-09-11 (MinistryOfPhotography, acting as self, the
 * `useBillingSettingsManager` playground page): the client record came back
 * with `invoice_consolidation_base_rule_day_of_week: ""`. Carried verbatim,
 * that `""` is restored by `restoreCompactedFields` after `useModelParser`
 * compacts it, reaches `validate` on the machine's own LOAD path, and is
 * rejected by `dayOfWeek`'s enum — the editor lands in `invalid` and the form
 * never renders.
 *
 * These are PURE mapper + schema assertions over a synthetic `IClient`. They
 * are NOT a recorded contract and must never be read as one: the only
 * recorded claim here is the `""` value above, which the live console
 * surfaced. `BillingSettingsRecord` types both string fields `<enum> | null`,
 * so `""` is off-contract for this module whatever the API's reason for it.
 */

/** Minimal synthetic client — the five consolidation keys and nothing else. */
function rawClient(overrides: Partial<IClient> = {}): IClient {
  return {
    id: "client-under-test",
    staged_import: false,
    invoice_consolidation_enabled: 1,
    invoice_consolidation_base_rule: "daily",
    invoice_consolidation_base_rule_day_of_week: null,
    invoice_consolidation_base_rule_date_of_month_day: null,
    invoice_consolidation_due_date_day: null,
    ...overrides
  } as unknown as IClient;
}

describe("client-billing-settings — the wire's empty-string unset", () => {
  it("maps an empty-string day of week to null, never to the empty string", () => {
    const record = mapBillingSettings(
      rawClient({
        invoice_consolidation_base_rule_day_of_week: "" as never
      })
    );

    expect(record.dayOfWeek).toBeNull();
  });

  it("maps an empty-string base rule to null, never to the empty string", () => {
    const record = mapBillingSettings(
      rawClient({ invoice_consolidation_base_rule: "" as never })
    );

    expect(record.baseRule).toBeNull();
  });

  it("leaves a real enum member untouched", () => {
    const record = mapBillingSettings(
      rawClient({
        invoice_consolidation_base_rule: "day_of_week" as never,
        invoice_consolidation_base_rule_day_of_week: "monday" as never
      })
    );

    expect(record.baseRule).toBe("day_of_week");
    expect(record.dayOfWeek).toBe("monday");
  });

  it("leaves a real null untouched", () => {
    const record = mapBillingSettings(rawClient());

    expect(record.baseRule).toBe("daily");
    expect(record.dayOfWeek).toBeNull();
  });

  /**
   * The end-to-end statement of the defect: the mapped record must survive
   * the SAME schema `validate` runs on the machine's load path. Without the
   * mapper's coercion this assertion goes RED with
   * `/dayOfWeek must be equal to one of the allowed values` — the exact
   * error the live page showed.
   */
  it("produces a record the editor's own schema accepts", () => {
    const record = mapBillingSettings(
      rawClient({
        invoice_consolidation_base_rule: "" as never,
        invoice_consolidation_base_rule_day_of_week: "" as never
      })
    );

    const { validate } = useValidation();
    const errors = validate(useSchema({} as BillingSettingsContext), {
      enabled: record.enabled,
      baseRule: record.baseRule,
      dayOfWeek: record.dayOfWeek,
      dateOfMonthDay: record.dateOfMonthDay,
      dueDateDay: record.dueDateDay
    });

    expect(errors).toEqual([]);
  });
});

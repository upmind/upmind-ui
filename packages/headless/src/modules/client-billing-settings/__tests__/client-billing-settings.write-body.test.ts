// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings write body — the diff-only PUT clients/{id}
 * mapper (unit)
 *
 * ## Job To Be Done
 * Pin the three wire-body facts the editor's save depends on, none of which is a
 * driveable capability (ADR 035 Amendment 1 — an outbound-body shape and a
 * request-count are not scenarios). All three are pure `mapIBillingSettingsFields`
 * facts, asserted over the model/baseline pair the diff reads:
 *   - turning consolidation off writes the off value EXPLICITLY, never omitting
 *     the key (was AC-18) — the wire's difference between "set to off" and
 *     "unchanged";
 *   - only the fields that actually changed are written (was AC-12) — a genuine
 *     diff, not the whole model;
 *   - a no-op save (model equals its baseline) yields nothing to send (was
 *     AC-11) — the empty diff behind "makes no request".
 *
 * ## What Breaks If These Fail
 * Turning consolidation off silently no-ops because the key was omitted, an
 * unchanged field clobbers a concurrent writer on the shared PUT clients/{id},
 * or a no-op save fires a needless request.
 */

import { describe, expect, it } from "vitest";
import {
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import { mapIBillingSettingsFields } from "../client-billing-settings.mappers";
import type { BillingSettingsModel } from "../client-billing-settings.types";

// -----------------------------------------------------------------------------

describe("client-billing-settings write body — explicit off", () => {
  it("writes the off value explicitly when consolidation is turned off, never omitting it", () => {
    const baseModel: BillingSettingsModel = {
      enabled: InvoiceConsolidationTypes.ENABLED
    };
    const model: BillingSettingsModel = {
      enabled: InvoiceConsolidationTypes.DISABLED
    };

    const diff = mapIBillingSettingsFields(model, baseModel) ?? {};

    expect(diff).toHaveProperty("invoice_consolidation_enabled");
    expect(diff.invoice_consolidation_enabled).toBe(
      InvoiceConsolidationTypes.DISABLED
    );
  });
});

describe("client-billing-settings write body — diff only", () => {
  it("writes only the field that actually changed, leaving the unchanged ones out", () => {
    const baseModel: BillingSettingsModel = {
      enabled: InvoiceConsolidationTypes.ENABLED,
      baseRule: InvoiceConsolidationRuleTypes.DAILY
    };
    const model: BillingSettingsModel = {
      enabled: InvoiceConsolidationTypes.ENABLED,
      baseRule: InvoiceConsolidationRuleTypes.DAY_OF_WEEK
    };

    const diff = mapIBillingSettingsFields(model, baseModel) ?? {};

    expect(Object.keys(diff)).toEqual(["invoice_consolidation_base_rule"]);
    expect(diff.invoice_consolidation_base_rule).toBe(
      InvoiceConsolidationRuleTypes.DAY_OF_WEEK
    );
  });
});

describe("client-billing-settings write body — no-op save", () => {
  it("yields an empty diff when nothing changed against the baseline", () => {
    const model: BillingSettingsModel = {
      enabled: InvoiceConsolidationTypes.ENABLED,
      baseRule: InvoiceConsolidationRuleTypes.DAY_OF_WEEK
    };

    const diff = mapIBillingSettingsFields(model, { ...model });

    expect(Object.keys(diff ?? {})).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings vs client-personal-details —
 * disjoint `PUT clients/{id}` writers (parity row X1, T13)
 *
 * ## Job To Be Done
 * Pin the residual risk parity row X1 files openly: this module's per-field
 * diff makes it safe for two modules to both `PUT clients/{id}` on the same
 * record ONLY while their RUNTIME-EMITTED key sets stay disjoint. This test
 * drives BOTH mappers with every model field populated against an EMPTY
 * baseline (so every diff branch fires) and asserts the two emitted key sets
 * never intersect — never a restated literal key list, which would be a
 * tautology that survives the exact regression this control exists to catch.
 *
 * ## What Breaks If These Fail
 * A future field added to either mapper silently clobbers the other
 * module's write the next time both save in close succession — the shared
 * `PUT clients/{id}` endpoint has no server-side merge guarantee across two
 * independent headless writers.
 */

import { describe, expect, it } from "vitest";
import { mapIBillingSettingsFields } from "../client-billing-settings.mappers";
import { mapIProfileFields } from "../../client-personal-details/client-personal-details.mappers";
import {
  DaysOfWeekTypes,
  InvoiceConsolidationRuleTypes,
  InvoiceConsolidationTypes
} from "@upmind-automation/types";
import type { BillingSettingsModel } from "../client-billing-settings.types";

// -----------------------------------------------------------------------------

/**
 * Every field this module's editor can carry, populated — including the two
 * account-currency leaves folded in 2026-09-09 — so a diff against an empty
 * baseline fires EVERY branch `mapIBillingSettingsFields` owns. `client-
 * billing-settings.types.ts:162-163` types `BillingSettingsUpdateBody` as a
 * `Pick` over five `IClient` keys only, so if the two account leaves below
 * ever leaked into the `PUT clients/{id}` body, this test's completeness
 * assertion (`|A| === 5`) would catch it — not the intersection assertion.
 */
const fullBillingModel: BillingSettingsModel = {
  enabled: InvoiceConsolidationTypes.ENABLED,
  baseRule: InvoiceConsolidationRuleTypes.DAILY,
  dayOfWeek: DaysOfWeekTypes.MONDAY,
  dateOfMonthDay: 15,
  dueDateDay: 7,
  currencyId: "11111111-1111-1111-1111-111111111111",
  preferredPaymentCurrencyId: "22222222-2222-2222-2222-222222222222"
};

/**
 * Every profile-identity field the sibling `client-personal-details` writer
 * carries (`requirements.md` / `tasks.md` T13, `client-personal-details.
 * mappers.ts:256-281`), populated against an empty baseline. Loosely typed —
 * this module is diff-blind to `client-personal-details`'s own model shape
 * (`ProfileModel`) by design (`agent-seat-separation.companion.md`); the
 * literal field NAMES are the plan's own contract (`tasks.md` T13's table),
 * not learned from that module's implementation.
 */
const fullProfileModel = {
  firstname: "Test",
  lastname: "Writer",
  public_name: "Test Writer",
  interface_language_id: "33333333-3333-3333-3333-333333333333",
  document_language_id: "44444444-4444-4444-4444-444444444444",
  custom_fields: [{ id: "55555555-5555-5555-5555-555555555555", value: "x" }]
} as never;

// -----------------------------------------------------------------------------

describe("client-billing-settings vs client-personal-details — disjoint PUT clients/{id} writers (row X1)", () => {
  it("emits key sets that never intersect, and this module's set is complete", () => {
    const setA = new Set(
      Object.keys(mapIBillingSettingsFields(fullBillingModel, {}) ?? {})
    );
    const setB = new Set(
      Object.keys(mapIProfileFields(fullProfileModel, {}) ?? {})
    );

    const overlap = [...setA].filter(key => setB.has(key));

    expect(
      overlap,
      overlap.length > 0
        ? `client-billing-settings and client-personal-details both emit ` +
            `${overlap.join(", ")} on PUT clients/{id} — parity row X1's ` +
            "disjoint-writer safety no longer holds."
        : undefined
    ).toEqual([]);

    // A shrinking Set A (a silently dropped mapper branch) must not let the
    // intersection check pass vacuously — five consolidation keys, and only
    // those five: the two account-currency leaves above must NOT appear.
    expect(setA.size).toBe(5);
  });
});

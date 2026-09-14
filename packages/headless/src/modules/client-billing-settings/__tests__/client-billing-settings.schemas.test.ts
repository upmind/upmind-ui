// -----------------------------------------------------------------------------
/**
 * @fileoverview client-billing-settings schemas — legacy parity of the
 * editor's pick-lists and show/hide rules
 *
 * ## Job To Be Done
 * Pin that the schema/uischema reproduce `clientInvoiceConsolidationForm.vue`:
 * the two `enabled` positions in legacy's order with legacy's strings and the
 * brand's position tagged "Default"; INHERIT still a valid member; and the
 * schedule / day-of-week / day-of-month / due-date visibility evaluated by
 * JSON Forms itself (`evalVisibility`) over the SAME data combinations
 * legacy's `showBasicRuleFields` / `showDayOfWeekField` /
 * `showDayOfMonthField` / `showDueDateDayField` decide on.
 *
 * ## What Breaks If These Fail
 * A control shows for a client legacy hides it from (or hides one legacy
 * shows), or the toggle loses its "follow the brand" member — the parity the
 * module is held to.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createAjv, evalVisibility } from "@jsonforms/core";
import { describe, expect, it } from "vitest";
import {
  DaysOfWeekTypes,
  InvoiceConsolidationRuleTypes as ICRT,
  InvoiceConsolidationTypes as ICT
} from "@upmind-automation/types";
import {
  useSchema,
  useUischema,
  useUischemaDefinitions
} from "../client-billing-settings.schemas";
import { find, map, values } from "lodash-es";
import type {
  BillingSettingsContext,
  BillingSettingsModel
} from "../client-billing-settings.types";
import type { Layout, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const ajv = createAjv();

function context(baseModel: BillingSettingsModel = {}): BillingSettingsContext {
  return { baseModel, model: baseModel, lookups: {} } as BillingSettingsContext;
}

/** The schedule layout — the second element, wrapping the four rule controls. */
function scheduleLayout(): UISchemaElement {
  return (useUischema(context()) as Layout).elements[1]!;
}

function visible(
  element: UISchemaElement,
  data: BillingSettingsModel
): boolean {
  return evalVisibility(element, data, undefined, ajv);
}

// -----------------------------------------------------------------------------

describe("client-billing-settings schemas — the `enabled` segmented control", () => {
  it("draws legacy's two positions first, then Default, with legacy's strings", () => {
    const { enabled } = useSchema(context()).definitions!;
    expect(map(enabled.options, "value")).toEqual([
      ICT.ENABLED,
      ICT.DISABLED,
      ICT.INHERIT
    ]);
    expect(map(enabled.options, "label")).toEqual([
      "Consolidate invoices",
      "Do NOT consolidate invoices",
      "Inherit from brand"
    ]);
  });

  it("keeps INHERIT a valid member and the value an un-press lands on", () => {
    const { enabled } = useSchema(context()).definitions!;
    expect(enabled.enum).toContain(ICT.INHERIT);
    expect(useUischemaDefinitions().enabled.options?.format).toBe(
      "button-group"
    );
    expect(useUischemaDefinitions().enabled.options?.defaultOptionValue).toBe(
      ICT.INHERIT
    );
  });

  it("decorates no segment — the labels carry the whole meaning", () => {
    const { enabled } = useSchema(
      context({ brand: { enabled: true } })
    ).definitions!;
    expect(find(enabled.options, "text")).toBeUndefined();
  });
});

describe("client-billing-settings schemas — legacy showBasicRuleFields", () => {
  it("shows the schedule for ENABLED, hides it for DISABLED", () => {
    expect(visible(scheduleLayout(), { enabled: ICT.ENABLED })).toBe(true);
    expect(visible(scheduleLayout(), { enabled: ICT.DISABLED })).toBe(false);
  });

  it("under INHERIT follows the brand: shown only while the brand consolidates", () => {
    expect(
      visible(scheduleLayout(), {
        enabled: ICT.INHERIT,
        brand: { enabled: true }
      })
    ).toBe(true);
    expect(
      visible(scheduleLayout(), {
        enabled: ICT.INHERIT,
        brand: { enabled: false }
      })
    ).toBe(false);
    expect(visible(scheduleLayout(), { enabled: ICT.INHERIT })).toBe(false);
  });
});

describe("client-billing-settings schemas — legacy showDayOfWeekField / showDayOfMonthField", () => {
  const { dayOfWeek, dateOfMonthDay } = useUischemaDefinitions();

  it("names the sub-control from the client's own rule", () => {
    expect(visible(dayOfWeek, { baseRule: ICRT.DAY_OF_WEEK })).toBe(true);
    expect(visible(dayOfWeek, { baseRule: ICRT.DAILY })).toBe(false);
    expect(visible(dateOfMonthDay, { baseRule: ICRT.DAY_OF_MONTH })).toBe(true);
    expect(visible(dateOfMonthDay, { baseRule: ICRT.DAY_OF_WEEK })).toBe(false);
  });

  it("falls back to the brand's rule while the client's is unset — null or absent", () => {
    const brandWeekly = {
      baseRule: ICRT.DAY_OF_WEEK,
      dayOfWeek: DaysOfWeekTypes.MONDAY
    };
    expect(visible(dayOfWeek, { baseRule: null, brand: brandWeekly })).toBe(
      true
    );
    expect(visible(dayOfWeek, { brand: brandWeekly })).toBe(true);
    expect(
      visible(dayOfWeek, { baseRule: null, brand: { baseRule: ICRT.DAILY } })
    ).toBe(false);
    // A client rule of its own beats the brand's.
    expect(
      visible(dayOfWeek, { baseRule: ICRT.DAILY, brand: brandWeekly })
    ).toBe(false);
  });
});

describe("client-billing-settings schemas — legacy showDueDateDayField", () => {
  const { dueDateDay } = useUischemaDefinitions();

  it("needs a monthly effective rule AND the client's never_suspend", () => {
    for (const rule of [
      ICRT.FIRST_DAY_OF_MONTH,
      ICRT.LAST_DAY_OF_MONTH,
      ICRT.DAY_OF_MONTH
    ]) {
      expect(visible(dueDateDay, { baseRule: rule, neverSuspend: true })).toBe(
        true
      );
      expect(visible(dueDateDay, { baseRule: rule, neverSuspend: false })).toBe(
        false
      );
      expect(visible(dueDateDay, { baseRule: rule })).toBe(false);
    }
    expect(
      visible(dueDateDay, { baseRule: ICRT.DAILY, neverSuspend: true })
    ).toBe(false);
    expect(
      visible(dueDateDay, { baseRule: ICRT.DAY_OF_WEEK, neverSuspend: true })
    ).toBe(false);
  });

  it("reads the monthly rule off the brand while the client's is unset", () => {
    expect(
      visible(dueDateDay, {
        baseRule: null,
        brand: { baseRule: ICRT.LAST_DAY_OF_MONTH },
        neverSuspend: true
      })
    ).toBe(true);
  });
});

describe("client-billing-settings schemas — every control's i18n key resolves in the catalogue labs loads", () => {
  // The EN catalogue `labs-nuxt` aliases `@upmind-automation/i18n` to
  // (`packages/i18n/src/core`), the same home `client-notes.i18n-keys.int`
  // pins — a key missing there renders as its raw name on the page.
  const catalogue = JSON.parse(
    readFileSync(
      join(
        import.meta.dirname,
        "../../../../../../packages/i18n/src/core/form-en.json"
      ),
      "utf-8"
    )
  ) as Record<string, { label?: string | null }>;

  it("labels every control — legacy's own strings, none left as a raw key", () => {
    for (const control of values(useUischemaDefinitions())) {
      const key = control.i18n!.replace(/^form\./, "");
      expect(catalogue[key]?.label, control.i18n).toBeTruthy();
    }
  });
});

// -----------------------------------------------------------------------------
/**
 * @module tests/billing-settings-form
 * @description Gap doc §3 "Billing settings (stub)": the page that only ever
 * announced itself now carries legacy's two forms as one — the currency a
 * client is quoted in, the currency they pay in, the list they buy from, and
 * whether their invoices are consolidated (plan §3, F4). Two of those controls
 * are CONTEXT-conditional rather than rule-conditional: a brand that offers no
 * payment currency and a client with one price list have nothing to choose, so
 * the schema itself must not offer them. The consolidation schedule is the
 * other way round — the fields ride on the model and the uischema's own rules
 * decide when they are asked for, which is what legacy's form did.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { InvoiceConsolidationRuleTypes } from "@upmind-automation/types";
import { boundRefId, stringsIn } from "./support/page-config";
import { assign, filter, find, get, keys, map } from "lodash-es";
import type { ConfigNode } from "./support/page-config";
import type { MockDataset } from "~/portal/mock/types";
import { billingPages } from "~/portal/config/billing-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction
} from "~/portal/mock/actions";
import * as billingSchemas from "~/portal/mock/contracts/client-billing-settings.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { billingSettingsFormContext } from "~/portal/mock/forms/billing-contexts";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT = {};

/** The scopes whose control the consolidation choice governs, and what governs each. */
const SCHEDULE_SCOPE = {
  rule: "#/properties/rule",
  dayOfWeek: "#/properties/dayOfWeek",
  dayOfMonth: "#/properties/dayOfMonth",
  dueDateDay: "#/properties/dueDateDay"
} as const;

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

/** The dataset carrying the payment-currency gate on its OFF branch, and one price list. */
function minimal(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
}

function settingsPage(): unknown {
  return billingPages()[PAGE_KEY.BILLING_SETTINGS];
}

/** Every module slot the page authors, whatever row it hangs in. */
function modules(page: unknown): ConfigNode[] {
  const rows = get(page, "rows");
  if (!Array.isArray(rows)) throw new Error("the settings page has no rows");
  return rows.flatMap(row => {
    const slots = get(row, "slots");
    return Array.isArray(slots) ? (slots as ConfigNode[]) : [];
  });
}

function formProps(page: unknown): ConfigNode {
  const props = get(modules(page)[0], "props");
  if (typeof props !== "object" || props === null) {
    throw new Error("the settings page binds no form");
  }
  return props as ConfigNode;
}

function ref<T>(data: MockDataset, id: keyof typeof DATA_REF_ID): T {
  return resolveDataRefProps({ value: dataRef(DATA_REF_ID[id]) }, data)
    ?.value as T;
}

function schemaFor(data: MockDataset) {
  return billingSchemas.useSchema(billingSettingsFormContext(data));
}

function controlAt(data: MockDataset, scope: string) {
  return find(
    billingSchemas.useUischema(billingSettingsFormContext(data)).elements,
    { scope }
  );
}

function payload(model: unknown): string {
  return `${MOCK_ACTION.BILLING_SETTINGS_SAVE}:${JSON.stringify(model)}`;
}

describe("the settings page is the form now, and nothing else", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("binds one form row to its own verb, with no stub left beside it", () => {
    const page = settingsPage();
    const props = formProps(page);

    expect(map(modules(page), "id")).toEqual(["form"]);
    expect(props.submit).toBe(MOCK_ACTION.BILLING_SETTINGS_SAVE);
    expect(boundRefId(props, "schema")).toBe(
      DATA_REF_ID.BILLING_SETTINGS_FORM_SCHEMA
    );
    expect(boundRefId(props, "uischema")).toBe(
      DATA_REF_ID.BILLING_SETTINGS_FORM_UISCHEMA
    );
    expect(boundRefId(props, "model")).toBe(
      DATA_REF_ID.BILLING_SETTINGS_FORM_MODEL
    );
    expect(props.submitLabel).toBeTruthy();
    expect(
      filter(stringsIn(page), value =>
        /coming soon|not yet|placeholder/i.test(value)
      )
    ).toEqual([]);
  });

  it("opens on the preferences on file, in the schema module's own spelling", () => {
    const data = hostgrid();
    const model = ref<Record<string, unknown>>(
      data,
      "BILLING_SETTINGS_FORM_MODEL"
    );
    const settings = data.billingSettings;

    expect(model).toEqual(
      billingSchemas.billingSettingsDefaults(billingSettingsFormContext(data))
    );
    expect(model.currencyCode).toBe(settings.currency);
    expect(model.paymentCurrencyCode).toBe(settings.paymentCurrency);
    expect(model.priceListId).toBe(settings.priceListId);
    expect(model.consolidation).toBe(settings.consolidation);
    expect(model.rule).toBe(settings.rule);
    expect(model.dayOfWeek).toBe(settings.dayOfWeek);
    expect(model.dueDateDay).toBe(settings.dueDateDay);
  });

  it("hands the module the schema and uischema the refs resolve to", () => {
    const data = hostgrid();

    expect(ref(data, "BILLING_SETTINGS_FORM_SCHEMA")).toEqual(schemaFor(data));
    expect(ref(data, "BILLING_SETTINGS_FORM_UISCHEMA")).toEqual(
      billingSchemas.useUischema(billingSettingsFormContext(data))
    );
  });
});

describe("two controls are offered only where there is a choice to make", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("the payment currency follows the brand's own gate, both ways", () => {
    const on = hostgrid();
    const off = minimal();

    expect(on.features.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED).toBe(true);
    expect(off.features.BILLING_DIFFERENT_CURRENCY_PAYMENT_ENABLED).toBe(false);
    expect(get(schemaFor(on), "properties.paymentCurrencyCode")).toBeDefined();
    expect(controlAt(on, "#/properties/paymentCurrencyCode")).toBeDefined();
    expect(
      get(schemaFor(off), "properties.paymentCurrencyCode")
    ).toBeUndefined();
    expect(controlAt(off, "#/properties/paymentCurrencyCode")).toBeUndefined();
  });

  it("the price list is never offered to a client, however many the brand publishes", () => {
    // Legacy lets only staff pick the list a client is quoted from.
    const many = hostgrid();
    expect(many.priceLists.length).toBeGreaterThan(1);
    expect(get(schemaFor(many), "properties.priceListId")).toBeUndefined();
    expect(controlAt(many, "#/properties/priceListId")).toBeUndefined();
  });
});

describe("the consolidation schedule is asked for only while it applies", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("every schedule control hangs off the consolidated state itself", () => {
    const data = hostgrid();

    for (const scope of Object.values(SCHEDULE_SCOPE)) {
      const rule = get(controlAt(data, scope), "rule");
      expect(get(rule, "effect")).toBe("SHOW");
      expect(JSON.stringify(get(rule, "condition"))).toContain(
        "#/properties/consolidation"
      );
    }
  });

  it("the day fields wait on the rule that reads them, and nothing else does", () => {
    const data = hostgrid();
    const conditionFor = (scope: string) =>
      get(controlAt(data, scope), "rule.condition");

    for (const [scope, ruleType] of [
      [SCHEDULE_SCOPE.dayOfWeek, InvoiceConsolidationRuleTypes.DAY_OF_WEEK],
      [SCHEDULE_SCOPE.dayOfMonth, InvoiceConsolidationRuleTypes.DAY_OF_MONTH]
    ] as const) {
      const condition = conditionFor(scope);
      const conditions = get(condition, "conditions", []);

      expect(get(condition, "type")).toBe("AND");
      expect(map(conditions, "scope")).toEqual([
        "#/properties/consolidation",
        "#/properties/rule"
      ]);
      expect(get(conditions[1], "schema.enum")).toEqual([ruleType]);
    }

    for (const scope of [SCHEDULE_SCOPE.rule, SCHEDULE_SCOPE.dueDateDay]) {
      expect(get(conditionFor(scope), "scope")).toBe(
        "#/properties/consolidation"
      );
      expect(get(conditionFor(scope), "conditions")).toBeUndefined();
    }
  });

  it("the schema bounds what each schedule field may say", () => {
    const validate = usePortalAjv().compile(schemaFor(hostgrid()));

    expect(
      validate({
        currencyCode: "GBP",
        consolidation: 1,
        rule: InvoiceConsolidationRuleTypes.DAY_OF_WEEK,
        dayOfWeek: "monday",
        dueDateDay: 14
      })
    ).toBe(true);
    expect(validate({ currencyCode: "GBP", consolidation: 0 })).toBe(true);
    expect(
      validate({
        currencyCode: "GBP",
        consolidation: 1,
        rule: InvoiceConsolidationRuleTypes.DAY_OF_MONTH,
        dayOfMonth: 45
      })
    ).toBe(false);
    expect(
      validate({ currencyCode: "GBP", consolidation: 1, rule: "fortnightly" })
    ).toBe(false);
    expect(validate({ consolidation: 0 })).toBe(false);
    expect(validate({ currencyCode: "XXX", consolidation: 0 })).toBe(false);
  });
});

describe("saving writes the whole page in one go", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("moves every preference the client changed, and says so", () => {
    const data = hostgrid();
    const target = find(
      data.priceLists,
      list => list.id !== data.billingSettings.priceListId
    );

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      payload({
        currencyCode: "USD",
        paymentCurrencyCode: "GBP",
        priceListId: target?.id,
        consolidation: 1,
        rule: InvoiceConsolidationRuleTypes.DAY_OF_MONTH,
        dayOfMonth: 3,
        dueDateDay: 7
      })
    );

    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(data.billingSettings).toEqual({
      currency: "USD",
      paymentCurrency: "GBP",
      priceListId: target?.id,
      consolidation: 1,
      rule: InvoiceConsolidationRuleTypes.DAY_OF_MONTH,
      dayOfMonth: 3,
      dueDateDay: 7
    });
    expect(get(ref(data, "BILLING_SETTINGS_FORM_MODEL"), "currencyCode")).toBe(
      "USD"
    );
  });

  it("clears the schedule the moment consolidation is turned off", () => {
    const data = hostgrid();

    expect(data.billingSettings.rule).toBeDefined();
    dispatchMockAction(
      data,
      NO_CONTEXT,
      payload({
        currencyCode: data.billingSettings.currency,
        consolidation: 0,
        rule: InvoiceConsolidationRuleTypes.DAY_OF_WEEK,
        dayOfWeek: "monday",
        dayOfMonth: 3,
        dueDateDay: 7
      })
    );

    expect(data.billingSettings.consolidation).toBe(0);
    for (const key of keys(SCHEDULE_SCOPE)) {
      expect(get(data.billingSettings, key)).toBeUndefined();
      expect(
        get(ref(data, "BILLING_SETTINGS_FORM_MODEL"), key)
      ).toBeUndefined();
    }
  });

  it("a half-typed payload is not a write", () => {
    const data = hostgrid();
    const before = assign({}, data.billingSettings);

    expect(
      dispatchMockAction(
        data,
        NO_CONTEXT,
        `${MOCK_ACTION.BILLING_SETTINGS_SAVE}:{"currencyCode":`
      )
    ).toBeUndefined();
    expect(data.billingSettings).toEqual(before);
  });
});

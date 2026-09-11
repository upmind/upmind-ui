import { describe, expect, it } from "vitest";
import {
  InvoiceConsolidationRuleTypes,
  InvoiceStatus
} from "@upmind-automation/types";
import { filter, find, map } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import { MOCK_ACTION, dispatchMockAction } from "~/portal/mock/actions";
import { useSchema } from "~/portal/mock/contracts/client-billing-settings.schemas";
import { consolidatableInvoices } from "~/portal/mock/facades/useMockInvoice";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { billingSettingsFormContext } from "~/portal/mock/forms/billing-contexts";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";

/** Legacy's billing screens, graded on vue-app 1.74.0 — the rows `docs/legacy-parity-billing.md` sends here. */

function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

function confirmWith(data: MockDataset, invoiceIds: readonly string[]) {
  return dispatchMockAction(
    data,
    {},
    `${MOCK_ACTION.CONSOLIDATE_INVOICES_CONFIRMED}:${JSON.stringify({ invoiceIds })}`
  );
}

describe("consolidation asks which invoices to bring together", () => {
  it("opens the picker rather than a yes/no", () => {
    const result = dispatchMockAction(
      clone(),
      {},
      MOCK_ACTION.CONSOLIDATE_INVOICES
    );
    expect(result?.form?.id).toBe(FORM_ID.CONSOLIDATE_INVOICES);
    expect(result?.confirm).toBeUndefined();
  });

  it("closes only the ticked invoices into the new document", () => {
    const data = clone();
    const gatherable = consolidatableInvoices(data);
    expect(gatherable.length).toBeGreaterThan(2);
    const [first, second, ...rest] = gatherable;
    if (first === undefined || second === undefined) {
      throw new Error("seed has too few invoices");
    }
    const before = data.invoices.length;
    confirmWith(data, [first.id, second.id]);
    expect(data.invoices.length).toBe(before + 1);
    expect(find(data.invoices, { id: first.id })?.status).toBe(
      InvoiceStatus.CANCELLED
    );
    expect(find(data.invoices, { id: second.id })?.status).toBe(
      InvoiceStatus.CANCELLED
    );
    for (const untouched of rest) {
      expect(find(data.invoices, { id: untouched.id })?.status).toBe(
        untouched.status
      );
    }
  });

  it("refuses a single tick, as legacy's modal does", () => {
    const data = clone();
    const only = consolidatableInvoices(data)[0];
    if (only === undefined) throw new Error("seed has no gatherable invoice");
    const before = data.invoices.length;
    const result = confirmWith(data, [only.id]);
    expect(result?.toast).toBeDefined();
    expect(data.invoices.length).toBe(before);
  });

  it("dates the new document by the client's due day of the month when one is set", () => {
    const data = clone();
    Object.assign(data.billingSettings, { dueDateDay: 28 });
    confirmWith(data, map(consolidatableInvoices(data), "id"));
    const raised = filter(data.invoices, { isConsolidation: true }).at(-1);
    if (raised === undefined) throw new Error("nothing was raised");
    expect(raised.dueDate.slice(-2)).toBe("28");
    expect(raised.dueDate >= raised.issuedDate).toBe(true);
  });
});

describe("the consolidated invoice's due day is a day of the month", () => {
  it("accepts 1 to 28 and refuses the rest", () => {
    const validate = usePortalAjv().compile(
      useSchema(billingSettingsFormContext(clone()))
    );
    const monthly = {
      currencyCode: "GBP",
      consolidation: 1,
      rule: InvoiceConsolidationRuleTypes.DAY_OF_MONTH,
      dayOfMonth: 5
    };
    expect(validate({ ...monthly, dueDateDay: 28 })).toBe(true);
    expect(validate({ ...monthly, dueDateDay: 29 })).toBe(false);
    expect(validate({ ...monthly, dueDateDay: 0 })).toBe(false);
  });
});

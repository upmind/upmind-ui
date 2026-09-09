import { describe, expect, it } from "vitest";
import { find } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import { MOCK_PAGE_LIMIT } from "~/portal/mock/collections";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";

/**
 * Phase E — the billing pillar (plan §5; legacy src/views/client/billing):
 * invoices split by legacy's status tabs with Pay only on unpaid rows, the
 * invoice document keyed off the route's entity, the order detail carrying
 * its own invoices and credit notes, and payment methods guarding the
 * default. Paired blind with tests/billing-pages.must-fail.patch.
 */

function resolveRef(
  dataset: MockDataset,
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID],
  context: Record<string, string> = {}
) {
  return resolveDataRefProps({ value: dataRef(id) }, dataset, context)?.value;
}

describe("invoices — legacy's status tabs, unpaid payable", () => {
  it("All is the default tab, and an unpaid row stays payable inside it", () => {
    const all = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.INVOICE_ITEMS,
      {}
    ) as ListModuleItem[];

    expect(
      resolveRef(HOSTGRID_MOCK_DATASET, DATA_REF_ID.INVOICE_STATUS, {})
    ).toBe("all");
    // The whole ledger, so the first page mixes statuses — and the unpaid
    // rows keep their Pay action rather than depending on which tab shows.
    expect(all).toHaveLength(MOCK_PAGE_LIMIT);
    expect(
      all.some(item => item.action?.value?.startsWith("pay-invoice:"))
    ).toBe(true);

    const tabs = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.INVOICE_TABS,
      {}
    ) as { label: string; action?: string }[];
    expect(tabs.map(tab => tab.label)).toEqual([
      "All",
      "Unpaid",
      "Paid",
      "Credited"
    ]);
    expect(tabs[1]?.action).toBe("navigate:/billing/invoices?status=unpaid");
  });

  it("the invoice document resolves the route's entity — header fields and lines", () => {
    const spec = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.INVOICE_SPEC_ITEMS,
      { entityId: "inv-88" }
    ) as SpecModuleItem[];
    const lines = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.INVOICE_LINE_ITEMS,
      { entityId: "inv-88" }
    ) as ListModuleItem[];

    const byId = new Map(spec.map(item => [item.id, item.value]));
    expect(byId.get("number")).toBe("INV-0088");
    expect(byId.get("total")).toBe("£61.00");
    expect(lines.map(line => line.title)).toEqual([
      "Team Plan",
      "Analytics Add-on"
    ]);
  });
});

describe("orders — the detail carries its own invoices and credit notes", () => {
  it("resolves the order's summary, invoices and linked credit notes", () => {
    const spec = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.ORDER_SPEC_ITEMS,
      {
        entityId: "ord-33"
      }
    ) as SpecModuleItem[];
    const invoices = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.ORDER_INVOICE_ITEMS,
      { entityId: "ord-33" }
    ) as ListModuleItem[];
    const notes = resolveRef(
      HOSTGRID_MOCK_DATASET,
      DATA_REF_ID.ORDER_CREDIT_NOTE_ITEMS,
      { entityId: "ord-31" }
    ) as ListModuleItem[];

    expect(find(spec, { id: "number" })?.value).toBe("ORD-0033");
    expect(invoices.map(item => item.id)).toEqual(["inv-92"]);
    // cn-13 links through INV-0088, which ord-31 raised — legacy's order credit notes
    expect(notes.map(item => item.id)).toEqual(["cn-13"]);
  });
});

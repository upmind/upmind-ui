// -----------------------------------------------------------------------------
/**
 * @module tests/dashboard-panels
 * @description Plan Phase 2, gap doc §1 Dashboard: the overview is a set of
 * doors, not a set of figures. Each stat tile leads to the list it counts, an
 * invoice row carries the same menu the ledger's rows carry, the
 * needs-attention notice offers the one thing to DO about it — setup first,
 * then payment, and nothing at all when neither applies — a client who owns
 * nothing yet is offered the store where the brand has one, and a parent sees
 * the accounts it manages.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  ContractStatusCodes,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { assign, every, filter, find, map, some } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset } from "~/portal/mock/types";
import type { ListModuleItem } from "~/portal/modules/list/types";
import type { MetricModuleItem } from "~/portal/modules/metric/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { dispatchMockAction } from "~/portal/mock/actions";
import {
  DATA_REF_ID,
  dataRef,
  isDataRef,
  resolveDataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { resolve } from "~/portal/resolve";
import { PAGE_KEY } from "~/portal/types";

function resolveRef<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function readValue(node: unknown, key: string): unknown {
  if (node === null || typeof node !== "object") return undefined;
  return Object.entries(node).find(([name]) => name === key)?.[1];
}

/** Every module the page resolves to, wherever it sits — header, slots, aside. */
function collectModules(node: unknown, found: unknown[] = []): unknown[] {
  if (Array.isArray(node)) {
    for (const entry of node) collectModules(entry, found);
    return found;
  }
  if (node === null || typeof node !== "object") return found;
  if (readValue(node, "status") === "module") found.push(node);
  for (const value of Object.values(node)) collectModules(value, found);
  return found;
}

const dashboard = () =>
  resolve(hostgridConfig, { pageKeys: [PAGE_KEY.DASHBOARD] }).content;

/** The dashboard module whose `items` prop names this ref — the panel itself. */
function panelFor(refId: DataRefId): unknown {
  const module = find(collectModules(dashboard()), candidate => {
    const items = readValue(readValue(candidate, "props"), "items");
    return isDataRef(items) && items.id === refId;
  });
  if (module === undefined) throw new Error(`no panel for ${refId}`);
  return module;
}

/** The dashboard row whose presence is gated on this ref. */
function gateOf(refId: DataRefId) {
  const row = find(
    dashboard().rows,
    candidate => isDataRef(candidate.visible) && candidate.visible.id === refId
  );
  if (row === undefined || !isDataRef(row.visible)) {
    throw new Error(`no row gated on ${refId}`);
  }
  return { gate: row.visible, modules: collectModules(row) };
}

function panelProps(refId: DataRefId, data: MockDataset) {
  const props = readValue(panelFor(refId), "props");
  if (props === null || typeof props !== "object") {
    throw new Error(`panel for ${refId} carries no props`);
  }
  return resolveDataRefProps({ ...props }, data, {});
}

describe("dashboard — every tile is a door to the list it counts", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("links the orders, invoices, unpaid-invoices and tickets tiles at their own lists", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    const tiles = resolveRef<MetricModuleItem[]>(
      data,
      DATA_REF_ID.DASHBOARD_METRIC_ITEMS
    );

    expect(map(tiles, "to")).toEqual([
      "/billing/orders",
      "/billing/invoices",
      "/billing/invoices?status=unpaid",
      "/support/tickets"
    ]);
    expect(every(tiles, tile => tile.label !== undefined)).toBe(true);
  });
});

describe("dashboard — the notice offers the one thing to do about it", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("leads with setup while a product is waiting on it", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const waiting = find(data.products, {
      status: ContractStatusCodes.AWAITING_ACTIVATION
    });

    const action = resolveRef<{ value: string; label: string } | undefined>(
      data,
      DATA_REF_ID.NEEDS_ATTENTION_ACTION
    );

    expect(waiting).toBeDefined();
    expect(action?.label).toMatch(/setup/i);
    expect(action?.value).toContain(waiting?.id ?? "no-such-product");
    expect(dispatchMockAction(data, {}, action?.value ?? "")?.to).toBeTruthy();
  });

  it("falls back to the invoices that are owed when nothing is waiting on setup", () => {
    const bare = useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);

    const action = resolveRef<{ value: string; label: string } | undefined>(
      bare,
      DATA_REF_ID.NEEDS_ATTENTION_ACTION
    );

    expect(
      find(bare.products, { status: ContractStatusCodes.AWAITING_ACTIVATION })
    ).toBeUndefined();
    expect(
      filter(bare.invoices, invoice =>
        InvoiceStatusGroups.UNPAID.includes(invoice.status)
      ).length
    ).toBeGreaterThan(0);
    expect(action?.label).toMatch(/invoice/i);
    expect(action?.value).toContain("/billing/invoices");
    expect(dispatchMockAction(bare, {}, action?.value ?? "")?.to).toContain(
      "status=unpaid"
    );
  });

  it("offers nothing at all where nothing needs attention", () => {
    // The live dataset is reactive, so a clone starts from the seed itself.
    const settled: MockDataset = assign(
      structuredClone(HOSTGRID_MINIMAL_MOCK_DATASET),
      { products: [], invoices: [] }
    );

    expect(
      resolveRef<{ value: string } | undefined>(
        settled,
        DATA_REF_ID.NEEDS_ATTENTION_ACTION
      )
    ).toBeUndefined();
  });
});

describe("dashboard — the client who owns nothing yet", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  function withNothingBought(showStore: boolean): MockDataset {
    const data = structuredClone(HOSTGRID_MOCK_DATASET);
    return assign(data, {
      products: [],
      features: assign({}, data.features, { showStore })
    });
  }

  it("offers the store from the products panel's own empty state where the brand sells", () => {
    const selling = withNothingBought(true);

    const props = panelProps(DATA_REF_ID.ACTIVE_PRODUCT_ITEMS, selling);

    expect(props?.items).toEqual([]);
    expect(readValue(props?.emptyAction, "label")).toBe("Place new order");
    expect(
      dispatchMockAction(
        selling,
        {},
        String(readValue(props?.emptyAction, "value"))
      )?.to
    ).toBeTruthy();
    expect(props?.emptyTitle).toBeTruthy();
  });

  it("offers nothing from that same empty state where it does not", () => {
    const notSelling = withNothingBought(false);

    const props = panelProps(DATA_REF_ID.ACTIVE_PRODUCT_ITEMS, notSelling);

    expect(props?.items).toEqual([]);
    expect(props?.emptyAction).toBeUndefined();
    expect(props?.emptyTitle).toBeTruthy();
  });

  it("groups the products it does own by what each one runs on", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

    const rows = resolveRef<ListModuleItem[]>(
      data,
      DATA_REF_ID.ACTIVE_PRODUCT_ITEMS
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(map(rows, "category")).toEqual(
      map(rows, row => find(data.products, { id: row.id })?.serviceIdentifier)
    );
    expect(some(rows, row => row.category !== undefined)).toBe(true);
  });
});

describe("dashboard — the accounts a parent manages", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
    resetMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
  });

  it("shows the panel to the parent and hides it from the account with no children", () => {
    const parent = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const alone = useMockData(MOCK_DATASET_ID.HOSTGRID_MINIMAL);
    const { gate, modules } = gateOf(DATA_REF_ID.HAS_CHILD_ACCOUNTS);

    expect(parent.childAccounts.length).toBeGreaterThan(0);
    expect(alone.childAccounts).toEqual([]);
    expect(resolveDataRef(gate, parent)).toBe(true);
    expect(resolveDataRef(gate, alone)).toBe(false);
    expect(
      some(
        modules,
        module =>
          readValue(readValue(module, "props"), "label") === "View all" &&
          readValue(readValue(module, "props"), "to") ===
            "/account/child-accounts"
      )
    ).toBe(true);
  });

  it("names each managed account, and leads each row to the list they live on", () => {
    const parent = useMockData(MOCK_DATASET_ID.HOSTGRID);

    const rows = resolveRef<ListModuleItem[]>(
      parent,
      DATA_REF_ID.DASHBOARD_CHILD_ACCOUNT_ITEMS
    );

    expect(rows).toHaveLength(3);
    expect(map(rows, "title")).toEqual(map(parent.childAccounts, "name"));
    expect(map(rows, "description")).toEqual(
      map(parent.childAccounts, "email")
    );
    expect(every(rows, row => row.to === "/account/child-accounts")).toBe(true);
  });
});

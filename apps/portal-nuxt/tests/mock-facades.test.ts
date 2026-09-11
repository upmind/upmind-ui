// -----------------------------------------------------------------------------
/**
 * @module tests/mock-facades
 * @description Plan R3: every mutation the store used to expose as a bare
 * function is now a `useActions()` method on a per-entity facade. Each write
 * answers with a receipt, shows its effect through that SAME facade's
 * `useContext()`, and refuses — with a reason, mutating nothing — on the
 * guarded paths. A facade for an id the dataset does not hold resolves empty
 * and writes nothing, and `store.ts` keeps no mutation door at all.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  ContractStatusCodes,
  InvoiceStatusGroups
} from "@upmind-automation/types";
import { filter, find, isFunction, keys, map, pickBy, some } from "lodash-es";
import type {
  MockDataset,
  MockInvoice,
  MockProduct
} from "~/portal/mock/types";
import {
  MOCK_RECEIPT_REASON,
  useMockCatalogue,
  useMockContractProduct,
  useMockInvoice,
  useMockNotifications,
  useMockTicket
} from "~/portal/mock/facades";
import * as mockStore from "~/portal/mock/store";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";

/** The seed registry's whole runtime surface once the writes have left (R3). */
const STORE_EXPORTS = [
  "MOCK_DATASET_ID",
  "idFor",
  "isMockDatasetId",
  "nextId",
  "nextSequence",
  "resetMockData",
  "useMockData"
];

const MUTATION_VERB =
  /^(pay|complete|place|reply|add|remove|mark|create|delete|cancel|toggle|set)[A-Z]/;

const ABSENT_ID = "no-such-record";

function unpaidInvoice(data: MockDataset): MockInvoice {
  const invoice = find(data.invoices, candidate =>
    InvoiceStatusGroups.UNPAID.includes(candidate.status)
  );
  if (invoice === undefined) throw new Error("seed carries no unpaid invoice");
  return invoice;
}

function productWithStatus(
  data: MockDataset,
  status: ContractStatusCodes
): MockProduct {
  const product = find(data.products, { status });
  if (product === undefined) throw new Error(`seed carries no ${status}`);
  return product;
}

describe("mock facades — R3: the writes live on the facades, with receipts", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("completeSetup activates a product awaiting setup, visible through its facade", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const subject = productWithStatus(
      data,
      ContractStatusCodes.AWAITING_ACTIVATION
    );
    const facade = useMockContractProduct(data, subject.id);

    const receipt = facade.useActions().completeSetup();

    expect(receipt?.ok).toBe(true);
    expect(facade.useContext().data.value?.status).toBe(
      ContractStatusCodes.ACTIVE
    );
  });

  it("completeSetup refuses a product that is not waiting on setup", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const subject = productWithStatus(data, ContractStatusCodes.ACTIVE);

    const receipt = useMockContractProduct(data, subject.id)
      .useActions()
      .completeSetup();

    expect(receipt?.ok).toBe(false);
    expect(receipt?.reason).toBe(MOCK_RECEIPT_REASON.NOT_AWAITING_SETUP);
    expect(find(data.products, { id: subject.id })?.status).toBe(
      ContractStatusCodes.ACTIVE
    );
  });

  it("placeOrder answers with the order it created, and the dataset carries it", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const item = data.catalogue[0];
    const before = data.orders.length;

    const receipt = useMockCatalogue(data)
      .useActions()
      .placeOrder(item?.id ?? ABSENT_ID);

    expect(receipt?.ok).toBe(true);
    expect(data.orders).toHaveLength(before + 1);
    expect(map(data.orders, "id")).toContain(receipt?.entity?.id);
  });

  it("reply appends to the thread the facade is scoped to", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const subject = data.tickets[0];
    const facade = useMockTicket(data, subject?.id);
    const before = facade.useContext().data.value?.messages.length ?? 0;

    const receipt = facade.useActions().reply({ body: "Any update on this?" });

    expect(receipt?.ok).toBe(true);
    expect(facade.useContext().data.value?.messages).toHaveLength(before + 1);
    expect(map(facade.useContext().data.value?.messages, "id")).toContain(
      receipt?.entity?.id
    );
    expect(facade.useContext().data.value?.messages.at(-1)?.body).toBe(
      "Any update on this?"
    );
  });

  it("markAllRead clears the inbox once, then refuses with nothing unread", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const facade = useMockNotifications(data);
    expect(filter(facade.useContext().data.value, { read: false })).not.toEqual(
      []
    );

    const first = facade.useActions().markAllRead();
    const second = facade.useActions().markAllRead();

    expect(first.ok).toBe(true);
    expect(filter(facade.useContext().data.value, { read: false })).toEqual([]);
    expect(second.ok).toBe(false);
    expect(second.reason).toBe(MOCK_RECEIPT_REASON.NOTHING_UNREAD);
  });

  it("one facade instance per (dataset, key), as the scope registry mints one per scope", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const subject = unpaidInvoice(data);

    const first = useMockInvoice(data, subject.id);
    expect(useMockInvoice(data, subject.id)).toBe(first);
    expect(useMockInvoice(data, ABSENT_ID)).not.toBe(first);

    first.useActions().destroy();
    expect(useMockInvoice(data, subject.id)).not.toBe(first);
  });

  it("store.ts keeps seeds and ids only — no mutation is reachable except through a facade", () => {
    const exported = keys(mockStore).sort();
    expect(exported).toEqual(STORE_EXPORTS);

    const callable = keys(pickBy(mockStore, isFunction));
    expect(some(callable, name => MUTATION_VERB.test(name))).toBe(false);
  });
});

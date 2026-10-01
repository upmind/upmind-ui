// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — each column and comparison reaches the wire
 * through the module criteria (AC-7, AC-9, operator rulings 3 and 4)
 *
 * ## Job To Be Done
 * Prove that each comparison of design 8.3 reaches the wire as
 * `filter[<col>|<op>]` through the module criteria schema and the query-core
 * `translateQuery`, with no side channel and no query-core change. Each case
 * drives the raw setter `useInternals().query.setCriteria` (design 8.3) with
 * the literal value its operator-form probe recorded, then asserts:
 * - the latest request carries that key with the recorded value, and no other
 *   comparison of the same column;
 * - the strict replay pool answers that request with that probe, so the
 *   published total equals the recorded total. The pool answers a request
 *   only when a capture records exactly the same criteria.
 *
 * The `orders.captures` spec proves that staging applied each probe:
 * the partition of each pair, and the non-empty `eq` probes.
 *
 * ## What Breaks If These Fail
 * The schema or the translator drops, renames or mis-serialises a dotted key
 * or an operator, so a client filter never reaches staging. Per ruling 4 a
 * failure here halts the build. It is never patched in the query module.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  PROBED_COMPARISONS,
  captured,
  filterPatch,
  observeOrderRequests,
  probeName,
  recordedParam,
  seedClientSession,
  settle
} from "./orders.int-helpers";
import "./setup.integration";
import type { OrderStatusChoice, OrdersQueryModel } from "..";

// -----------------------------------------------------------------------------

const STATUS_CHOICES: readonly OrderStatusChoice[] = [
  "invoice_paid",
  "invoice_unpaid,invoice_adjusted",
  "invoice_overdue",
  "invoice_cancelled",
  "invoice_refunded"
];

function asStatusChoice(value: string): OrderStatusChoice {
  const choice = STATUS_CHOICES.find(item => item === value);
  if (!choice)
    throw new Error(`"${value}" is not a status choice of design 8.3`);
  return choice;
}

/** A raw criteria write of one leaf, the value typed for its column. */
function rawLeaf(column: string, op: string, wire: string): OrdersQueryModel {
  const value =
    column === "total_amount"
      ? Number(wire)
      : op === "like"
        ? wire.replace(/^%|%$/g, "")
        : wire;
  return { filters: { [column]: { [op]: value } } } as OrdersQueryModel;
}

const STATUS_EQ = asStatusChoice(
  recordedParam(
    "get-invoices-case-orders-status-eq-csv",
    "filter[status.code|eq]"
  )
);
const STATUS_NEQ = asStatusChoice(
  recordedParam(
    "get-invoices-case-orders-status-neq",
    "filter[status.code|neq]"
  )
);

async function bootSelfCollection() {
  await seedClientSession();
  const orders = useOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

let orders: Awaited<ReturnType<typeof bootSelfCollection>>;

// -----------------------------------------------------------------------------

describe("orders — each client column and comparison reaches the wire (AC-7)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
  }, 30000);

  it.each(
    PROBED_COMPARISONS.flatMap(([column, ops]) =>
      ops.map(op => [column, op] as const)
    )
  )(
    "setCriteria on %s|%s sends the recorded value, and the pool answers with its probe",
    async (column, op) => {
      const name = probeName(column, op);
      const key = `filter[${column}|${op}]`;
      const wire = recordedParam(name, key);
      const observed = observeOrderRequests();

      orders.useInternals().query.setCriteria(rawLeaf(column, op, wire));

      await vi.waitFor(() =>
        expect(observed.latestParams().get(key)).toBe(wire)
      );
      const sameColumn = observed
        .filterKeys()
        .filter(other => other.startsWith(`filter[${column}|`));
      expect(sameColumn).toEqual([key]);
      expect(observed.latestParams().get("filter[category.slug]")).toBe(
        "new_contract"
      );
      await vi.waitFor(() =>
        expect(orders.useContext().pagination.value?.total).toBe(
          captured(name).total
        )
      );
      expect(orders.useMeta().hasError.value).toBe(false);
    }
  );

  it("setCriteria on number|eq sends the recorded order number, and the pool answers with the search capture", async () => {
    const wire = recordedParam(
      "get-invoices-case-orders-search",
      "filter[number|eq]"
    );
    const observed = observeOrderRequests();

    orders
      .useInternals()
      .query.setCriteria(filterPatch("number", { eq: wire }));

    await vi.waitFor(() =>
      expect(observed.latestParams().get("filter[number|eq]")).toBe(wire)
    );
    await vi.waitFor(() =>
      expect(orders.useContext().pagination.value?.total).toBe(
        captured("get-invoices-case-orders-search").total
      )
    );
  });
});

describe("orders — the status.code operator bag reaches the wire (AC-9)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
  }, 30000);

  it("setCriteria({ 'status.code': { eq: [...] } }) sends the SAME csv value staging recorded", async () => {
    const observed = observeOrderRequests();

    orders
      .useInternals()
      .query.setCriteria(filterPatch("status.code", { eq: [STATUS_EQ] }));

    await vi.waitFor(() =>
      expect(observed.latestParams().get("filter[status.code|eq]")).toBe(
        STATUS_EQ
      )
    );
    expect(observed.latestParams().has("filter[status.code|neq]")).toBe(false);
    await vi.waitFor(() =>
      expect(orders.useContext().pagination.value?.total).toBe(
        captured("get-invoices-case-orders-status-eq-csv").total
      )
    );
  });

  it("setCriteria({ 'status.code': { neq: [...] } }) sends the SAME value staging recorded", async () => {
    const observed = observeOrderRequests();

    orders
      .useInternals()
      .query.setCriteria(filterPatch("status.code", { neq: [STATUS_NEQ] }));

    await vi.waitFor(() =>
      expect(observed.latestParams().get("filter[status.code|neq]")).toBe(
        STATUS_NEQ
      )
    );
    expect(observed.latestParams().has("filter[status.code|eq]")).toBe(false);
    await vi.waitFor(() =>
      expect(orders.useContext().pagination.value?.total).toBe(
        captured("get-invoices-case-orders-status-neq").total
      )
    );
  });

  it("a raw write that holds eq AND neq together in ONE patch is refused, never sent (D-24)", async () => {
    const observed = observeOrderRequests();
    const raw = orders.useInternals().query;

    raw.setCriteria(filterPatch("status.code", { eq: [STATUS_EQ] }));
    await vi.waitFor(() =>
      expect(observed.latestParams().get("filter[status.code|eq]")).toBe(
        STATUS_EQ
      )
    );
    const sent = observed.all().length;

    raw.setCriteria(
      filterPatch("status.code", { eq: [STATUS_EQ], neq: [STATUS_NEQ] })
    );
    await settle(50);

    expect(observed.all().length).toBe(sent);
    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      expect(
        params.has("filter[status.code|eq]") &&
          params.has("filter[status.code|neq]")
      ).toBe(false);
    }
    expect(orders.useContext().error.value).toBeTruthy();
  });
});

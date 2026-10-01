// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the named filter setters and `filterBy`
 * (AC-7, AC-9, design 8.3)
 *
 * ## Job To Be Done
 * Prove the client-facing writers a page calls: each named setter writes its
 * column under the given comparison, a filter write returns to page one and
 * keeps the page size, a second write on one text column replaces the first,
 * two comparisons on `total_amount` stay together, and an absent value clears
 * the column. For AC9: the Unpaid choice is one enum value that asks for two
 * statuses, the schema and the uischema offer the five choices of design 8.3
 * only, and `filterBy` and `status()` each remove the other status comparison
 * before they write, in each direction.
 *
 * ## Provenance
 * Each driven value is parsed off its recorded operator-form probe. The
 * strict replay pool answers each request only with the capture that records
 * the same criteria.
 *
 * ## What Breaks If These Fail
 * A page's filter control sends the wrong key or value, piles a stale
 * predicate onto the wire, or lets an equal and a not-equal status filter
 * collide into a refused write.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  captured,
  observeOrderRequests,
  probeName,
  recordedParam,
  seedClientSession
} from "./orders.int-helpers";
import "./setup.integration";
import type { OrderStatusChoice } from "..";

// -----------------------------------------------------------------------------

const UNPAID: OrderStatusChoice = "invoice_unpaid,invoice_adjusted";
const CANCELLED: OrderStatusChoice = "invoice_cancelled";
const PAID: OrderStatusChoice = "invoice_paid";
const CHOICES: OrderStatusChoice[] = [
  PAID,
  UNPAID,
  "invoice_overdue",
  CANCELLED,
  "invoice_refunded"
];

const probe = (column: string, op: string) =>
  recordedParam(probeName(column, op), `filter[${column}|${op}]`);

const TOTAL_EQ = Number(probe("total_amount", "eq"));
const TOTAL_GTE = Number(probe("total_amount", "gte"));
const TOTAL_LTE = Number(probe("total_amount", "lte"));
const ITEM_NAME_EQ = probe("products.product.name", "eq");
const ITEM_NAME_LIKE = probe("products.product.name", "like").replace(
  /^%|%$/g,
  ""
);
const CATEGORY_NAME_EQ = probe("products.product.category.name", "eq");
const SERVICE_IDENTIFIER_EQ = probe("products.service_identifier", "eq");

async function bootSelfCollection() {
  await seedClientSession();
  const orders = useOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

let orders: Awaited<ReturnType<typeof bootSelfCollection>>;
let observer: ReturnType<typeof observeOrderRequests>;

// -----------------------------------------------------------------------------

describe("orders — the named filter setters (AC-7)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
    observer = observeOrderRequests();
  }, 30000);

  it.each([
    [
      "total",
      "filter[total_amount|eq]",
      String(TOTAL_EQ),
      () => orders.useActions().filters.total(TOTAL_EQ, "eq")
    ],
    [
      "itemName",
      "filter[products.product.name|eq]",
      ITEM_NAME_EQ,
      () => orders.useActions().filters.itemName(ITEM_NAME_EQ, "eq")
    ],
    [
      "categoryName",
      "filter[products.product.category.name|eq]",
      CATEGORY_NAME_EQ,
      () => orders.useActions().filters.categoryName(CATEGORY_NAME_EQ, "eq")
    ],
    [
      "serviceIdentifier",
      "filter[products.service_identifier|eq]",
      SERVICE_IDENTIFIER_EQ,
      () =>
        orders
          .useActions()
          .filters.serviceIdentifier(SERVICE_IDENTIFIER_EQ, "eq")
    ]
  ] as const)(
    "%s(value, 'eq') sends %s with the recorded value",
    async (_setter, key, value, write) => {
      write();
      await vi.waitFor(() =>
        expect(observer.latestParams().get(key)).toBe(value)
      );
      expect(observer.latestParams().get("filter[category.slug]")).toBe(
        "new_contract"
      );
      expect(orders.useMeta().hasError.value).toBe(false);
    }
  );

  it("a filter write on page two sends offset 0 and keeps the page size", async () => {
    orders.useActions().setPage(2);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("offset")).toBe("10")
    );

    orders.useActions().filters.total(TOTAL_EQ, "eq");
    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[total_amount|eq]")).toBe(
        String(TOTAL_EQ)
      )
    );
    expect(observer.latestParams().get("offset")).toBe("0");
    expect(observer.latestParams().get("limit")).toBe("10");
  });

  it("a second itemName write with a DIFFERENT operator REPLACES the first — one key on the wire, never both", async () => {
    orders.useActions().filters.itemName(ITEM_NAME_LIKE, "like");
    await vi.waitFor(() =>
      expect(
        observer.latestParams().has("filter[products.product.name|like]")
      ).toBe(true)
    );

    orders.useActions().filters.itemName(ITEM_NAME_EQ, "eq");
    await vi.waitFor(() =>
      expect(
        observer.latestParams().get("filter[products.product.name|eq]")
      ).toBe(ITEM_NAME_EQ)
    );
    expect(
      observer
        .filterKeys()
        .filter(key => key.startsWith("filter[products.product.name|"))
    ).toEqual(["filter[products.product.name|eq]"]);
  });

  it("two total writes with gte and lte keep both comparisons on the wire", async () => {
    orders.useActions().filters.total(TOTAL_GTE, "gte");
    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[total_amount|gte]")).toBe(
        String(TOTAL_GTE)
      )
    );

    orders.useActions().filters.total(TOTAL_LTE, "lte");
    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[total_amount|lte]")).toBe(
        String(TOTAL_LTE)
      )
    );
    expect(observer.latestParams().get("filter[total_amount|gte]")).toBe(
      String(TOTAL_GTE)
    );
  });

  it("an absent value clears the column (itemName with no value)", async () => {
    orders.useActions().filters.itemName(ITEM_NAME_EQ, "eq");
    await vi.waitFor(() =>
      expect(
        observer.latestParams().has("filter[products.product.name|eq]")
      ).toBe(true)
    );

    orders.useActions().filters.itemName(undefined);
    await vi.waitFor(() =>
      expect(
        orders.useContext().query.value.filters?.["products.product.name"]
      ).toBeUndefined()
    );
  });
});

describe("orders — the Unpaid choice and the status exclusion (AC-9)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
    observer = observeOrderRequests();
  }, 30000);

  it("status(['invoice_unpaid,invoice_adjusted']) asks for the unpaid and the adjusted statuses in one csv value", async () => {
    orders.useActions().filters.status([UNPAID]);
    await vi.waitFor(() =>
      expect(observer.latestParams().get("filter[status.code|eq]")).toBe(
        "invoice_unpaid,invoice_adjusted"
      )
    );
    await vi.waitFor(() =>
      expect(orders.useContext().pagination.value?.total).toBe(
        captured("get-invoices-case-orders-status-eq-csv").total
      )
    );
  });

  it("the schema offers the five status choices of design 8.3 only, the Unpaid choice as one value", () => {
    const schema = orders.useContext().schemas.query.schema as {
      properties: {
        filters: {
          properties: Record<
            string,
            { properties: Record<string, { items: { enum: string[] } }> }
          >;
        };
      };
    };
    const status =
      schema.properties.filters.properties["status.code"].properties;
    expect(status.eq.items.enum).toEqual(CHOICES);
    expect(status.neq.items.enum).toEqual(CHOICES);
  });

  it("the uischema presents status.code as one multi-select over the eq leaf, labelled, offering the five choices in order", () => {
    const uischema = orders.useContext().schemas.query.uischema as {
      elements: Array<{
        scope?: string;
        i18n?: string;
        options?: { format?: string };
      }>;
    };
    const statusControls = uischema.elements.filter(element =>
      element.scope?.startsWith("#/properties/filters/properties/status.code")
    );
    expect(statusControls).toHaveLength(1);

    const [control] = statusControls;
    expect(control.scope).toBe(
      "#/properties/filters/properties/status.code/properties/eq"
    );
    expect(control.options?.format).toBe("multi-select");
    expect(typeof control.i18n).toBe("string");
    expect(control.i18n).not.toBe("");

    const schema = orders.useContext().schemas.query.schema as {
      properties: {
        filters: {
          properties: Record<
            string,
            { properties: Record<string, { items: { enum: string[] } }> }
          >;
        };
      };
    };
    expect(
      schema.properties.filters.properties["status.code"].properties.eq.items
        .enum
    ).toEqual(CHOICES);
  });

  it.each([
    [
      "status()",
      (values: OrderStatusChoice[], op: "eq" | "neq") =>
        orders.useActions().filters.status(values, op)
    ],
    [
      "filterBy()",
      (values: OrderStatusChoice[], op: "eq" | "neq") =>
        orders.useActions().filterBy({ "status.code": { [op]: values } })
    ]
  ] as const)(
    "%s: a neq write after an eq write leaves no eq key, and an eq write after a neq write leaves no neq key",
    async (_writer, write) => {
      write([UNPAID], "eq");
      await vi.waitFor(() =>
        expect(observer.latestParams().get("filter[status.code|eq]")).toBe(
          UNPAID
        )
      );

      write([CANCELLED], "neq");
      await vi.waitFor(() =>
        expect(observer.latestParams().get("filter[status.code|neq]")).toBe(
          CANCELLED
        )
      );
      expect(observer.latestParams().has("filter[status.code|eq]")).toBe(false);

      write([PAID], "eq");
      await vi.waitFor(() =>
        expect(observer.latestParams().get("filter[status.code|eq]")).toBe(PAID)
      );
      expect(observer.latestParams().has("filter[status.code|neq]")).toBe(
        false
      );
    }
  );
});

// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — each row carries the legacy row fields, and
 * the collection publishes its three schemas (AC-6, design 5.3, 8.7)
 *
 * ## Job To Be Done
 * Prove the collection publishes the RAW record (D-2, no `select` mapper)
 * with each design 8.7 row field at its recorded value: `number`,
 * `delegate_related`, `total_amount_formatted`, `products`, `products_count`,
 * `create_datetime`, `unpaid_amount_formatted`, `status.code`,
 * `to_be_credited`, `due_date`, `cancellation_datetime`,
 * `pending_payment_method`, `paid_datetime`, `refund_changed`. A delegated
 * row carries its delegated marker. `brand.name` is proven on the
 * multi-brand read in `orders.list-includes-multibrand`. The context
 * publishes `schemas.query` with `schema`, `uischema` and `sortUischema`.
 *
 * ## Provenance
 * Declared construction (design 8.8, "delegated"): the recorded default list
 * with `delegate_related: true` on its first row, the rest verbatim.
 *
 * ## What Breaks If These Fail
 * A mapper narrows the rows and hides a legacy field from each page, or the
 * delegated notice never shows on a delegated order.
 */

import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { captured, seedClientSession } from "./orders.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const ROW_FIELDS = [
  "number",
  "delegate_related",
  "total_amount_formatted",
  "products",
  "products_count",
  "create_datetime",
  "unpaid_amount_formatted",
  "to_be_credited",
  "due_date",
  "cancellation_datetime",
  "pending_payment_method",
  "paid_datetime",
  "refund_changed"
] as const;

const DEFAULT = captured("get-invoices-case-orders-default");
const DELEGATED = {
  ...DEFAULT,
  data: DEFAULT.data.map((row, index) =>
    index === 0 ? { ...row, delegate_related: true } : row
  )
};

async function bootSelfCollection() {
  await seedClientSession();
  server?.use(
    http.get("*/api/invoices", ({ request }) =>
      new URL(request.url).searchParams.get("offset") === "0"
        ? HttpResponse.json(DELEGATED)
        : HttpResponse.error()
    )
  );
  const orders = useOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

let orders: Awaited<ReturnType<typeof bootSelfCollection>>;

describe("orders — each row carries the legacy row fields (AC-6)", () => {
  beforeEach(async () => {
    orders = await bootSelfCollection();
  }, 30000);

  it("the published rows are the RAW record — each legacy row field at its recorded value", () => {
    const rows = (orders.useContext().data.value ?? []) as unknown as Array<
      Record<string, unknown>
    >;
    expect(rows).toHaveLength(DELEGATED.data.length);

    rows.forEach((row, index) => {
      const recorded = DELEGATED.data[index];
      for (const field of ROW_FIELDS) {
        expect(recorded, `the capture holds "${field}"`).toHaveProperty(field);
        expect(row[field], `row ${index} "${field}"`).toEqual(recorded[field]);
      }
      expect((row.status as { code: string }).code).toBe(
        (recorded.status as { code: string }).code
      );
    });
    expect(rows[0].delegate_related).toBe(true);
    expect(rows[1].delegate_related).toBe(false);
    expect(rows.some(row => (row.products_count as number) > 0)).toBe(true);
  });

  it("useContext().schemas.query publishes schema, uischema and sortUischema", () => {
    const { schema, uischema, sortUischema } = orders.useContext().schemas
      .query as {
      schema: { properties?: Record<string, unknown> };
      uischema: { elements?: unknown[] };
      sortUischema: object;
    };

    expect(Object.keys(schema.properties ?? {})).toEqual(
      expect.arrayContaining(["filters", "sort", "pagination"])
    );
    expect(uischema.elements?.length).toBeGreaterThan(0);
    expect(sortUischema).toBeTruthy();
  });
});

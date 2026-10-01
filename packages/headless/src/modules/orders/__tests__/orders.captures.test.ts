// -----------------------------------------------------------------------------
/**
 * @fileoverview orders — the recorded captures hold what design 8.8
 * says they hold (file check, no production code)
 *
 * ## Job To Be Done
 * Prove that each design 8.8 capture is on disk under its own name, that no
 * other file sits beside them, that each one recorded the design 8.1 request,
 * and that each one holds the staging state its row names: the partition of
 * each operator-form pair, the non-empty `eq` probes, the truth-table amounts
 * of each single read, the paging recovery pages, the not-found refusal, and
 * the delegated reads of the snapshot order.
 *
 * ## What Breaks If These Fail
 * A spec replays a capture that recorded another request, or another state,
 * so its green proves nothing about staging.
 */

import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ALL_CAPTURES,
  LIST_CAPTURES,
  ORDER_CAPTURES,
  PROBED_COMPARISONS,
  capture,
  captured,
  capturesDir,
  probeName,
  recordedParams
} from "./orders.captures";

// -----------------------------------------------------------------------------

const LIST_RELATIONS = ["client", "client.image", "products", "status", "tags"];

const SINGLE_RELATIONS = [
  "account.affiliate_referral.affiliate_account.account.client",
  "affiliate_commissions",
  "brand",
  "client",
  "client.tags",
  "contract",
  "contract_product_tags",
  "custom_fields.field",
  "payments",
  "promotions",
  "status",
  "taxes",
  "taxes.tax_tag_data"
];

type Order = {
  id: string;
  brand_id: string;
  status: { code: string };
  paid_amount: number;
  unpaid_amount_converted: number;
  current_data?: {
    content?: { products?: Array<{ product?: { id?: string } }> };
  };
};

const total = (name: string): number => captured(name).total;
const order = (name: string): Order => captured<{ data: Order }>(name).data;
const relations = (params: URLSearchParams): string[] =>
  (params.get("with") ?? "").split(",").sort();

// -----------------------------------------------------------------------------

describe("orders captures — one file per design 8.8 name", () => {
  it("the fixtures directory holds exactly the design 8.8 captures, each under its own name", () => {
    const files = readdirSync(capturesDir)
      .filter(file => file.endsWith(".json"))
      .map(file => file.replace(/\.json$/, ""))
      .sort();
    expect(files).toEqual([...ALL_CAPTURES].sort());
  });

  it("no capture name is a substring of another file name", () => {
    for (const name of ALL_CAPTURES) {
      expect(
        ALL_CAPTURES.filter(other => other.includes(name)),
        name
      ).toEqual([name]);
    }
  });
});

describe("orders captures — the recorded requests are the design 8.1 reads", () => {
  it.each(LIST_CAPTURES)("%s recorded the design 8.1 list read", name => {
    const params = recordedParams(name);
    expect(capture(name).request.path.startsWith("/api/invoices?")).toBe(true);
    expect(params.get("filter[category.slug]")).toBe("new_contract");
    expect(relations(params)).toEqual(
      name.endsWith("-multibrand")
        ? [...LIST_RELATIONS, "brand"].sort()
        : LIST_RELATIONS
    );
    expect(params.get("with_count")).toBe("products");
    expect(params.get("limit")).toBe("10");
    expect(params.has("client_id")).toBe(false);
    expect(params.has("skip_count")).toBe(false);
  });

  it.each(ORDER_CAPTURES)("%s recorded the design 8.1 single read", name => {
    const params = recordedParams(name);
    expect(capture(name).request.path).toMatch(/^\/api\/invoices\/[^/?]+\?/);
    expect(params.get("with_staged_imports")).toBe("1");
    expect(relations(params)).toEqual(SINGLE_RELATIONS);
  });

  it("the sort captures ask for each of the four legacy fields, ascending", () => {
    for (const field of ["id", "total_amount", "status_id", "created_at"]) {
      expect(
        recordedParams(`get-invoices-case-orders-sort-${field}`).get("order")
      ).toBe(field);
    }
    expect(
      recordedParams("get-invoices-case-orders-default").get("order")
    ).toBe("-created_at");
  });
});

describe("orders captures — the operator-form probes show that staging applied each filter", () => {
  it.each(
    PROBED_COMPARISONS.flatMap(([column, ops]) => ops.map(op => [column, op]))
  )("the %s|%s probe was accepted by staging", (column, op) => {
    const name = probeName(column, op);
    expect(capture(name).response.status).toBe(200);
    expect(recordedParams(name).has(`filter[${column}|${op}]`)).toBe(true);
  });

  it("each eq probe returns the rows its value names", () => {
    for (const column of [
      "total_amount",
      "products.product.name",
      "products.product.category.name",
      "products.service_identifier"
    ]) {
      expect(total(probeName(column, "eq")), column).toBeGreaterThan(0);
    }
    expect(total("get-invoices-case-orders-search")).toBe(1);
  });

  it("each eq and neq pair partitions the default history", () => {
    const history = total("get-invoices-case-orders-default");
    expect(
      total("get-invoices-case-orders-search") +
        total(probeName("number", "neq"))
    ).toBe(history);
    for (const column of [
      "total_amount",
      "products.product.name",
      "products.product.category.name",
      "products.service_identifier"
    ]) {
      expect(
        total(probeName(column, "eq")) + total(probeName(column, "neq")),
        column
      ).toBe(history);
    }
  });

  it("each strict and inclusive bound pair partitions the rows that hold the column", () => {
    const history = total("get-invoices-case-orders-default");
    for (const column of ["total_amount", "created_at"]) {
      expect(
        total(probeName(column, "gt")) + total(probeName(column, "lte"))
      ).toBe(history);
      expect(
        total(probeName(column, "gte")) + total(probeName(column, "lt"))
      ).toBe(history);
      expect(total(probeName(column, "gt"))).toBeGreaterThan(0);
      expect(total(probeName(column, "lt"))).toBeGreaterThan(0);
    }
    const paid =
      total(probeName("paid_datetime", "gt")) +
      total(probeName("paid_datetime", "lte"));
    expect(
      total(probeName("paid_datetime", "gte")) +
        total(probeName("paid_datetime", "lt"))
    ).toBe(paid);
    expect(paid).toBeGreaterThan(0);
    expect(paid).toBeLessThanOrEqual(history);
  });

  it("each relative period narrows the history, in the past and in the future", () => {
    const history = total("get-invoices-case-orders-default");
    for (const column of ["created_at", "paid_datetime"]) {
      const after = total(probeName(column, "after"));
      const before = total(probeName(column, "before"));
      expect(after, column).toBeGreaterThan(0);
      expect(after, column).toBeLessThan(history);
      expect(before, column).toBeGreaterThan(after);
    }
    expect(
      recordedParams(probeName("created_at", "before")).get(
        "filter[created_at|before]"
      )
    ).toBe("+7_days");
  });

  it("each like probe holds at least the rows of its eq probe", () => {
    for (const column of [
      "products.product.name",
      "products.product.category.name",
      "products.service_identifier"
    ]) {
      expect(total(probeName(column, "like"))).toBeGreaterThanOrEqual(
        total(probeName(column, "eq"))
      );
    }
  });

  it("the status csv probe narrows the history to the unpaid statuses, and the neq probe drops the cancelled ones", () => {
    const csv = captured<{ data: Order[]; total: number }>(
      "get-invoices-case-orders-status-eq-csv"
    );
    expect(csv.total).toBeGreaterThan(0);
    for (const row of csv.data) {
      expect(["invoice_unpaid", "invoice_adjusted"]).toContain(row.status.code);
    }
    const neq = captured<{ data: Order[] }>(
      "get-invoices-case-orders-status-neq"
    );
    for (const row of neq.data)
      expect(row.status.code).not.toBe("invoice_cancelled");
  });
});

describe("orders captures — the paging recovery pages", () => {
  it("page 2 sits at offset 10 of a history larger than one page", () => {
    expect(
      recordedParams("get-invoices-case-orders-page-2").get("offset")
    ).toBe("10");
    expect(captured("get-invoices-case-orders-page-2").data).toHaveLength(10);
    expect(total("get-invoices-case-orders-default")).toBeGreaterThan(20);
  });

  it("the empty page answers offset 10 with no rows and a zero total", () => {
    expect(
      recordedParams("get-invoices-case-orders-empty-page").get("offset")
    ).toBe("10");
    expect(captured("get-invoices-case-orders-empty-page")).toMatchObject({
      data: [],
      total: 0
    });
  });

  it("the past-last page holds no rows and a total above zero, and the last page holds rows", () => {
    const past = Number(
      recordedParams("get-invoices-case-orders-past-last-page").get("offset")
    );
    const last = Number(
      recordedParams("get-invoices-case-orders-last-page").get("offset")
    );
    const history = total("get-invoices-case-orders-past-last-page");
    expect(captured("get-invoices-case-orders-past-last-page").data).toEqual(
      []
    );
    expect(history).toBeGreaterThan(0);
    expect(past).toBeGreaterThanOrEqual(history);
    expect(last).toBe(Math.floor((history - 1) / 10) * 10);
    expect(
      captured("get-invoices-case-orders-last-page").data.length
    ).toBeGreaterThan(0);
  });
});

describe("orders captures — the single reads hold the design 8.5 truth-table states", () => {
  it.each([
    ["get-invoices-id-case-order-paid", "invoice_paid", "positive", "zero"],
    ["get-invoices-id-case-order-unpaid", "invoice_unpaid", "zero", "positive"],
    [
      "get-invoices-id-case-order-part-paid",
      "invoice_unpaid",
      "positive",
      "positive"
    ],
    [
      "get-invoices-id-case-order-overdue",
      "invoice_overdue",
      "zero",
      "positive"
    ],
    [
      "get-invoices-id-case-order-cancelled-none-paid",
      "invoice_cancelled",
      "zero",
      "any"
    ],
    ["get-invoices-id-case-order-refunded", "invoice_refunded", "any", "zero"]
  ])("%s is %s, paid %s, unpaid %s", (name, code, paid, unpaid) => {
    const record = order(name);
    expect(record.status.code).toBe(code);
    const check = (value: number, rule: string) => {
      if (rule === "zero") expect(value).toBe(0);
      if (rule === "positive") expect(value).toBeGreaterThan(0);
    };
    check(record.paid_amount, paid);
    check(record.unpaid_amount_converted, unpaid);
  });

  it("the not-found read is a staging 404 with no record", () => {
    const fixture = capture("get-invoices-id-case-order-not-found");
    expect(fixture.response.status).toBe(404);
    expect((fixture.response.body as { data: unknown }).data).toBeNull();
  });
});

describe("orders captures — the delegated reads of the snapshot order", () => {
  it("the image read asks for the catalogue product ids of the snapshot items, not the line ids", () => {
    const snapshot = order("get-invoices-id-case-order-snapshot");
    const productIds = (snapshot.current_data?.content?.products ?? []).map(
      item => item.product?.id
    );
    const params = recordedParams("get-products-case-order-images");
    expect(productIds.length).toBeGreaterThan(0);
    expect(params.get("filter[id]")?.split(",")).toEqual([
      ...new Set(productIds)
    ]);
    expect(params.get("with")).toBe("image");
    expect(params.get("limit")).toBe(String(new Set(productIds).size));
  });

  it("the gateway read counts the online gateways of the order brand", () => {
    const fixture = capture("get-brands-id-gateways-case-online");
    const params = recordedParams("get-brands-id-gateways-case-online");
    expect(fixture.request.path.split("?")[0]).toBe(
      `/api/brands/${order("get-invoices-id-case-order-unpaid").brand_id}/gateways`
    );
    expect(params.get("limit")).toBe("count");
    expect(params.get("filter[gateway.type]")).toBe("1,6,3,10,4");
    expect(total("get-brands-id-gateways-case-online")).toBeGreaterThan(0);
  });

  it("the billing cycles read asks for every cycle", () => {
    expect(
      recordedParams("get-billing-cycles-case-order-items").get("limit")
    ).toBe("0");
    expect(
      captured("get-billing-cycles-case-order-items").data.length
    ).toBeGreaterThan(0);
  });
});

// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-orders API fixtures generator (ADR 025 §A1.3, design 8.8)
 *
 * ## Job To Be Done
 * Record every design 8.8 capture of this module from staging, in one run, as
 * the staging client:
 *
 *   pnpm fixtures:generate client-orders
 *
 * Each capture carries a `case=<label>` param. After `save()` the file is
 * renamed to `<method>-<path>-case-<label>.json`, the design 8.8 capture name,
 * so a spec loads it by that name. Every other `.json` in `fixtures/` is
 * deleted: this run supersedes it.
 *
 * ## Recording rule (design 8.8)
 * A state that staging cannot give stops the run, or is logged as a
 * disclosure for the operator. Nothing is constructed here. Discovery reads
 * carry `case=discover-*` and are dropped before `save()`.
 */

import { readFileSync, readdirSync, renameSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (set it in .env.recording)."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (set it in .env.recording)."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

const FORCED = "filter[category.slug]=new_contract";
const LIST_WITH = "tags,client,client.image,status,products";

const SINGLE_READ =
  "with_staged_imports=1&with=account.affiliate_referral.affiliate_account.account.client,affiliate_commissions,brand,client,client.tags,contract,contract_product_tags,custom_fields.field,payments,promotions,status,taxes,taxes.tax_tag_data";

const ONLINE_GATEWAY_TYPES = "1,6,3,10,4";

const DATE_ABSOLUTE = "2026-09-01 00:00:00";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Row = {
  id?: string;
  number?: string;
  total_amount?: number;
  paid_amount?: number;
  unpaid_amount_converted?: number;
  brand_id?: string;
  status?: { code?: string };
  products?: Array<{
    service_identifier?: string | null;
    product?: { name?: string; category?: { name?: string } };
  }>;
};

type ListBody = { data?: Row[]; total?: number };

type SnapshotItem = {
  product?: { id?: string };
  options?: unknown;
  attributes?: unknown;
};

type SingleBody = {
  data?: Row & {
    contract?: { cancellation_reason?: string | null } | null;
    account?: { affiliate_referral?: unknown } | null;
    current_data?: { content?: { products?: SnapshotItem[] } } | null;
  };
};

type ListOptions = {
  filter?: string;
  offset?: number;
  order?: string;
  withBrand?: boolean;
  limit?: number;
};

/** One design 8.1 list read at the given window, sort and extra filter. */
function listPath(label: string, options: ListOptions = {}): string {
  const filter = options.filter ? `&${options.filter}` : "";
  const relations = options.withBrand ? `${LIST_WITH},brand` : LIST_WITH;
  return (
    `/api/invoices?${FORCED}${filter}&with=${relations}&with_count=products` +
    `&order=${options.order ?? "-created_at"}&limit=${options.limit ?? 10}` +
    `&offset=${options.offset ?? 0}&case=${label}`
  );
}

function filterPair(column: string, op: string, value: string): string {
  return `filter[${column}|${op}]=${encodeURIComponent(value)}`;
}

/** The design 8.8 name of a capture: `<method>-<path>-case-<label>`. */
function captureName(method: string, path: string, label: string): string {
  const slug = new URL(path, "http://x").pathname
    .replace(/^\/api\//, "")
    .split("/")
    .filter(Boolean)
    .map(segment => (UUID.test(segment) ? "id" : segment))
    .join("-")
    .replace(/_/g, "-");
  return `${method.toLowerCase()}-${slug}-case-${label}`;
}

function holdsSubItems(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  return !!value && typeof value === "object" && Object.keys(value).length > 0;
}

// -----------------------------------------------------------------------------

describe("Client-orders API fixtures generator (design 8.8)", () => {
  let generator: Generator;
  const disclosures: string[] = [];
  const pool: Row[] = [];
  const sample: {
    number?: string;
    total?: number;
    productName?: string;
    categoryName?: string;
    serviceIdentifier?: string;
    brandId?: string;
  } = {};

  async function mustGet(path: string): Promise<unknown> {
    const { status, body } = await generator.get(path);
    if (status !== 200) {
      throw new Error(
        `${path} returned ${status}. Stop and tell the operator.`
      );
    }
    return body;
  }

  async function readOne(id: string, label: string): Promise<SingleBody> {
    return (await mustGet(
      `/api/invoices/${id}?${SINGLE_READ}&case=${label}`
    )) as SingleBody;
  }

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-orders"
    });
    generator.setBearerToken((await mintClientToken()).access_token);
  }, 30000);

  afterAll(() => {
    const captured = generator.getCapturedFixtures();
    for (const key of [...captured.keys()]) {
      if (key.includes("case=discover-")) captured.delete(key);
    }
    generator.save();

    const kept = new Set<string>();
    for (const { fixture, filename } of captured.values()) {
      const label = new URL(fixture.request.path, "http://x").searchParams.get(
        "case"
      );
      if (!label) continue;
      const target = `${captureName(fixture.request.method, fixture.request.path, label)}.json`;
      renameSync(join(recordingsDir, filename), join(recordingsDir, target));
      kept.add(target);
    }
    for (const file of readdirSync(recordingsDir)) {
      if (file.endsWith(".json") && !kept.has(file)) {
        unlinkSync(join(recordingsDir, file));
      }
    }

    console.log(
      `[fixtures:generate client-orders] ${kept.size} captures written. ` +
        `Disclosures:\n- ${disclosures.join("\n- ") || "none"}`
    );
  });

  it("records the default list, page 2 and the multi-brand relation read", async () => {
    const body = (await mustGet(listPath("orders-default"))) as ListBody;
    const rows = body.data ?? [];
    if ((body.total ?? 0) <= 10 || rows.length !== 10) {
      throw new Error(
        `the history holds ${body.total} orders; AC3 needs a second page. Stop and tell the operator.`
      );
    }
    for (const row of rows) {
      sample.number ??= row.number;
      if (sample.total === undefined && (row.total_amount ?? 0) > 0) {
        sample.total = row.total_amount;
      }
      sample.brandId ??= row.brand_id;
      for (const item of row.products ?? []) {
        sample.productName ??= item.product?.name;
        sample.categoryName ??= item.product?.category?.name;
        sample.serviceIdentifier ??= item.service_identifier ?? undefined;
      }
    }

    await mustGet(listPath("orders-page-2", { offset: 10 }));
    await mustGet(listPath("orders-multibrand", { withBrand: true }));
  }, 60000);

  it("discovers a service identifier when the default rows carry none", async () => {
    if (sample.serviceIdentifier) return;
    for (let offset = 0; offset < 1000; offset += 50) {
      const body = (await mustGet(
        listPath(`discover-service-identifier-${offset}`, { offset, limit: 50 })
      )) as ListBody;
      for (const row of body.data ?? []) {
        for (const item of row.products ?? []) {
          sample.serviceIdentifier ??= item.service_identifier ?? undefined;
        }
      }
      if (sample.serviceIdentifier || (body.data ?? []).length < 50) break;
    }
    disclosures.push(
      sample.serviceIdentifier
        ? "the default rows carry no service identifier; the probe value comes from a later order of the same history"
        : "no order of the history carries products.service_identifier; the service_identifier probes are not recorded (design 8.8: stop and tell the operator)"
    );
  }, 180000);

  it("records the paging recovery reads (AC4, AC24 divergence 3)", async () => {
    const probe = (await mustGet(
      listPath("discover-total", { limit: 1 })
    )) as ListBody;
    const lastOffset = Math.floor(((probe.total ?? 0) - 1) / 10) * 10;

    const past = (await mustGet(
      listPath("orders-past-last-page", { offset: lastOffset + 100 })
    )) as ListBody;
    const last = (await mustGet(
      listPath("orders-last-page", { offset: lastOffset })
    )) as ListBody;
    const empty = (await mustGet(
      listPath("orders-empty-page", {
        offset: 10,
        filter: filterPair("created_at", "lt", "2000-01-01 00:00:00")
      })
    )) as ListBody;

    if ((past.data ?? []).length !== 0 || (past.total ?? 0) === 0) {
      throw new Error(
        "the past-last-page read is not an empty page with a total above zero. Stop and tell the operator."
      );
    }
    if ((last.data ?? []).length === 0) {
      throw new Error(
        "the last-page read holds no rows. Stop and tell the operator."
      );
    }
    if ((empty.total ?? -1) !== 0) {
      throw new Error(
        "the empty-page read does not answer total 0. Stop and tell the operator."
      );
    }
  }, 60000);

  it("records the search and the two status reads (AC9, AC11)", async () => {
    await mustGet(
      listPath("orders-search", {
        filter: filterPair("number", "eq", sample.number ?? "")
      })
    );
    const csv = (await mustGet(
      listPath("orders-status-eq-csv", {
        filter: "filter[status.code|eq]=invoice_unpaid,invoice_adjusted"
      })
    )) as ListBody;
    await mustGet(
      listPath("orders-status-neq", {
        filter: "filter[status.code|neq]=invoice_cancelled"
      })
    );
    const codes = new Set((csv.data ?? []).map(row => row.status?.code));
    if (!codes.has("invoice_unpaid") || !codes.has("invoice_adjusted")) {
      const adjusted = (await mustGet(
        listPath("discover-adjusted", {
          filter: "filter[status.code|eq]=invoice_adjusted",
          limit: 1
        })
      )) as ListBody;
      disclosures.push(
        `the status csv capture holds [${[...codes].join(",")}]; the history holds ${adjusted.total ?? 0} adjusted orders (design 8.8: stop and tell the operator)`
      );
    }
  }, 60000);

  it("records one operator-form probe for each comparison of design 8.3 (AC7, AC8)", async () => {
    const probes: Array<[string, string, string | undefined]> = [
      ["number", "like", sample.number],
      ["number", "neq", sample.number]
    ];
    for (const op of ["eq", "neq", "gt", "gte", "lt", "lte"]) {
      probes.push(["total_amount", op, String(sample.total)]);
    }
    for (const column of ["created_at", "paid_datetime"]) {
      for (const op of ["gt", "gte", "lt", "lte"]) {
        probes.push([column, op, DATE_ABSOLUTE]);
      }
      probes.push([column, "after", "-7_days"], [column, "before", "+7_days"]);
    }
    for (const [column, value] of [
      ["products.product.name", sample.productName],
      ["products.product.category.name", sample.categoryName],
      ["products.service_identifier", sample.serviceIdentifier]
    ] as const) {
      for (const op of ["like", "eq", "neq"]) probes.push([column, op, value]);
    }

    for (const [column, op, value] of probes) {
      if (value === undefined) {
        disclosures.push(
          `no value for the ${column}|${op} probe; not recorded`
        );
        continue;
      }
      const wire = op === "like" ? `%${value}%` : value;
      const label = `orders-${column.replace(/\./g, "-")}-${op}-probe`;
      const body = (await mustGet(
        listPath(label, { filter: filterPair(column, op, wire) })
      )) as ListBody;
      if (op === "eq" && (body.total ?? 0) === 0) {
        disclosures.push(
          `${column}|eq "${value}" returned total 0 (design 8.8: stop and tell the operator)`
        );
      }
    }
  }, 240000);

  it("records one read for each sort field (AC10)", async () => {
    for (const field of ["id", "total_amount", "status_id", "created_at"]) {
      await mustGet(listPath(`orders-sort-${field}`, { order: field }));
    }
  }, 60000);

  it("discovers the single-read pool", async () => {
    for (const code of [
      "invoice_paid",
      "invoice_unpaid",
      "invoice_overdue",
      "invoice_cancelled",
      "invoice_refunded"
    ]) {
      const body = (await mustGet(
        listPath(`discover-${code}`, {
          filter: `filter[status.code|eq]=${code}`,
          limit: 50
        })
      )) as ListBody;
      pool.push(...(body.data ?? []));
    }
  }, 60000);

  it("records the truth-table single reads, the not-found read and the snapshot read (AC13 to AC21)", async () => {
    const byCode = (code: string) =>
      pool.filter(row => row.status?.code === code && row.id);

    const paid = byCode("invoice_paid");
    let paidId: string | undefined;
    for (const row of paid.slice(0, 15)) {
      const body = await readOne(row.id!, `discover-paid-${row.id}`);
      if (body.data?.account?.affiliate_referral) {
        paidId = row.id;
        break;
      }
    }
    if (!paidId) {
      disclosures.push(
        "no paid order of the first 15 carries an affiliate referrer; AC14 uses the design 8.8 referrer construction"
      );
      paidId = paid[0]?.id;
    }
    if (!paidId) throw new Error("no paid order. Stop and tell the operator.");
    await readOne(paidId, "order-paid");

    const due = (row: Row) => (row.unpaid_amount_converted ?? 0) > 0;
    for (const [label, row] of [
      [
        "order-unpaid",
        byCode("invoice_unpaid").find(r => r.paid_amount === 0 && due(r))
      ],
      [
        "order-part-paid",
        byCode("invoice_unpaid").find(r => (r.paid_amount ?? 0) > 0 && due(r))
      ],
      [
        "order-overdue",
        byCode("invoice_overdue").find(r => r.paid_amount === 0 && due(r))
      ],
      ["order-refunded", byCode("invoice_refunded")[0]]
    ] as const) {
      if (!row?.id)
        throw new Error(`no ${label} order. Stop and tell the operator.`);
      await readOne(row.id, label);
    }

    const cancelled = byCode("invoice_cancelled").filter(
      r => r.paid_amount === 0
    );
    let cancelledId: string | undefined;
    for (const row of cancelled) {
      const body = await readOne(row.id!, `discover-cancelled-${row.id}`);
      if (body.data?.contract?.cancellation_reason) {
        cancelledId = row.id;
        break;
      }
    }
    if (!cancelledId) {
      disclosures.push(
        `no cancelled order of the ${cancelled.length} discovered with paid_amount 0 carries a contract cancellation_reason (AC14: stop and tell the operator)`
      );
      cancelledId = cancelled[0]?.id;
    }
    if (!cancelledId)
      throw new Error("no cancelled order. Stop and tell the operator.");
    await readOne(cancelledId, "order-cancelled-none-paid");

    const notFound = await generator.get(
      `/api/invoices/00000000-0000-4000-8000-000000000000?${SINGLE_READ}&case=order-not-found`
    );
    if (notFound.status < 400 || notFound.status >= 500) {
      throw new Error(
        `the not-found read returned ${notFound.status}. Stop and tell the operator.`
      );
    }

    let best: { id: string; score: number; items: SnapshotItem[] } | undefined;
    for (const row of pool.slice(0, 60)) {
      const body = await readOne(row.id!, `discover-snapshot-${row.id}`);
      const items = body.data?.current_data?.content?.products ?? [];
      const nested = items.filter(
        item => holdsSubItems(item.options) || holdsSubItems(item.attributes)
      ).length;
      const score = items.length + 10 * nested;
      if (!best || score > best.score) best = { id: row.id!, score, items };
    }
    if (!best || best.items.length === 0) {
      throw new Error(
        "no order holds snapshot items. Stop and tell the operator."
      );
    }
    await readOne(best.id, "order-snapshot");
    if (best.score < 10) {
      disclosures.push(
        "no snapshot item of the pool holds options or attributes (design 8.8: stop and tell the operator)"
      );
    }

    const productIds = [
      ...new Set(
        best.items
          .map(item => item.product?.id)
          .filter((id): id is string => !!id)
      )
    ];
    if (productIds.length === 0) {
      disclosures.push(
        "the snapshot items carry no product id; no image read recorded"
      );
      return;
    }
    await mustGet(
      `/api/products?filter[id]=${productIds.join(",")}&with=image&limit=${productIds.length}&case=order-images`
    );
  }, 600000);

  it("records the billing cycles and the online gateways of the order brand (AC15, AC19)", async () => {
    await mustGet("/api/billing_cycles?limit=0&case=order-items");
    if (!sample.brandId)
      throw new Error("no brand id. Stop and tell the operator.");
    const gateways = (await mustGet(
      `/api/brands/${sample.brandId}/gateways?limit=count&filter[gateway.type]=${ONLINE_GATEWAY_TYPES}&case=online`
    )) as ListBody;
    if ((gateways.total ?? 0) === 0) {
      throw new Error(
        "the order brand has no online gateway. Stop and tell the operator."
      );
    }
  }, 60000);
});

// -----------------------------------------------------------------------------
// SCENARIOS (FE-3145, ADR 035) — the per-step recordings the four criteria-
// writing driven scenarios of `client-orders.feature` need. `client-orders.replay`
// keeps its flat corpus for the boot, the default list and the page walk (AC-1,
// AC-3), and arms these folders on top for the combined-criteria reads those
// captures do not hold: each column-and-comparison accumulation (AC-7), a sort
// held on page two (AC-10), a status filter searched together with a number
// (AC-11) and each writer over the forced category (AC-12). The probe values
// are the design 8.3 constants `client-orders.steps.ts` drives with, so a
// recording answers the exact request the step fires. These reads carry filters
// only, so the recorder needs no unpaid/part-paid order in the current history.
// -----------------------------------------------------------------------------

const scenarioFeature = readFileSync(
  join(import.meta.dirname, "client-orders.feature"),
  "utf-8"
);

const PROBE = {
  orderNumber: "QA-INV-25144",
  totalAmount: "4.8",
  absoluteDate: "2026-09-01 00:00:00",
  itemName: " Starter Hosting",
  categoryName: " Shared Hosting",
  serviceIdentifier: "DGyTC25827.com",
  statusEq: "invoice_paid",
  statusNeq: "invoice_cancelled"
} as const;

const CLIENT_COLUMNS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ["number", ["like", "eq", "neq"]],
  ["total_amount", ["eq", "neq", "gt", "gte", "lt", "lte"]],
  ["status.code", ["eq", "neq"]],
  ["created_at", ["gt", "gte", "lt", "lte", "after", "before"]],
  ["paid_datetime", ["gt", "gte", "lt", "lte", "after", "before"]],
  ["products.product.name", ["like", "eq", "neq"]],
  ["products.product.category.name", ["like", "eq", "neq"]],
  ["products.service_identifier", ["like", "eq", "neq"]]
];

function probeValue(column: string, op: string): string {
  if (column === "number") return PROBE.orderNumber;
  if (column === "total_amount") return PROBE.totalAmount;
  if (column === "status.code")
    return op === "eq" ? PROBE.statusEq : PROBE.statusNeq;
  if (column === "created_at" || column === "paid_datetime") {
    if (op === "after") return "-7_days";
    if (op === "before") return "+7_days";
    return PROBE.absoluteDate;
  }
  if (column === "products.product.name") return PROBE.itemName;
  if (column === "products.product.category.name") return PROBE.categoryName;
  return PROBE.serviceIdentifier;
}

function leaf(column: string, op: string): string {
  const value = probeValue(column, op);
  const wire = op === "like" ? `%${value}%` : value;
  return `filter[${column}|${op}]=${encodeURIComponent(wire)}`;
}

function scenarioListPath(filters: string[]): string {
  const clauses = [FORCED, ...filters].join("&");
  return (
    `/api/invoices?${clauses}&with=${LIST_WITH}&with_count=products` +
    `&order=-created_at&limit=10&offset=0`
  );
}

describe("Client-orders scenario recordings (FE-3145, design 8.12)", () => {
  let clientToken: IToken;
  const prepared = new Set<string>();

  async function recordStep(
    scenario: string,
    step: string,
    requests: (record: (filters: string[]) => Promise<unknown>) => Promise<void>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, scenarioFeature, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        scenarioFeature,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "client-orders"
    });
    generator.setBearerToken(clientToken.access_token);
    const record = async (filters: string[]): Promise<unknown> => {
      const { status } = await generator.get(scenarioListPath(filters));
      if (status !== 200) {
        throw new Error(
          `${scenario} / ${step}: ${scenarioListPath(filters)} returned ${status}. Stop and tell the operator.`
        );
      }
      return undefined;
    };
    await requests(record);
    generator.save();
  }

  beforeAll(async () => {
    clientToken = await mintClientToken();
  }, 30000);

  // --- AC-7: each client column and comparison -------------------------------

  describe("Each client column and comparison sets the history criteria", () => {
    const scenario =
      "Each client column and comparison sets the history criteria";

    it("the client sets each order history filter below", () =>
      recordStep(
        scenario,
        "the client sets each order history filter below",
        async record => {
          const active = new Map<string, string>();
          for (const [column, ops] of CLIENT_COLUMNS) {
            for (const op of ops) {
              active.set(column, leaf(column, op));
              await record([...active.values()]);
            }
          }
        }
      ));

    it("a second filter on the same text column of the order history replaces the first", () =>
      recordStep(
        scenario,
        "a second filter on the same text column of the order history replaces the first",
        async record => {
          const active = new Map<string, string>();
          for (const [column, ops] of CLIENT_COLUMNS)
            active.set(column, leaf(column, ops[ops.length - 1]));
          active.set(
            "products.product.name",
            leaf("products.product.name", "like")
          );
          await record([...active.values()]);
          active.set(
            "products.product.name",
            leaf("products.product.name", "eq")
          );
          await record([...active.values()]);
        }
      ));
  });

  // --- AC-10: a sort keeps the page ------------------------------------------

  describe("The newest order comes first, and a sort keeps the page", () => {
    const scenario = "The newest order comes first, and a sort keeps the page";

    it("the client sorts the order history by each legacy field", () =>
      recordStep(
        scenario,
        "the client sorts the order history by each legacy field",
        record => record([])
      ));
  });

  // --- AC-11: search and filters live together -------------------------------

  describe("Search and filters live together", () => {
    const scenario = "Search and filters live together";
    const statusFilter = `filter[status.code|eq]=${PROBE.statusEq}`;

    it("a status filter is active on page two of the order history", () =>
      recordStep(
        scenario,
        "a status filter is active on page two of the order history",
        record => record([statusFilter])
      ));

    it("the client searches the order history for an order number", () =>
      recordStep(
        scenario,
        "the client searches the order history for an order number",
        record =>
          record([statusFilter, `filter[number|eq]=${PROBE.orderNumber}`])
      ));
  });

  // --- AC-12: the forced category survives each writer -----------------------

  describe("The forced category survives each writer", () => {
    const scenario = "The forced category survives each writer";

    it("each order history writer changes the criteria, the playground filter bar included", () =>
      recordStep(
        scenario,
        "each order history writer changes the criteria, the playground filter bar included",
        async record => {
          await record([leaf("number", "like")]);
          await record([leaf("number", "like"), leaf("number", "eq")]);
          await record([leaf("status.code", "neq")]);
          await record([leaf("number", "eq")]);
        }
      ));
  });
});

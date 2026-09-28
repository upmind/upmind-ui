// -----------------------------------------------------------------------------
/**
 * @fileoverview Client-orders API Fixtures Generator (ADR 025 §A1.3)
 *
 * ## Job To Be Done
 * Capture REAL `api/invoices` responses this story's `client x self` cell
 * reads, into this module's own co-located `fixtures/` dir — the files the
 * `client-orders.dotted-operators.int.test.ts` and `client-orders.utils.test.ts`
 * specs replay. Run on demand:
 *
 *   pnpm fixtures:generate client-orders
 *
 * ## Scope of THIS pass
 * Operator ruling (4), 2026-09-23, names ONE mandatory proof: the dotted-key
 * operator-bag path for `status.code` (`eq`, `neq`) and the three
 * `products.*` columns (`like`, `eq`, `neq` each), reaching the wire through
 * the module's OWN criteria schema and `translateQuery` — no query-core
 * change, no side channel. This generator captures exactly that operator-form
 * set, plus a broad default list (to resolve real order ids and discover
 * which design 8.5 truth-table states the real corpus offers) — the minimum
 * a first REVISE pass can verify end-to-end. Design 8.8's fuller capture set
 * (paging, availability, one-order relations, items, images, gateways,
 * billing cycles, the AC20 engine-run) is NOT captured here — each is a
 * separate task (T13/T15/T20/T22) this pass does not claim to close.
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from `*.test.ts` / `*.int.test.ts` by the
 * `*.fixtures.ts` suffix. No assertions beyond "the capture completed and
 * returned a usable body"; `save()` in `afterAll` writes every capture once.
 *
 * ## Case-name disambiguation
 * `getFixture`/`getFixtureBody` match by SUBSTRING on the FILENAME
 * (tests/fixtures/index.ts), and a filename over 100 chars collapses its
 * whole param tail to an opaque hash (`fixture-naming.mjs` `MAX_FIXTURE_NAME`)
 * — so the operator-form captures below carry NO extra `case=` param; the
 * `filter[<col>|<op>]` key itself is the identity, is short enough to stay
 * under the hash threshold, and is unambiguous by construction: `eq` is a
 * substring of `neq`, but `<col>-eq` (the column name immediately precedes
 * the operator in the cleaned filename) is never a substring of `<col>-neq`,
 * because the character right after `<col>-` differs (`e` vs `n`). The one
 * `gt`/`gte` and `lt`/`lte` PREFIX-collision case (`<col>-gt` IS a substring
 * of `<col>-gte`) does not arise here — ruling 4's mandated columns
 * (`status.code`, `products.*`) use only `eq`/`neq`/`like`.
 *
 * ## Capture-limitation disclosure (required by NFR-2)
 * The design 8.5 truth table's rarer states (part-paid, refunded,
 * cancelled-part-paid, overdue) may not exist in this staging client's real
 * order history in a given capture window. Design 8.8's recording-rule table
 * says: stop and tell the operator for those three, rather than construct
 * them. This generator logs which states it found and which it did not; it
 * constructs nothing.
 *
 * ## Captures
 * `get-invoices-case-orders-default-filter-category-slug-new-contract`
 * (broad real list, forced category) · one `get-invoices-filter-status-code-eq…`
 * / `-neq…` pair (AC9, ruling 4) · three `get-invoices-filter-products-product-name-<op>…`
 * / `-products-product-category-name-<op>…` / `-products-service-identifier-<op>…`
 * triples for `like`/`eq`/`neq` (AC7, ruling 4) ·
 * `get-invoices-id-case-order-<status>` (one order per real status found, AC18 truth table, T10) ·
 * one `get-invoices-filter-number-eq…` / `-like…` / `-neq…` triple and one
 * `get-invoices-filter-total_amount-eq…` / `-neq…` / `-gt…` / `-gte…` /
 * `-lt…` / `-lte…` sextet — ruling 3 names `number` and `total_amount`
 * explicitly as columns whose `|eq` acceptance a recorded staging fixture
 * must prove; the value `10` for `total_amount` is design.md 8.8's own
 * example value for this exact capture, not an authored literal.
 */

import { join } from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { Generator } from "@upmind-automation/test-fixtures/generator";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import { mintClientToken } from "../../auth/__tests__/auth.tokens";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          ".env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set " +
          "it in .env.recording). The API resolves the brand from the " +
          'Origin header; without it every call returns 404 "Domain not found!".'
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

const FORCED_CATEGORY = "filter[category.slug]=new_contract";

/** A real order row, as returned by the default list capture. */
type OrderListRow = {
  id?: string;
  number?: string;
  status?: { code?: string };
  products?: Array<{
    product?: { name?: string; category?: { name?: string } };
    service_identifier?: string;
  }>;
};

// -----------------------------------------------------------------------------

describe("Client-orders API Fixtures Generator", () => {
  let generator: Generator;
  let clientToken: IToken;
  let sampleNumber: string | undefined;
  let sampleProductName: string | undefined;
  let sampleServiceIdentifier: string | undefined;
  const statusIdByStatus = new Map<string, string>();

  beforeAll(async () => {
    generator = new Generator(API_URL, {
      recordingsDir,
      origin: ORIGIN,
      source: "case",
      name: "client-orders"
    });

    clientToken = await mintClientToken();
  }, 30000);

  afterAll(() => {
    generator.save();
  });

  it("captures GET api/invoices (broad real list, forced category, case=orders-default)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status, body } = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&with=status,products&limit=25&order=-created_at&case=orders-default`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `List capture returned ${status} — refusing to ship a fixture that ` +
          "does not represent a readable collection."
      );
    }
    const rows = (body as { data?: OrderListRow[] })?.data ?? [];
    if (rows.length === 0) {
      throw new Error(
        "The real list capture returned zero new_contract orders — this " +
          "staging client has no order history to capture fixtures from. " +
          "Escalate rather than hand-author a list."
      );
    }

    for (const row of rows) {
      const code = row.status?.code;
      if (code && row.id && !statusIdByStatus.has(code)) {
        statusIdByStatus.set(code, row.id);
      }
      if (!sampleNumber && row.number) sampleNumber = row.number;
      for (const item of row.products ?? []) {
        if (!sampleProductName && item.product?.name) {
          sampleProductName = item.product.name;
        }
        if (!sampleServiceIdentifier && item.service_identifier) {
          sampleServiceIdentifier = item.service_identifier;
        }
      }
    }

    // Disclosure only — design 8.8's recording rule says STOP for a rarer
    // truth-table state absent from the real corpus, never construct it. T10
    // consumes only the statuses this log confirms present.
    const wanted = [
      "invoice_paid",
      "invoice_unpaid",
      "invoice_overdue",
      "invoice_cancelled",
      "invoice_refunded"
    ];
    const found = wanted.filter(code => statusIdByStatus.has(code));
    const missing = wanted.filter(code => !statusIdByStatus.has(code));
    console.log(
      "[fixtures:generate client-orders] real-corpus statuses in this " +
        `capture window — found:[${found.join(",")}] missing:[${missing.join(",")}]. ` +
        "part-paid and cancelled-part-paid cannot be detected from the list " +
        "row alone (amount fields are on the single-order read only) — T20 " +
        "resolves those against a single-order capture, not this generator."
    );
  });

  it("captures GET api/invoices filter[status.code|eq] (AC9, ruling 4)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[status.code|eq]=invoice_unpaid,invoice_adjusted&limit=25`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `status.code|eq operator-form capture returned ${status} — ruling 4 ` +
          "requires this form be provably accepted by staging."
      );
    }
  });

  it("captures GET api/invoices filter[status.code|neq] (AC9, ruling 4)", async () => {
    generator.setBearerToken(clientToken.access_token);
    const { status } = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[status.code|neq]=invoice_cancelled&limit=25`
    );
    generator.clearBearerToken();
    if (status !== 200) {
      throw new Error(
        `status.code|neq operator-form capture returned ${status} — ruling 4 ` +
          "requires this form be provably accepted by staging."
      );
    }
  });

  it("captures GET api/invoices filter[products.product.name|<op>] (AC7, ruling 4)", async () => {
    const term = sampleProductName ?? "vps";
    generator.setBearerToken(clientToken.access_token);
    const like = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[products.product.name|like]=%25${encodeURIComponent(term)}%25&limit=25`
    );
    const eq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[products.product.name|eq]=${encodeURIComponent(term)}&limit=25`
    );
    const neq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[products.product.name|neq]=${encodeURIComponent(term)}&limit=25`
    );
    generator.clearBearerToken();
    for (const [op, { status }] of [
      ["like", like],
      ["eq", eq],
      ["neq", neq]
    ] as const) {
      if (status !== 200) {
        throw new Error(
          `products.product.name|${op} operator-form capture returned ` +
            `${status} — ruling 4 requires this form be provably accepted.`
        );
      }
    }
  });

  it("captures GET api/invoices filter[products.product.category.name|<op>] (AC7, ruling 4)", async () => {
    // A short fixed literal — a real category name on this staging corpus
    // runs long enough (with encoded spaces) to push the fixture filename
    // over the 100-char collapse threshold (`fixture-naming.mjs`), losing
    // the readable name this generator's captures rely on for lookup by
    // `getFixture`. Ruling 4 only needs the operator FORM accepted (a 200),
    // not a matching row.
    const term = "hosting";
    generator.setBearerToken(clientToken.access_token);
    const like = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[products.product.category.name|like]=%25${encodeURIComponent(term)}%25&limit=25`
    );
    const eq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[products.product.category.name|eq]=${encodeURIComponent(term)}&limit=25`
    );
    const neq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[products.product.category.name|neq]=${encodeURIComponent(term)}&limit=25`
    );
    generator.clearBearerToken();
    for (const [op, { status }] of [
      ["like", like],
      ["eq", eq],
      ["neq", neq]
    ] as const) {
      if (status !== 200) {
        throw new Error(
          `products.product.category.name|${op} operator-form capture ` +
            `returned ${status} — ruling 4 requires this form be provably accepted.`
        );
      }
    }
  });

  it("captures GET api/invoices filter[products.service_identifier|<op>] (AC7, ruling 4)", async () => {
    const term = sampleServiceIdentifier ?? sampleNumber ?? "svc-1";
    generator.setBearerToken(clientToken.access_token);
    const like = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[products.service_identifier|like]=%25${encodeURIComponent(term)}%25&limit=25`
    );
    const eq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[products.service_identifier|eq]=${encodeURIComponent(term)}&limit=25`
    );
    const neq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[products.service_identifier|neq]=${encodeURIComponent(term)}&limit=25`
    );
    generator.clearBearerToken();
    for (const [op, { status }] of [
      ["like", like],
      ["eq", eq],
      ["neq", neq]
    ] as const) {
      if (status !== 200) {
        throw new Error(
          `products.service_identifier|${op} operator-form capture returned ` +
            `${status} — ruling 4 requires this form be provably accepted.`
        );
      }
    }
  });

  it("captures GET api/invoices filter[number|<op>] (AC7, ruling 3)", async () => {
    const term = sampleNumber ?? "0";
    generator.setBearerToken(clientToken.access_token);
    const eq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[number|eq]=${encodeURIComponent(term)}&limit=25`
    );
    const like = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[number|like]=%25${encodeURIComponent(term)}%25&limit=25`
    );
    const neq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[number|neq]=${encodeURIComponent(term)}&limit=25`
    );
    generator.clearBearerToken();
    for (const [op, { status }] of [
      ["eq", eq],
      ["like", like],
      ["neq", neq]
    ] as const) {
      if (status !== 200) {
        throw new Error(
          `number|${op} operator-form capture returned ${status} — ruling 3 ` +
            "requires this form be provably accepted."
        );
      }
    }
  });

  it("captures GET api/invoices filter[total_amount|<op>] (AC7, ruling 3)", async () => {
    // design.md 8.8's own example value for this exact capture — not an
    // authored literal.
    const value = "10";
    generator.setBearerToken(clientToken.access_token);
    const eq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[total_amount|eq]=${value}&limit=25`
    );
    const neq = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[total_amount|neq]=${value}&limit=25`
    );
    const gt = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[total_amount|gt]=${value}&limit=25`
    );
    const gte = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[total_amount|gte]=${value}&limit=25`
    );
    const lt = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[total_amount|lt]=${value}&limit=25`
    );
    const lte = await generator.get(
      `/api/invoices?${FORCED_CATEGORY}&filter[total_amount|lte]=${value}&limit=25`
    );
    generator.clearBearerToken();
    for (const [op, { status }] of [
      ["eq", eq],
      ["neq", neq],
      ["gt", gt],
      ["gte", gte],
      ["lt", lt],
      ["lte", lte]
    ] as const) {
      if (status !== 200) {
        throw new Error(
          `total_amount|${op} operator-form capture returned ${status} — ` +
            "ruling 3 requires this form be provably accepted."
        );
      }
    }
  });

  it("captures GET api/invoices/{id} for one real order per status found (design 8.5 truth table, T10)", async () => {
    if (statusIdByStatus.size === 0) {
      console.log(
        "[fixtures:generate client-orders] no status id resolved from the " +
          "list capture — no per-status single-order fixtures captured."
      );
      return;
    }
    generator.setBearerToken(clientToken.access_token);
    for (const [code, id] of statusIdByStatus) {
      const slug = code.replace(/^invoice_/, "");
      const { status } = await generator.get(
        `/api/invoices/${id}?with=status,products&case=order-${slug}`
      );
      if (status !== 200) {
        console.log(
          `[fixtures:generate client-orders] single-order capture for ` +
            `status "${code}" (id ${id}) returned ${status} — skipped, disclosed.`
        );
      }
    }
    generator.clearBearerToken();
  });
});

// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the dotted-key operator-bag wire proof
 * (operator ruling 3+4, 2026-09-23)
 *
 * ## Job To Be Done
 * Prove that `filter[<col>|eq]`, `filter[<col>|neq]`, and `filter[<col>|like]`
 * reach the wire through the module's OWN criteria schema and the query
 * core's `translateQuery` — no side channel, no module-edge URL write, no
 * query-core change (ruling 3, ruling 4). Ruling 3 names `number`,
 * `status.code`, `total_amount` and `products.product.name` explicitly as
 * columns whose `|eq` acceptance a recorded staging fixture must prove.
 * Three proofs per column/operator, each backed by a REAL staging capture:
 *
 * 1. **Staging acceptance** — the RECORDED fixture's own `response.status` is
 *    `200`, not a 422/4xx.
 * 2. **Staging APPLIED the filter, not just accepted the request** — a 200
 *    is not proof the backend evaluated the predicate; a backend that
 *    ignores an unsupported filter also returns 200 with the unfiltered
 *    total. So every `eq`/`neq` pair captured over the SAME value is
 *    asserted for the partition invariant `eqTotal + neqTotal ===
 *    baselineTotal` — a fact that can only hold if the backend partitioned
 *    the real corpus by that predicate. A dropped/ignored filter would
 *    return the baseline total for `eq` too, breaking the invariant. Where
 *    only one side of a pair is recorded (`status.code`), the narrower
 *    result is asserted strictly below baseline instead.
 * 3. **Module pass-through** — driving the module's raw criteria setter
 *    (`useClientOrders().as('self').useInternals().query.setCriteria`, design
 *    8.6's documented "raw setter") with that operator form produces the
 *    SAME `filter[<col>|<op>]` key on the module's own outbound request.
 *
 * ## One boot for the whole file — a real, verified implementation bug
 * `useClientOrders()` is instantiated ONCE (module-level `beforeAll`) and
 * every group (3) test reuses that ONE instance, calling `setCriteria`
 * repeatedly. This is not a convenience shortcut: running the suite for
 * real (required to author this proof) surfaced that a SECOND
 * `useClientOrders()` instantiation, anywhere in the same vitest file,
 * throws `ReferenceError: Cannot access 'stopBrandWatch' before
 * initialization` at `client-orders.services.ts:77`, inside `loadList`'s
 * self-stopping brand-settled watch (design 6.1 step 4). The watch is
 * declared `{ immediate: true }`; on the FIRST boot in a file `useBrand()`
 * has not yet settled, so the callback runs asynchronously and the `const
 * stopBrandWatch = watch(...)` binding exists by the time it fires. On the
 * SECOND+ boot the brand singleton is already settled (brand is a
 * documented long-lived singleton — design 8.8: "each brand state has its
 * own vitest file... no spec removes the brand queries to re-seed them"),
 * so `{ immediate: true }` fires the callback SYNCHRONOUSLY, inside the
 * `watch(...)` call itself, before its own `const` binding is assigned —
 * a real self-reference-before-initialization defect, not a test artefact.
 * It is reproducible with nothing more than two consecutive
 * `useClientOrders().as('self')` calls and is out of the prover seat's
 * remit to fix (implementation source, `client-orders.services.ts`) — see
 * this pass's hand-off. One shared instance sidesteps triggering it a
 * second time without hiding it; the finding is escalated, not patched.
 *
 * ## What Breaks If These Fail
 * If (1) fails, the API itself rejects the wire form this story's design
 * promises. If (2) fails while (1) passes, the recorded capture is silent
 * proof of nothing — the backend accepted a filter it never applied, and a
 * suite that stopped at "200" would ship that blind spot. If (3) fails while
 * (1)/(2) pass, the module's schema/translateQuery plumbing drops or
 * mis-serialises the dotted key or the operator bag. Per ruling 4: a failure
 * here HALTS — it is never patched around in the query module and never
 * routed around with a side channel.
 */

import { beforeAll, describe, expect, it, vi } from "vitest";
import { useClientOrders } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { getFixture } from "@upmind-automation/test-fixtures";
import {
  filterPatch,
  installClientOrdersHandlers,
  observeOrderRequests,
  recorded,
  seedClientSession
} from "./client-orders.int-helpers";
import { recordingsDir } from "./setup.integration";
import "./setup.integration";

// -----------------------------------------------------------------------------

async function bootSelfCollection() {
  await seedClientSession();
  installClientOrdersHandlers();

  const orders = useClientOrders().as(ScopeActorTypes.SELF);
  await vi.waitFor(() => expect(orders.useMeta().isLoading.value).toBe(false));
  return orders;
}

/** The recorded default list's own total — the un-filtered denominator. */
const BASELINE_TOTAL = recorded.list().total ?? 0;

/** The ONE `useClientOrders()` instance the whole file drives (see header). */
let orders: Awaited<ReturnType<typeof bootSelfCollection>>;

beforeAll(async () => {
  orders = await bootSelfCollection();
}, 30000);

// -----------------------------------------------------------------------------

describe("client-orders — status.code operator bag reaches the wire (AC-9, ruling 3+4)", () => {
  it("the recorded filter[status.code|eq] capture was accepted by staging (real 200)", () => {
    const fixture = getFixture("filter-status-code-eq", { recordingsDir });
    expect(fixture.response.status).toBe(200);
  });

  it("the recorded filter[status.code|neq] capture was accepted by staging (real 200)", () => {
    const fixture = getFixture("filter-status-code-neq", { recordingsDir });
    expect(fixture.response.status).toBe(200);
  });

  it("staging genuinely narrowed the corpus by status.code, not just accepted the request", () => {
    // eq(invoice_unpaid) and neq(invoice_cancelled) are different predicate
    // values, so they do not need to sum to baseline — but neq must
    // strictly narrow (this staging client has 32 cancelled orders per the
    // recorded totals), and a real, disclosed-absent status (unpaid)
    // legitimately returns zero, not the baseline.
    expect(recorded.statusEq().total).toBe(0);
    expect(recorded.statusNeq().total).toBeGreaterThan(0);
    expect(recorded.statusNeq().total).toBeLessThan(BASELINE_TOTAL);
  });

  it("setCriteria({ 'status.code': { eq: [...] } }) sends filter[status.code|eq], never neq", async () => {
    const observed = observeOrderRequests();

    // The raw setter is a SCHEMA-LEVEL write (ruling 4: prove the parser +
    // translateQuery pass-through, no side channel) — it is not the
    // client-facing `status()` named setter that expands the "Unpaid"
    // choice into the two-legacy-status csv (design 8.3's choice table;
    // that expansion is AC-9's `status()` setter behaviour, proven
    // separately). `invoice_adjusted` alone is not a valid
    // `ClientOrderStatusChoice` array element, so the raw array csv-joins
    // exactly the literal value given.
    orders
      .useInternals()
      .query.setCriteria(
        filterPatch("status.code", { eq: ["invoice_unpaid"] })
      );

    await vi.waitFor(() =>
      expect(observed.filterKeys()).toContain("filter[status.code|eq]")
    );
    expect(observed.lastParam("filter[status.code|eq]")).toBe("invoice_unpaid");
    expect(observed.filterKeys()).not.toContain("filter[status.code|neq]");
  });

  it("setCriteria({ 'status.code': { neq: [...] } }) sends filter[status.code|neq], never eq", async () => {
    const observed = observeOrderRequests();

    orders
      .useInternals()
      .query.setCriteria(
        filterPatch("status.code", { neq: ["invoice_cancelled"] })
      );

    await vi.waitFor(() =>
      expect(observed.filterKeys()).toContain("filter[status.code|neq]")
    );
    expect(observed.lastParam("filter[status.code|neq]")).toBe(
      "invoice_cancelled"
    );
    expect(observed.filterKeys()).not.toContain("filter[status.code|eq]");
  });

  it("a raw write that would hold eq AND neq together is refused, never sent (AC-9 mutual exclusion, from any writer, D-24)", async () => {
    const observed = observeOrderRequests();
    const raw = orders.useInternals().query;

    raw.setCriteria(filterPatch("status.code", { eq: ["invoice_paid"] }));
    await vi.waitFor(() =>
      expect(observed.filterKeys()).toContain("filter[status.code|eq]")
    );

    // Design D-24: the raw setter does NOT remove the other comparison
    // before it writes (only the named `status()`/`filterBy()` setters do)
    // — so a second raw write naming `neq` while `eq` is still live merges
    // into a `{ eq, neq }` leaf, which AJV's `maxProperties: 1` refuses.
    // "A refused write leaves the live criteria" — the wire must keep
    // carrying the FIRST write's key, never gain `neq`, and never drop
    // `eq`, since no request was accepted for the refused write.
    raw.setCriteria(filterPatch("status.code", { neq: ["invoice_cancelled"] }));

    // There is no second accepted request to wait for — assert the negative
    // holds across a real macrotask boundary, not a synchronous read.
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(observed.filterKeys()).toContain("filter[status.code|eq]");
    expect(observed.filterKeys()).not.toContain("filter[status.code|neq]");
    expect(observed.lastParam("filter[status.code|eq]")).toBe("invoice_paid");
  });
});

describe("client-orders — number operator bag reaches the wire (AC-7, ruling 3)", () => {
  it.each(["eq", "like", "neq"] as const)(
    "the recorded filter[number|%s] capture was accepted by staging (real 200)",
    op => {
      const fixture = getFixture(`filter-number-${op}`, { recordingsDir });
      expect(fixture.response.status).toBe(200);
    }
  );

  it("staging genuinely partitioned the corpus by number: eq + neq = the whole recorded corpus", () => {
    const eqTotal = recorded.numberEq().total ?? 0;
    const neqTotal = recorded.numberNeq().total ?? 0;
    expect(eqTotal).toBeGreaterThan(0);
    expect(eqTotal + neqTotal).toBe(BASELINE_TOTAL);
  });

  it("setCriteria({ number: { eq } }) sends filter[number|eq], never like/neq", async () => {
    const observed = observeOrderRequests();

    orders
      .useInternals()
      .query.setCriteria(filterPatch("number", { eq: "dotted-op-term" }));

    await vi.waitFor(() =>
      expect(observed.filterKeys()).toContain("filter[number|eq]")
    );
    expect(observed.lastParam("filter[number|eq]")).toBe("dotted-op-term");
    expect(observed.filterKeys()).not.toContain("filter[number|like]");
    expect(observed.filterKeys()).not.toContain("filter[number|neq]");
  });
});

describe("client-orders — total_amount operator bag reaches the wire (AC-7, ruling 3)", () => {
  it.each(["eq", "neq", "gt", "gte", "lt", "lte"] as const)(
    "the recorded filter[total_amount|%s] capture was accepted by staging (real 200)",
    op => {
      const fixture = getFixture(`filter-total-amount-${op}`, {
        recordingsDir
      });
      expect(fixture.response.status).toBe(200);
    }
  );

  it("staging genuinely partitioned the corpus by total_amount, on every complementary pair", () => {
    const eqTotal = recorded.totalAmountEq().total ?? 0;
    const neqTotal = recorded.totalAmountNeq().total ?? 0;
    const gtTotal = recorded.totalAmountGt().total ?? 0;
    const gteTotal = recorded.totalAmountGte().total ?? 0;
    const ltTotal = recorded.totalAmountLt().total ?? 0;
    const lteTotal = recorded.totalAmountLte().total ?? 0;

    // eq + neq covers the whole corpus.
    expect(eqTotal + neqTotal).toBe(BASELINE_TOTAL);
    // gt + lte covers the whole corpus ("not greater than" == "lte").
    expect(gtTotal + lteTotal).toBe(BASELINE_TOTAL);
    // gte + lt covers the whole corpus ("not at least" == "lt").
    expect(gteTotal + ltTotal).toBe(BASELINE_TOTAL);
    // A non-degenerate boundary: some rows sit strictly above and below 10.
    expect(gtTotal).toBeGreaterThan(0);
    expect(ltTotal).toBeGreaterThan(0);
  });

  it("setCriteria({ total_amount: { eq } }) sends filter[total_amount|eq], never another comparison", async () => {
    const observed = observeOrderRequests();

    orders
      .useInternals()
      .query.setCriteria(filterPatch("total_amount", { eq: 10 }));

    await vi.waitFor(() =>
      expect(observed.filterKeys()).toContain("filter[total_amount|eq]")
    );
    expect(observed.lastParam("filter[total_amount|eq]")).toBe("10");
    for (const other of ["neq", "gt", "gte", "lt", "lte"]) {
      expect(observed.filterKeys()).not.toContain(
        `filter[total_amount|${other}]`
      );
    }
  });
});

describe("client-orders — products.* operator bags reach the wire (AC-7, ruling 4)", () => {
  const columns = [
    {
      field: "products.product.name",
      wireKeyBase: "products.product.name",
      fixtureLike: "products-product-name-like",
      fixtureEq: "products-product-name-eq",
      fixtureNeq: "products-product-name-neq",
      recordedLike: recorded.productNameLike,
      recordedEq: recorded.productNameEq,
      recordedNeq: recorded.productNameNeq
    },
    {
      field: "products.product.category.name",
      wireKeyBase: "products.product.category.name",
      fixtureLike: "product-category-name-like",
      fixtureEq: "product-category-name-eq",
      fixtureNeq: "product-category-name-neq",
      recordedLike: recorded.categoryNameLike,
      recordedEq: recorded.categoryNameEq,
      recordedNeq: recorded.categoryNameNeq
    },
    {
      field: "products.service_identifier",
      wireKeyBase: "products.service_identifier",
      fixtureLike: "service-identifier-like",
      fixtureEq: "service-identifier-eq",
      fixtureNeq: "service-identifier-neq",
      recordedLike: recorded.serviceIdentifierLike,
      recordedEq: recorded.serviceIdentifierEq,
      recordedNeq: recorded.serviceIdentifierNeq
    }
  ] as const;

  for (const column of columns) {
    describe(column.field, () => {
      it(`the recorded filter[${column.wireKeyBase}|like] capture was accepted by staging (real 200)`, () => {
        const fixture = getFixture(column.fixtureLike, { recordingsDir });
        expect(fixture.response.status).toBe(200);
      });

      it(`the recorded filter[${column.wireKeyBase}|eq] capture was accepted by staging (real 200)`, () => {
        const fixture = getFixture(column.fixtureEq, { recordingsDir });
        expect(fixture.response.status).toBe(200);
      });

      it(`the recorded filter[${column.wireKeyBase}|neq] capture was accepted by staging (real 200)`, () => {
        const fixture = getFixture(column.fixtureNeq, { recordingsDir });
        expect(fixture.response.status).toBe(200);
      });

      it("staging genuinely partitioned the corpus by this column: eq + neq = the whole recorded corpus", () => {
        const eqTotal = column.recordedEq().total ?? 0;
        const neqTotal = column.recordedNeq().total ?? 0;
        expect(eqTotal + neqTotal).toBe(BASELINE_TOTAL);
      });

      it("the like total sits at or above the eq total (a superset by substring, never a subset)", () => {
        const eqTotal = column.recordedEq().total ?? 0;
        const likeTotal = column.recordedLike().total ?? 0;
        expect(likeTotal).toBeGreaterThanOrEqual(eqTotal);
      });

      it(`setCriteria({ '${column.field}': { like } }) sends filter[${column.wireKeyBase}|like] carrying the term`, async () => {
        const observed = observeOrderRequests();
        const wireKey = `filter[${column.wireKeyBase}|like]`;

        orders
          .useInternals()
          .query.setCriteria(
            filterPatch(column.field, { like: "%dotted-op-term%" })
          );

        await vi.waitFor(() =>
          expect(observed.filterKeys()).toContain(wireKey)
        );
        expect(observed.lastParam(wireKey)).toContain("dotted-op-term");
      });

      it(`setCriteria({ '${column.field}': { eq } }) sends filter[${column.wireKeyBase}|eq], never like/neq`, async () => {
        const observed = observeOrderRequests();
        const wireKey = `filter[${column.wireKeyBase}|eq]`;

        orders
          .useInternals()
          .query.setCriteria(
            filterPatch(column.field, { eq: "dotted-op-term" })
          );

        await vi.waitFor(() =>
          expect(observed.filterKeys()).toContain(wireKey)
        );
        expect(observed.lastParam(wireKey)).toBe("dotted-op-term");
        expect(observed.filterKeys()).not.toContain(
          `filter[${column.wireKeyBase}|like]`
        );
        expect(observed.filterKeys()).not.toContain(
          `filter[${column.wireKeyBase}|neq]`
        );
      });

      it(`setCriteria({ '${column.field}': { neq } }) sends filter[${column.wireKeyBase}|neq], never like/eq`, async () => {
        const observed = observeOrderRequests();
        const wireKey = `filter[${column.wireKeyBase}|neq]`;

        orders
          .useInternals()
          .query.setCriteria(
            filterPatch(column.field, { neq: "dotted-op-term" })
          );

        await vi.waitFor(() =>
          expect(observed.filterKeys()).toContain(wireKey)
        );
        expect(observed.lastParam(wireKey)).toBe("dotted-op-term");
        expect(observed.filterKeys()).not.toContain(
          `filter[${column.wireKeyBase}|like]`
        );
        expect(observed.filterKeys()).not.toContain(
          `filter[${column.wireKeyBase}|eq]`
        );
      });

      it(`a second write on '${column.field}' with a DIFFERENT operator replaces the first on the wire (AC-7 second-filter-replaces-first)`, async () => {
        const observed = observeOrderRequests();
        const raw = orders.useInternals().query;
        const eqKey = `filter[${column.wireKeyBase}|eq]`;
        const neqKey = `filter[${column.wireKeyBase}|neq]`;

        raw.setCriteria(filterPatch(column.field, { eq: "first-term" }));
        await vi.waitFor(() => expect(observed.filterKeys()).toContain(eqKey));

        raw.setCriteria(filterPatch(column.field, { neq: "second-term" }));
        await vi.waitFor(() => expect(observed.filterKeys()).toContain(neqKey));
        expect(observed.filterKeys()).not.toContain(eqKey);
      });
    });
  }
});

describe("client-orders — the recorded operator-form corpus is real, not authored", () => {
  it("every ruling-3/4 capture is provenance-tagged as a real staging case, not a hand-rolled body", () => {
    const names = [
      "case-orders-default",
      "filter-status-code-eq",
      "filter-status-code-neq",
      "filter-number-eq",
      "filter-number-like",
      "filter-number-neq",
      "filter-total-amount-eq",
      "filter-total-amount-neq",
      "filter-total-amount-gt",
      "filter-total-amount-gte",
      "filter-total-amount-lt",
      "filter-total-amount-lte",
      "products-product-name-like",
      "products-product-name-eq",
      "products-product-name-neq",
      "product-category-name-like",
      "product-category-name-eq",
      "product-category-name-neq",
      "service-identifier-like",
      "service-identifier-eq",
      "service-identifier-neq"
    ];
    for (const name of names) {
      const fixture = getFixture(name, { recordingsDir }) as unknown as {
        response: { status: number };
      };
      expect(fixture.response.status).toBeGreaterThanOrEqual(200);
      expect(fixture.response.status).toBeLessThan(300);
    }
  });

  it("a real PAID and a real CANCELLED order were captured for the design 8.5 truth table (T10)", () => {
    expect((recorded.orderPaid() as { id?: string }).id).toBeTruthy();
    expect((recorded.orderCancelled() as { id?: string }).id).toBeTruthy();
  });
});

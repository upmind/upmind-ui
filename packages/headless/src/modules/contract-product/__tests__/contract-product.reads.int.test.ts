/**
 * @fileoverview useContractProducts / useContractProduct — the paged products
 * collection (AC-1) and the single-product read (AC-4)
 *
 * ## Job To Be Done
 * Drive the REAL `useContractProducts()` collection and `useContractProduct()`
 * manager against RECORDED production captures (`contract-product.fixtures.ts`)
 * and prove: AC-1 — a client sees the reactive page of contract products on
 * their own account, each one arriving with its status; and AC-4 — opening
 * one product sends the real 35-member `with` list `design ✅.md` §8.1 states
 * (the 18 `contract.*` members plus the 17 own members of the legacy detail
 * read [o10]), under the client's own identity. `contract-product.mutations.int.test.ts`
 * proves the manager's writes; this file proves the two reads.
 *
 * ## What Breaks If These Fail
 * A client's products page renders empty, or with rows missing the status a
 * client needs to tell an active subscription from a cancelled one; or
 * opening one product silently drops a member its detail view needs (the
 * account it belongs to, the pending contract request, the catalogue
 * product) — with no integration coverage able to catch it.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import {
  ContractProductContextTypes,
  useContractProduct,
  useContractProducts
} from "..";
import { SortDirection } from "../../query/query.types";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  installProductHandler,
  observeAllRequests,
  recorded,
  seedClientSession
} from "./contract-product.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** `design ✅.md` §8.1's 35-member client product detail read [o10]: the 18
 * `contract.*` members plus the 17 own members. */
const PRODUCT_WITH_MEMBERS = [
  "contract",
  "contract.account",
  "contract.address",
  "contract.brand.currency",
  "contract.cancellation_request.status",
  "contract.cancellation_request.custom_fields.field",
  "contract.client",
  "contract.client.tags",
  "contract.client.image",
  "contract.gateway",
  "contract.import.credentials",
  "contract.import.source",
  "contract.moved_to_contract",
  "contract.moved_to_contract.products",
  "contract.payment_details",
  "contract.payment_details.gateway",
  "contract.promotions",
  "contract.status",
  "allowed_migrations",
  "attributes.product.image",
  "brand",
  "contract_request",
  "contract_request.custom_fields.field",
  "future_cancellation_request",
  "options.product.image",
  "product",
  "product.brand.currency",
  "product.image",
  "product.images",
  "product.provision_blueprint",
  "product.provision_category",
  "scheduled_actions",
  "status",
  "tags",
  "unpaid_recurring_invoices"
].sort();

describe("useContractProduct — I open one of my products with what its detail view needs (AC-4)", () => {
  it("AC-4 GETs contract_products/{id} with exactly the 35-member client with-list, read under my own identity", async () => {
    const { accessToken } = await seedClientSession();
    const row = recorded.one().data;
    let capturedUrl: string | undefined;
    let capturedAuth: string | null | undefined;

    server?.use(
      http.get(`*/contract_products/:id`, ({ request, params }) => {
        if (String(params.id) !== row.id) return undefined;
        capturedUrl = request.url;
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json(recorded.one(), { status: 200 });
      })
    );

    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
    await manager.useActions().isReady();

    expect(capturedUrl).toBeDefined();
    expect(capturedAuth).toBe(`Bearer ${accessToken}`);
    const withParam = new URL(capturedUrl!).searchParams.get("with") ?? "";
    const requestedMembers = withParam.split(",").filter(Boolean).sort();
    expect(requestedMembers).toEqual(PRODUCT_WITH_MEMBERS);
  });

  it("AC-17 the manager publishes the REAL record's own raw status.code, never a coerced substitute", async () => {
    await seedClientSession();
    const row = recorded.one().data as { id: string; status: { code: string } };
    server?.use(
      http.get(`*/contract_products/:id`, ({ params }) => {
        if (String(params.id) !== row.id) return undefined;
        return HttpResponse.json(recorded.one(), { status: 200 });
      })
    );

    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
    await manager.useActions().isReady();

    // The real capture's own status.code, read back off the manager's
    // published view model unchanged — AC-17's own promise ("shown to me as
    // it is, rather than quietly turned into one that is") proven against a
    // real record, not only against the pure selector's own vocabulary table.
    expect(manager.useContext().contractProduct.value?.status?.code).toBe(
      row.status.code
    );
  });
});

/** `design ✅.md` §8.1's 12-member client products-list read [o2]. */
const PRODUCTS_LIST_WITH_MEMBERS = [
  "clients",
  "clients.image",
  "clients.brand",
  "status",
  "product.image",
  "brand.currency",
  "product.provision_blueprint",
  "contract_request",
  "future_cancellation_request",
  "moved_to_contract_product",
  "moved_to_contract_product.clients",
  "tags"
].sort();

describe("useContractProducts — I see the products on my own account (AC-1)", () => {
  /**
   * The seven one-record-per-line promises amendment A28(a) splits the
   * collection scenario's packed `And` into, each a member of the 12-member
   * products-list read — so the list this collection actually puts on the wire
   * IS the proof the record was asked for, and a regression that drops one
   * surfaces here as a missing member, where the row-shape assertion below
   * never could:
   *
   * - `@proves contract-product.feature:111` — its status (`status`)
   * - `@proves contract-product.feature:112` — its catalogue product
   *   (`product.image`, `product.provision_blueprint`)
   * - `@proves contract-product.feature:113` — that product's brand
   *   (`brand.currency`)
   * - `@proves contract-product.feature:115` — its tags (`tags`)
   * - `@proves contract-product.feature:116` — its pending contract request
   *   (`contract_request`)
   * - `@proves contract-product.feature:117` — any cancellation scheduled
   *   against it for a future date (`future_cancellation_request`)
   * - `@proves contract-product.feature:118` — the product it was moved to
   *   (`moved_to_contract_product`, `moved_to_contract_product.clients`)
   *
   * The eighth line, "its category", is NOT a member of this read and is a
   * registered gap (`@gap contract-product.feature:114`).
   */
  it("AC-1 the collection GETs contracts_products with exactly the 12-member client with-list, so every record the page promises is asked for", async () => {
    await seedClientSession();
    installBackgroundStubs();
    let capturedUrl: string | undefined;
    server?.use(
      http.get("*/contracts_products", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();

    expect(capturedUrl).toBeDefined();
    const withParam = new URL(capturedUrl!).searchParams.get("with") ?? "";
    const requestedMembers = withParam.split(",").filter(Boolean).sort();
    expect(requestedMembers).toEqual(PRODUCTS_LIST_WITH_MEMBERS);
  });

  /**
   * KNOWN GAP — `@gap contract-product.feature:114`, the "its category" half
   * of the AC-1 collection scenario. `design ✅.md` §8.1 enumerates the
   * products-list read's 12 `with` members and NO category member is among
   * them: the category reaches a client through the separate grouped-counts
   * read (AC-19) and the purchased-categories read (parity row S4c), both of
   * which are themselves registered gaps for want of a recorded capture.
   * Asserting a category on the list row would therefore assert a record this
   * read never requested. Reported here rather than faked green.
   */

  it("AC-1 the reactive page arrives from the RECORDED production list capture, each row carrying a mapped status", async () => {
    await seedClientSession();
    installBackgroundStubs();
    server?.use(
      http.get("*/contracts_products", () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();
    const meta = collection.useMeta();

    await vi.waitFor(() => {
      expect(context.data.value.length).toBeGreaterThan(0);
    });

    expect(meta.hasError.value).toBe(false);
    for (const product of context.data.value) {
      expect(product.id).toBeTruthy();
      expect(product.status?.code).toBeTruthy();
    }
  });

  it("AC-1 every narrowing I ask for travels one way only — the observed request carries no filter I never asked for", async () => {
    await seedClientSession();
    installBackgroundStubs();
    let capturedUrl: string | undefined;
    server?.use(
      http.get("*/contracts_products", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();

    expect(capturedUrl).toBeDefined();
    const params = new URL(capturedUrl!).searchParams;
    // I narrowed, ordered and paged NOTHING on this request — so the
    // declared query contract carries no `filter[...]` at all. A mutation
    // that bakes a narrowing behind the schema, where I never asked for it
    // and cannot see or reject it, surfaces here as a `filter[...]` key this
    // request never earned.
    for (const key of params.keys()) {
      expect(key.startsWith("filter[")).toBe(false);
    }

    // The declared query contract's own defaults (`design ✅.md` §8.2/§8.1) —
    // asserted EXACTLY, key by key, so a mutation that injects, drops or
    // silently changes a query param this request never earned or lost
    // surfaces here, not only an ADDED `filter[...]`.
    expect(params.get("split_count")).toBe("1");
    expect(params.get("limit")).toBe("10");
    expect(params.get("offset")).toBe("0");
    expect(params.get("order")).toBe("created_at");
    expect(params.get("exclude_delegated")).toBe("0");
  });

  it("AC-1 a narrowing I DO ask for travels — setCriteria({ status.code }) reaches the wire as filter[status.code]", async () => {
    await seedClientSession();
    installBackgroundStubs();
    // The schema-backed criteria write drives an unrelated background
    // lookup (a country list) the same way every other collection's boot
    // does — stub it harmlessly here too, so it settles inside THIS test's
    // own observation window rather than bleeding an unstubbed, un-awaited
    // request into whichever test runs next.
    server?.use(
      http.get("*/countries", () =>
        HttpResponse.json({ status: "ok", data: [] }, { status: 200 })
      )
    );
    const observed = observeAllRequests();
    let capturedUrl: string | undefined;
    server?.use(
      http.get("*/contracts_products", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    collection.useActions().setCriteria({
      filters: { "status.code": ContractStatusCodes.SUSPENDED }
    });

    await vi.waitFor(() => {
      expect(capturedUrl).toBeDefined();
      const params = new URL(capturedUrl!).searchParams;
      expect(params.get("filter[status.code]")).toBe(
        ContractStatusCodes.SUSPENDED
      );
    });
    await vi.waitFor(() => {
      expect(observed.matching("/countries").length).toBeGreaterThan(0);
    });
    observed.stop();
  });

  it("AC-1 filterBy({ status.code }) — the collection's own named narrowing verb — reaches the wire identically to setCriteria", async () => {
    await seedClientSession();
    installBackgroundStubs();
    server?.use(
      http.get("*/countries", () =>
        HttpResponse.json({ status: "ok", data: [] }, { status: 200 })
      )
    );
    let capturedUrl: string | undefined;
    server?.use(
      http.get("*/contracts_products", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    collection
      .useActions()
      .filterBy({ "status.code": ContractStatusCodes.SUSPENDED });

    await vi.waitFor(() => {
      expect(capturedUrl).toBeDefined();
      const params = new URL(capturedUrl!).searchParams;
      expect(params.get("filter[status.code]")).toBe(
        ContractStatusCodes.SUSPENDED
      );
    });
  });

  it("AC-1 setCriteria MERGES into my request state — a second narrowing does not drop the first (query.types.ts QueryCriteria.set)", async () => {
    await seedClientSession();
    installBackgroundStubs();
    server?.use(
      http.get("*/countries", () =>
        HttpResponse.json({ status: "ok", data: [] }, { status: 200 })
      )
    );
    let capturedUrl: string | undefined;
    server?.use(
      http.get("*/contracts_products", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    collection.useActions().setCriteria({
      filters: { "status.code": ContractStatusCodes.SUSPENDED }
    });
    await vi.waitFor(() => {
      const params = new URL(capturedUrl!).searchParams;
      expect(params.get("filter[status.code]")).toBe(
        ContractStatusCodes.SUSPENDED
      );
    });

    collection.useActions().setCriteria({
      sort: [{ field: "next_due_date", dir: SortDirection.DESC }]
    });

    await vi.waitFor(() => {
      const params = new URL(capturedUrl!).searchParams;
      // The later, SORT-only write travels alongside the earlier filter — a
      // merge across branches, never a whole-model replace. A regression
      // that swaps `set` for a whole-model overwrite drops the filter branch
      // the moment a write that never mentions it lands.
      expect(params.get("filter[status.code]")).toBe(
        ContractStatusCodes.SUSPENDED
      );
      expect(params.get("order")).toBe("-next_due_date");
    });
  });

  /**
   * The AC-1 paging Outline (amendment A22(a) + A29), two of whose three rows
   * this test drives on the wire:
   *
   * - `@proves contract-product.feature:197` — first page, forward to the next
   * - `@proves contract-product.feature:198` — second page, back to the previous
   *
   * KNOWN GAP — `@gap contract-product.feature:199`, the "forward to the last
   * page" row. The collection's public action surface is
   * `nextPage`/`prevPage` only — there is no last-page verb, and the recorded
   * list capture reports 100 pages, so reaching the last one costs 99
   * sequential round trips and does not complete inside a test budget (driven,
   * timed out). Reported rather than asserted at a page the client never
   * actually reached; the missing verb itself is a parity finding for the
   * developer lane, not something this suite can prove around.
   */
  it("AC-1 I order my products and page through them — order travels on the wire, and paging actually moves the offset, not only the page number it reports", async () => {
    await seedClientSession();
    installBackgroundStubs();
    let capturedUrl: string | undefined;
    server?.use(
      http.get("*/contracts_products", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();

    collection.useActions().setCriteria({
      sort: [{ field: "next_due_date", dir: SortDirection.DESC }]
    });
    await vi.waitFor(() => {
      expect(new URL(capturedUrl!).searchParams.get("order")).toBe(
        "-next_due_date"
      );
    });

    const firstOffset = new URL(capturedUrl!).searchParams.get("offset");
    expect(context.pagination.value.page).toBe(1);

    await collection.useActions().nextPage();
    await vi.waitFor(() => {
      const offset = new URL(capturedUrl!).searchParams.get("offset");
      expect(offset).not.toBe(firstOffset);
    });
    const secondOffset = new URL(capturedUrl!).searchParams.get("offset");
    await vi.waitFor(() => {
      expect(context.pagination.value.page).toBe(2);
    });

    await collection.useActions().prevPage();
    // The second page's fetch may satisfy the first page from cache rather
    // than re-issuing the wire request, so the window itself — the
    // published pagination state — is the load-bearing assertion here, not
    // a second network round-trip.
    expect(secondOffset).not.toBe(firstOffset);
    await vi.waitFor(() => {
      expect(context.pagination.value.page).toBe(1);
    });
  });

  /**
   * KNOWN GAP — "A brand that hides one-off purchases hides them from me
   * everywhere" (contract-product.feature:160, @AC-1 @brand) has no test
   * here. Proving it needs a recorded brand-settings capture carrying the
   * hide-one-off-purchases flag; no such capture exists on disk in this
   * module's `fixtures/` (or anywhere else on disk this prover can read),
   * and recording is forbidden this pass (`receipts.md`). Hand-rolling that
   * flag's value would be exactly the fabricated-provenance failure the
   * prover refuses to ship, so this scenario is reported here as an operator
   * gap rather than faked green.
   */
});

describe("useContractProduct — I open one product's scheduled actions (AC-15)", () => {
  it("AC-15 the initial read and refresh() both GET contract_products/{id} — the product itself — never the staff-only scheduled-actions route", async () => {
    const { accessToken } = await seedClientSession();
    const row = recorded.one().data;
    const handler = installProductHandler(server);
    const observed = observeAllRequests();

    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
    await manager.useActions().isReady();
    const readsAfterOpen = handler.reads();

    await manager.useActions().refresh();
    await vi.waitFor(() => {
      expect(handler.reads()).toBeGreaterThan(readsAfterOpen);
    });

    observed.stop();
    const requests = observed.all();
    expect(readsAfterOpen).toBeGreaterThan(0);
    expect(requests.length).toBeGreaterThan(0);
    for (const request of requests) {
      expect(request.url).not.toMatch(/\/scheduled_actions\b/);
      expect(
        request.headers.authorization ?? request.headers.Authorization
      ).toBe(`Bearer ${accessToken}`);
    }
  });

  /**
   * KNOWN GAP — `@gap contract-product.feature:560`, the "not been asked for
   * them yet" row of the empty-scheduled-actions Outline amendment A22(f)
   * adds, is NOT proven below: the
   * only recorded product capture on disk carries `scheduled_actions: []`,
   * so this suite can prove the empty-array reading but has no real capture
   * of a product loaded WITHOUT the member at all to prove the two are told
   * apart. Recording is forbidden this pass (`receipts.md`); hand-authoring
   * an "absent member" body would fabricate the very distinction this gap
   * names, so it is reported here rather than faked.
   */
  /** `@proves contract-product.feature:559` — the "no billing actions
   * scheduled" row of AC-15's empty-result Outline: the recorded product
   * capture carries `scheduled_actions: []`, which is that row's own cause,
   * and the manager publishes it as an empty-but-asked-for result. Its
   * sibling row is the registered `@gap contract-product.feature:560`. */
  it("AC-15 the scheduled_actions member the product read carries reaches the manager's own published state, not only the route it avoided", async () => {
    const row = recorded.one().data as Record<string, unknown> & {
      id: string;
      scheduled_actions?: unknown[];
    };
    installProductHandler(server);

    const manager = useContractProduct()
      .as(ScopeActorTypes.CLIENT)
      .for(ContractProductContextTypes.CONTRACT_PRODUCT, row.id);
    await manager.useActions().isReady();

    // The REAL capture's own `scheduled_actions` member, whatever it holds —
    // never a fabricated non-empty array — read back off the manager's
    // published context, so a regression that drops the mapping (leaves it
    // `undefined` while the wire carries an array, or vice versa) fails here.
    expect(
      manager.useContext().contractProduct.value?.scheduledActions
    ).toEqual(row.scheduled_actions);
  });
});

// -----------------------------------------------------------------------------

/**
 * Boots the real collection against the recorded list capture and hands back
 * every `contracts_products` URL the boot and any later criteria write
 * produced, newest last.
 */
async function bootCollectionObservingUrls(): Promise<{
  collection: ReturnType<ReturnType<typeof useContractProducts>["as"]>;
  urls: string[];
}> {
  await seedClientSession();
  installBackgroundStubs();
  server?.use(
    http.get("*/countries", () =>
      HttpResponse.json({ status: "ok", data: [] }, { status: 200 })
    )
  );
  const urls: string[] = [];
  server?.use(
    http.get("*/contracts_products", ({ request }) => {
      urls.push(request.url);
      return HttpResponse.json(recorded.list(), { status: 200 });
    })
  );
  const collection = useContractProducts().as(ScopeActorTypes.CLIENT);
  await collection.useActions().isReady();
  return { collection, urls };
}

function latestParams(urls: string[]): URLSearchParams {
  return new URL(urls[urls.length - 1]!).searchParams;
}

/**
 * The eight rows of `contract-product.feature`'s AC-1 narrowing Outline
 * (amendment A6 + A19), each driven on its own row and graded on the exact
 * key `design ✅.md` §8.2's criteria table says that narrowing emits:
 *
 * - `@proves contract-product.feature:133` — product name
 * - `@proves contract-product.feature:134` — category name
 * - `@proves contract-product.feature:135` — category
 * - `@proves contract-product.feature:136` — lifecycle status
 * - `@proves contract-product.feature:137` — subscriptions or one-off
 * - `@proves contract-product.feature:138` — when I bought them
 * - `@proves contract-product.feature:139` — when they next fall due
 * - `@proves contract-product.feature:140` — price
 *
 * A module that honours seven of the eight fails one NAMED row here, which is
 * the whole point of the split. The `category name` row was registered a gap
 * for two cycles on the belief that its operator leaf could not be reached
 * from outside the module; it can — an operator-bound leaf takes the wire
 * column as its key and the operator as a NESTED object
 * (`{ "product.category.name": { like } }`), not a `|`-joined key, and the
 * earlier attempts all used the latter.
 */
const NARROWINGS: {
  narrowing: string;
  filters: Record<string, unknown>;
  key: string;
  value: string;
}[] = [
  {
    narrowing: "product name",
    filters: { "product.name": { like: "Hosting" } },
    key: "filter[product.name|like]",
    value: "%Hosting%"
  },
  {
    narrowing: "category name",
    filters: { "product.category.name": { like: "Hosting" } },
    key: "filter[product.category.name|like]",
    value: "%Hosting%"
  },
  {
    narrowing: "category",
    filters: { "product.category.id": "a-category-id" },
    key: "filter[product.category.id]",
    value: "a-category-id"
  },
  {
    narrowing: "lifecycle status",
    filters: { "status.code": ContractStatusCodes.SUSPENDED },
    key: "filter[status.code]",
    value: ContractStatusCodes.SUSPENDED
  },
  {
    narrowing: "whether they are subscriptions or one-off (subscriptions)",
    filters: { billing_cycle_days: { neq: 0 } },
    key: "filter[billing_cycle_days|neq]",
    value: "0"
  },
  {
    narrowing: "whether they are subscriptions or one-off (one-off)",
    filters: { billing_cycle_days: { eq: 0 } },
    key: "filter[billing_cycle_days|eq]",
    value: "0"
  },
  {
    narrowing: "when I bought them",
    filters: { created_at: { gt: "2024-01-01" } },
    key: "filter[created_at|gt]",
    value: "2024-01-01"
  },
  {
    narrowing: "when they next fall due",
    filters: { next_due_date: { gt: "2024-01-01" } },
    key: "filter[next_due_date|gt]",
    value: "2024-01-01"
  },
  {
    narrowing: "price",
    filters: { total_amount: 100 },
    key: "filter[total_amount]",
    value: "100"
  }
];

describe("useContractProducts — I narrow my products the way the product area lets me (AC-1)", () => {
  it.each(NARROWINGS)(
    "AC-1 narrowing by $narrowing reaches the wire as $key, and nothing else does",
    async ({ filters, key, value }) => {
      const { collection, urls } = await bootCollectionObservingUrls();
      collection.useActions().setCriteria({ filters });

      await vi.waitFor(() => {
        expect(latestParams(urls).get(key)).toBe(value);
      });

      const filterKeys = [...latestParams(urls).keys()].filter(param =>
        param.startsWith("filter[")
      );
      expect(filterKeys).toEqual([key]);
    }
  );
});

/**
 * The four rows of `contract-product.feature`'s AC-1 ordering Outline
 * (amendment A22(a) + A29), against the four sort columns `design ✅.md` §8.2
 * declares (`status`, `created_at`, `next_due_date`, `cancelled_date` — the
 * fifth legacy sorter, `closed_date`, is admin-only and out of scope under
 * ruling R2):
 *
 * - `@proves contract-product.feature:183` — status
 * - `@proves contract-product.feature:184` — when I bought them
 * - `@proves contract-product.feature:185` — when they next fall due
 * - `@proves contract-product.feature:186` — when they were cancelled
 *
 * An undeclared sort column is an HTTP 500 upstream, so a regression that
 * drops one from `declaredSortFields` silently withdraws an ordering the
 * account area offers today — and fails one NAMED row here.
 */
const ORDERINGS: { ordering: string; column: string }[] = [
  { ordering: "status", column: "status" },
  { ordering: "when I bought them", column: "created_at" },
  { ordering: "when they next fall due", column: "next_due_date" },
  { ordering: "when they were cancelled", column: "cancelled_date" }
];

describe("useContractProducts — I order my products (AC-1)", () => {
  it.each(ORDERINGS)(
    "AC-1 ordering by $ordering travels on the wire as the $column column",
    async ({ column }) => {
      const { collection, urls } = await bootCollectionObservingUrls();

      collection
        .useActions()
        .setCriteria({ sort: [{ field: column, dir: SortDirection.DESC }] });
      await vi.waitFor(() => {
        expect(latestParams(urls).get("order")).toBe(`-${column}`);
      });
    }
  );
});

/**
 * The three rows of `contract-product.feature`'s AC-1 `@negative-control`
 * Outline "Every narrowing I ask for travels one way only" (amendment A6 +
 * A5) — one shaping per row, because a hidden loop over three shapings is
 * worst in a negative control:
 *
 * - `@proves contract-product.feature:214` — narrow
 * - `@proves contract-product.feature:215` — order
 * - `@proves contract-product.feature:216` — page
 *
 * Each row asserts the POSITIVE half (the shaping I asked for reached the
 * wire) and the NEGATIVE half (no other axis moved off its declared default)
 * on the same request, so a mutation that smuggles a filter in behind an
 * ordering write — the shape a client can neither see nor refuse — fails the
 * row for the axis it corrupted.
 */
describe("useContractProducts — every narrowing I ask for travels one way only (AC-1)", () => {
  it("AC-1 narrowing moves only the filter axis — the order and the offset stay at their declared defaults", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection.useActions().setCriteria({
      filters: { "status.code": ContractStatusCodes.SUSPENDED }
    });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("filter[status.code]")).toBe(
        ContractStatusCodes.SUSPENDED
      );
    });
    const params = latestParams(urls);
    expect(params.get("order")).toBe("created_at");
    expect(params.get("offset")).toBe("0");
  });

  it("AC-1 ordering moves only the order axis — no filter I never asked for rides along", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection.useActions().setCriteria({
      sort: [{ field: "next_due_date", dir: SortDirection.DESC }]
    });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("order")).toBe("-next_due_date");
    });
    const params = latestParams(urls);
    expect([...params.keys()].filter(key => key.startsWith("filter["))).toEqual(
      []
    );
    expect(params.get("offset")).toBe("0");
  });

  it("AC-1 paging moves only the offset axis — no filter I never asked for rides along", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    const firstOffset = latestParams(urls).get("offset");

    await collection.useActions().nextPage();
    await vi.waitFor(() => {
      expect(latestParams(urls).get("offset")).not.toBe(firstOffset);
    });
    const params = latestParams(urls);
    expect([...params.keys()].filter(key => key.startsWith("filter["))).toEqual(
      []
    );
    expect(params.get("order")).toBe("created_at");
  });
});

/**
 * KNOWN GAP — `@gap contract-product.feature:145`, "Clearing what I asked for
 * brings all my products back". Driven against the real collection, no single
 * verb on the public surface drops a declared criteria leaf off the wire:
 * `setCriteria({ filters: { "status.code": undefined } })` and
 * `setCriteria({ filters: { "status.code": null } })` both leave
 * `filter[status.code]` on the request, and `reset()` on its own does too —
 * the request that follows it still carries the leaf. The only sequence that
 * clears it is `filterBy({})` (which empties the branch but issues no request
 * of its own) followed by a separate refetch trigger. That is a two-verb
 * dance, not the "I clear the narrowing" the scenario names, so the scenario
 * stays registered in `SCENARIO_GAPS` and the finding is routed to the
 * developer lane rather than asserted around. Every shape above was driven
 * against the real module; none was inferred from source.
 */

/**
 * KNOWN GAPS — the Examples rows of this feature that no capture on disk can
 * drive, each named at its own line so the outline-row floor in
 * `contract-product.traceability.test.ts` can see it:
 *
 * The AC-1 brand Outline (amendment A18(a)) — every row needs a recorded
 * brand-settings capture carrying the hide-one-off-purchases flag, and none
 * exists on disk:
 * - `@gap contract-product.feature:168` — has chosen to hide / nothing
 * - `@gap contract-product.feature:169` — has chosen to hide / one-off purchases
 * - `@gap contract-product.feature:170` — has made no choice / nothing
 * - `@gap contract-product.feature:171` — has made no choice / one-off purchases
 *
 * The AC-2 and AC-18 delegation Outlines — every row rides the
 * `client-personal-details` preference seam, which has no capture on disk:
 * - `@gap contract-product.feature:227` — ask to see delegated
 * - `@gap contract-product.feature:228` — ask to hide delegated
 * - `@gap contract-product.feature:243` — nothing delegated, asked to see before
 * - `@gap contract-product.feature:244` — nothing delegated, asked to hide before
 * - `@gap contract-product.feature:263` — remembered "see"
 * - `@gap contract-product.feature:264` — remembered "hide"
 *
 * The AC-19 grouped-counts Outline — `loadGroupedCounts` has no capture on
 * disk, so neither delegation row can be driven:
 * - `@gap contract-product.feature:305` — see delegated
 * - `@gap contract-product.feature:306` — hide delegated
 *
 * Two feature-level defects, surfaced rather than resolved (R31 — the seat
 * shows both readings instead of picking one):
 * - `@gap contract-product.feature:351` — this `Then` packs TWO readings on
 *   one line ("the date it will end, and that it is ending because I asked it
 *   to stop renewing"), against amendment A1's one-reading-per-line law.
 *   `selectStatusNode` proves the EXPIRING node alone; neither the date nor
 *   the cause is asserted anywhere. Splitting it is a feature edit the
 *   amendment set never made, so it is reported at its line rather than
 *   half-discharged by the node assertion.
 * - `@gap contract-product.feature:502` — this invariant `And` ("forcing a
 *   consolidation change anyway makes no request and is refused") is FALSE on
 *   two of its Outline's four rows: rows 508 and 509 name a subscription,
 *   which IS offered the change, and the tests above prove that change
 *   reaching the wire. Amendment A16 moved the other packed claims onto
 *   per-row outcomes and left this one behind. Asserting it would contradict
 *   the rows; deleting it is a feature edit outside this seat's remit.
 */

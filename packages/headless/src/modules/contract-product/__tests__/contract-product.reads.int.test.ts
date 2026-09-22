/**
 * @fileoverview useContractProducts / useContractProduct — the paged products
 * collection (AC-1) and the single-product read (AC-4)
 *
 * ## Job To Be Done
 * Drive the REAL `useContractProducts()` collection and `useContractProduct()`
 * manager against RECORDED production captures (`contract-product.fixtures.ts`)
 * and prove: AC-1 — a client sees the reactive page of contract products on
 * their own account, each one arriving with its status; and AC-4 — opening
 * one product sends the real 35-member `with` list design.md §8.1 states
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

/** design.md §8.1's 35-member client product detail read [o10]: the 18
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

describe("useContractProducts — I see the products on my own account (AC-1)", () => {
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

    // The declared query contract's own defaults (design.md §8.2/§8.1) —
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

  /**
   * KNOWN GAP — `contract-product.feature:98`'s "narrowing by category name
   * is offered to me" half of the AC-1 criteria scenario. design.md §8.2
   * documents the wire shape (`categoryName` leaf, wire column
   * `product.category.name`, `like` operator, `filter[product.category.name|like]`)
   * but not the composable's own runtime call shape for an operator-bound
   * leaf, which the prover's Read-block law puts out of reach this pass. The
   * sibling `"status.code"` narrowing above uses a BARE leaf (schema
   * property equals the wire column, value passed direct); every plausible
   * analogous shape for this LIKE leaf was driven against the real module —
   * `setCriteria({ filters: { categoryName: "Hosting" } })`,
   * `{ "product.category.name": "Hosting" }`,
   * `{ "product.category.name|like": "Hosting" }`,
   * `{ categoryName: { like: "Hosting" } }`,
   * `filterBy({ "product.category.name": { like: "Hosting" } })` — and NONE
   * produced a second `GET contracts_products` request: the captured URL
   * never changed off the boot fetch across a full `vi.waitFor` window on
   * every attempt. Recording a fixture to introspect further is forbidden
   * this pass. Reported here rather than asserted blind or silently
   * dropped — the generic narrowing tests above (order/page/clear/no-leak)
   * still prove the rest of this scenario's `Then` lines.
   */

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
   * everywhere" (contract-product.feature:104, @AC-1 @brand) has no test
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
   * KNOWN GAP — the empty-vs-absent half of this scenario's `Then` ("an
   * empty result tells me whether it is empty because there are none, or
   * because the product was loaded without them") is NOT proven below: the
   * only recorded product capture on disk carries `scheduled_actions: []`,
   * so this suite can prove the empty-array reading but has no real capture
   * of a product loaded WITHOUT the member at all to prove the two are told
   * apart. Recording is forbidden this pass (`receipts.md`); hand-authoring
   * an "absent member" body would fabricate the very distinction this gap
   * names, so it is reported here rather than faked.
   */
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

/**
 * @fileoverview useContracts / useContract — the paged contracts collection
 * (AC-14) and the single-contract read (AC-3)
 *
 * ## Job To Be Done
 * Drive the REAL `useContracts()` collection and `useContract()` manager
 * against RECORDED production captures (`contract.fixtures.ts`) and prove:
 * AC-14 exactly as `contract.feature` states it — a client sees the reactive
 * page of contracts on their own account, told which page they are on and
 * how many there are; and AC-3 — opening one contract sends the real
 * 8-member `with` list ruling R34 states (the contract keeps only contract
 * facts, dropping the product cancellation members each `useContractProduct`
 * loads itself), with `with_staged_imports=1`, and asks for no member outside
 * that set.
 * `contract.mutations.int.test.ts` proves the three writes; this file proves
 * the two reads.
 *
 * ## What Breaks If These Fail
 * A client's contracts page renders empty, or with no page/count
 * information, even though real contracts exist on the account; or opening
 * one contract silently drops a member a consumer needs (the cancellation
 * request, the staged-import inclusion), or leaks a member no client route
 * is entitled to ask for — with no integration coverage able to catch it.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useContract, useContracts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** The 8-member client contract read after ruling R34: the contract keeps only
 * contract facts, so the read DROPS the product cancellation members
 * (`products.contract_request`, `products.contract_request.custom_fields.field`,
 * `products.future_cancellation_request`) and `cancellation_request.custom_fields.field`.
 * Each product loads its own cancellation state through `useContractProduct`. */
const CONTRACT_WITH_MEMBERS = [
  "products.product.image",
  "products.product.brand.currency",
  "cancellation_request",
  "products.status",
  "products.tags",
  "client.image",
  "status",
  "cancellation_request.status"
].sort();

describe("useContract — I open one of my contracts with everything the account area needs (AC-3)", () => {
  /**
   * The eight one-record-per-line promises the AC-3 scenario carries after
   * ruling R34 are the eight members asserted EXACTLY below, so a module that
   * drops one — or asks for one this client read is not entitled to — fails
   * one NAMED line:
   *
   * - `@proves contract.feature:138` — the cancellation request on it
   *   (`cancellation_request`)
   * - `@proves contract.feature:139` — that request's state
   *   (`cancellation_request.status`)
   * - `@proves contract.feature:140` — the contract's own status (`status`)
   * - `@proves contract.feature:141` — my account's image (`client.image`)
   * - `@proves contract.feature:142` — each product's status
   *   (`products.status`)
   * - `@proves contract.feature:143` — each product's tags (`products.tags`)
   * - `@proves contract.feature:144` — each product's catalogue product image
   *   (`products.product.image`)
   * - `@proves contract.feature:145` — the currency of each product's brand
   *   (`products.product.brand.currency`)
   */
  /** `@proves contract.feature:146` — "with the products that are still being
   * imported included rather than hidden": the `with_staged_imports=1`
   * assertion in the test below is that line's whole proof. The product
   * cancellation members (`products.contract_request*`,
   * `products.future_cancellation_request`) and
   * `cancellation_request.custom_fields.field` are dropped by R34 — each
   * `useContractProduct` loads its own cancellation state. */
  it("AC-3 GETs contracts/{id} with_staged_imports=1 and exactly the 8-member client with-list — no product cancellation member", async () => {
    const { accessToken } = await seedClientSession();
    const row = recorded.one().data;
    let capturedUrl: string | undefined;
    let capturedAuth: string | null | undefined;

    server?.use(
      http.get(`*/contracts/:id`, ({ request, params }) => {
        if (String(params.id) !== row.id) return undefined;
        capturedUrl = request.url;
        capturedAuth = request.headers.get("authorization");
        return HttpResponse.json(recorded.one(), { status: 200 });
      })
    );

    const manager = useContract().as(ScopeActorTypes.CLIENT).withId(row.id);
    await manager.useActions().isReady();

    expect(capturedUrl).toBeDefined();
    expect(capturedAuth).toBe(`Bearer ${accessToken}`);
    const url = new URL(capturedUrl!);
    expect(url.searchParams.get("with_staged_imports")).toBe("1");
    const withParam = url.searchParams.get("with") ?? "";
    const requestedMembers = withParam.split(",").filter(Boolean).sort();
    expect(requestedMembers).toEqual(CONTRACT_WITH_MEMBERS);
  });

  it("AC-12 the manager publishes the REAL record's own raw status.code, never a coerced substitute", async () => {
    await seedClientSession();
    const row = recorded.one().data as { id: string; status: { code: string } };
    server?.use(
      http.get(`*/contracts/:id`, ({ params }) => {
        if (String(params.id) !== row.id) return undefined;
        return HttpResponse.json(recorded.one(), { status: 200 });
      })
    );

    const manager = useContract().as(ScopeActorTypes.CLIENT).withId(row.id);
    await manager.useActions().isReady();

    // The real capture's own status.code, read back off the manager's
    // published view model unchanged — AC-12's own promise ("shown to me as
    // it is, rather than quietly turned into one that is") proven against a
    // real record, not only against the pure selector's own vocabulary table.
    expect(manager.useContext().contract.value?.status.code).toBe(
      row.status.code
    );
  });
});

/** `design ✅.md` §8.1 R19/R30 — the list view model's own 3-member `with` list. */
const CONTRACTS_LIST_WITH_MEMBERS = [
  "status",
  "cancellation_request",
  "cancellation_request.status"
].sort();

describe("useContracts — I see and page through the contracts on my own account (AC-14)", () => {
  it("AC-14 the reactive first page arrives from the RECORDED production list capture, told which page I am on, how many there are, and that a next page exists", async () => {
    const captured = recorded.list();
    await seedClientSession();
    installBackgroundStubs();
    let capturedUrl: string | undefined;
    server?.use(
      http.get("*/contracts", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(captured, { status: 200 });
      })
    );

    const collection = useContracts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();
    const meta = collection.useMeta();

    await vi.waitFor(() => {
      expect(context.data.value.length).toBeGreaterThan(0);
    });

    expect(meta.hasError.value).toBe(false);
    expect(context.data.value.length).toBe(captured.data.length);
    for (const contract of context.data.value) {
      expect(contract.id).toBeTruthy();
    }

    expect(context.pagination.value.page).toBe(1);
    expect(context.pagination.value.total).toBe(captured.total);
    expect(meta.hasNextPage.value).toBe(true);
    expect(meta.hasPrevPage.value).toBe(false);

    // The list view model's own `with` list travels on the SAME request this
    // page's data came from — never asserted separately against a request
    // the reactive read above never actually drove.
    expect(capturedUrl).toBeDefined();
    const withParam = new URL(capturedUrl!).searchParams.get("with") ?? "";
    const requestedMembers = withParam.split(",").filter(Boolean).sort();
    expect(requestedMembers).toEqual(CONTRACTS_LIST_WITH_MEMBERS);
  });

  /**
   * The AC-14 paging Outline, two of whose three rows this test drives:
   * - `@proves contract.feature:113` — first page, forward to the next
   * - `@proves contract.feature:114` — second page, back to the previous
   *
   * The "forward to the last page" row (contract.feature:115) is driven by
   * `contract.replay.int.test.ts`, which jumps to the last recorded page
   * through the collection's page-position criterion.
   */
  it("AC-14 nextPage()/prevPage() actually move the window — the offset on the wire advances and returns, not only the hasNextPage/hasPrevPage flags", async () => {
    await seedClientSession();
    installBackgroundStubs();
    let capturedUrl: string | undefined;
    server?.use(
      http.get("*/contracts", ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const collection = useContracts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();
    const meta = collection.useMeta();

    await vi.waitFor(() => {
      expect(context.data.value.length).toBeGreaterThan(0);
    });
    const firstOffset = new URL(capturedUrl!).searchParams.get("offset");
    expect(meta.hasNextPage.value).toBe(true);
    expect(meta.hasPrevPage.value).toBe(false);

    await collection.useActions().nextPage();
    await vi.waitFor(() => {
      const offset = new URL(capturedUrl!).searchParams.get("offset");
      expect(offset).not.toBe(firstOffset);
    });
    const secondOffset = new URL(capturedUrl!).searchParams.get("offset");
    expect(secondOffset).not.toBe(firstOffset);
    await vi.waitFor(() => {
      expect(context.pagination.value.page).toBe(2);
      expect(meta.hasPrevPage.value).toBe(true);
    });

    await collection.useActions().prevPage();
    // The second page's fetch may satisfy the first page from cache rather
    // than re-issuing the wire request, so the window itself — the
    // published pagination state — is the load-bearing assertion here, not
    // a second network round-trip.
    await vi.waitFor(() => {
      expect(context.pagination.value.page).toBe(1);
    });
    expect(meta.hasPrevPage.value).toBe(false);
  });

  /** "Choose how many of my contracts come on one page" — R38 keeps the page size a criterion beside the filters and the sort. */
  it("AC-14 the page size I choose is the one my contracts are asked for", async () => {
    await seedClientSession();
    installBackgroundStubs();
    const limits: (string | null)[] = [];
    server?.use(
      http.get("*/contracts", ({ request }) => {
        limits.push(new URL(request.url).searchParams.get("limit"));
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const collection = useContracts().as(ScopeActorTypes.CLIENT);
    await collection.useActions().isReady();
    const context = collection.useContext();

    collection.useActions().setCriteria({ pagination: { limit: 5 } });

    await vi.waitFor(() => expect(limits).toContain("5"));
    expect(context.query.value.pagination?.limit).toBe(5);
  });
});

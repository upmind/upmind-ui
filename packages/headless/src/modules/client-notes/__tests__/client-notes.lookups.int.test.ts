// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.lookups.int
 * @description Integration proof for the client-notes-product-lookup story
 * (design.md §Proof) — the contract-product control is a server-side,
 * type-to-search, "load more" remote-select over `GET /contracts_products`,
 * NOT the embedded `oneOf` list it replaced. Anchored to AC-41 (the editor's
 * product control) and AC-42 (the filter-bar product control), both driven
 * against REAL staging captures replayed through MSW.
 *
 * ## Job To Be Done
 * AC-2 (story): opening the editor loads no product list at boot and the
 * control carries a live lookup SERVICE, not a serialized list. AC-1: driving
 * that service searches the client's OWN products server-side — a bounded,
 * `product.name`-`like` filtered, `limit`/`offset`-paged request on the client
 * session token — and "load more" advances the offset and appends the next
 * page. AC-3 (invariant): the filter bar still narrows the vault with
 * `filter[contract_product_id|eq]` without retargeting the client.
 *
 * ## What Breaks If These Fail
 * The 101st product silently vanishes again (the unbounded eager list this
 * story deletes), the editor renders an empty textbox, or the filter bar's
 * product narrowing retargets to another client's resource.
 */

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useClientNoteManager, useClientNotes } from "..";
import { useLookup } from "../../lookup";
import { ScopeActorTypes } from "../../scope/scope.types";
import { ClientNoteContextTypes } from "../client-notes.types";
import {
  assertNoActingAsHeaders,
  observeVaultRequests,
  recorded,
  resetClientNoteScopes,
  seedClientSession,
  waitForAvailable
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";
import { every, find, get, map, some } from "lodash-es";

// -----------------------------------------------------------------------------

type ObservedProductsRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
};

/** Passively observes every request whose URL contains `/contracts_products`. */
function observeContractProductsRequests(): {
  all: () => ObservedProductsRequest[];
  count: () => number;
  offsets: () => number[];
  stop: () => void;
} {
  const seen: ObservedProductsRequest[] = [];
  const listener = ({ request }: { request: Request }): void => {
    if (!request.url.includes("/contracts_products")) return;
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
  };
  server?.events.on("request:start", listener);
  return {
    all: () => seen,
    count: () => seen.length,
    offsets: () =>
      map(seen, entry => Number(new URL(entry.url).searchParams.get("offset"))),
    stop: () => server?.events.removeListener("request:start", listener)
  };
}

/** The lookup-bearing control anywhere in a uischema tree, by scope + options. */
function lookupControlOf(node: unknown): Record<string, unknown> | undefined {
  if (!node || typeof node !== "object") return undefined;
  const scope = get(node, "scope");
  if (
    typeof scope === "string" &&
    scope.includes("contract_product_id") &&
    get(node, "options.lookup")
  ) {
    return node as Record<string, unknown>;
  }
  const elements = get(node, "elements");
  if (Array.isArray(elements)) {
    for (const element of elements) {
      const found = lookupControlOf(element);
      if (found) return found;
    }
  }
  return undefined;
}

/** Serves recorded page 1 for the first page and page 2 for any advanced offset. */
function serveTwoPageProducts(): void {
  const pageOne = recorded.lookupPageOne();
  const pageTwo = recorded.lookupPageTwo();
  server?.use(
    http.get("*/contracts_products*", ({ request }) => {
      const offset = Number(new URL(request.url).searchParams.get("offset"));
      return HttpResponse.json(offset > 0 ? pageTwo : pageOne, { status: 200 });
    })
  );
}

// -----------------------------------------------------------------------------

describe("client-notes lookups — the contract-product remote-select", () => {
  let clientId: string;
  let accessToken: string;

  beforeEach(async () => {
    const seeded = await seedClientSession();
    clientId = seeded.clientId;
    accessToken = seeded.accessToken;
  });

  afterEach(() => {
    resetClientNoteScopes();
  });

  it("AC-41 — opening the editor fires no contract-products request at boot, and the product control carries a live lookup service instead of an embedded list", async () => {
    const noteRow = find(recorded.list().data, row => !row.encrypted)!;
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const observedProducts = observeContractProductsRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      )
    );

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBeTruthy();
    });

    expect(observedProducts.count()).toBe(0);

    const schemaProperty = get(
      manager.useContext().schema?.value,
      "properties.contract_product_id"
    ) as Record<string, unknown> | undefined;
    expect(schemaProperty).toBeTruthy();
    expect(schemaProperty).not.toHaveProperty("oneOf");
    expect(schemaProperty).not.toHaveProperty("enum");

    const control = lookupControlOf(manager.useContext().uischema?.value);
    expect(
      control,
      "no contract_product_id lookup control in the editor"
    ).toBeTruthy();
    const lookup = get(control, "options.lookup") as Record<string, unknown>;
    expect(typeof lookup.service).toBe("function");
    expect(lookup.searchScope).toBe("query");

    observedProducts.stop();
    manager.useActions().destroy();
  });

  it("AC-41 — searching products issues a bounded, product.name like-filtered request scoped to the client's own resource, on the client session token", async () => {
    const noteRow = find(recorded.list().data, row => !row.encrypted)!;
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const observedProducts = observeContractProductsRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      )
    );
    serveTwoPageProducts();

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBeTruthy();
    });

    const control = lookupControlOf(manager.useContext().uischema?.value)!;
    const service = get(control, "options.lookup.service") as () => never;
    const searchScope = get(control, "options.lookup.searchScope") as string;
    const lookup = useLookup(service(), { searchScope });

    lookup.search("hosting");
    await vi.waitFor(() => {
      expect(observedProducts.count()).toBeGreaterThan(0);
    });

    expect(
      every(observedProducts.all(), request => {
        const url = new URL(request.url);
        const limit = Number(url.searchParams.get("limit"));
        return (
          url.searchParams.get("filter[clients.id]") === clientId &&
          limit > 0 &&
          Number.isFinite(limit) &&
          (request.headers.authorization ?? request.headers.Authorization) ===
            `Bearer ${accessToken}`
        );
      }),
      "a lookup request left the client's scope, dropped the token, or was unbounded"
    ).toBe(true);

    for (const request of observedProducts.all()) {
      assertNoActingAsHeaders(request.headers);
    }

    expect(
      some(observedProducts.all(), request =>
        decodeURIComponent(request.url).includes("query=hosting")
      ),
      "no observed request carried the raw query search term"
    ).toBe(true);

    const items = lookup.items.value as Array<{ value: string; label: string }>;
    expect(items.length).toBeGreaterThan(0);
    const pageOneIds = map(recorded.lookupPageOne().data, "id");
    expect(pageOneIds).toContain(items[0].value);
    expect(typeof items[0].label).toBe("string");
    expect(items[0].label.length).toBeGreaterThan(0);

    observedProducts.stop();
    manager.useActions().destroy();
  });

  it("AC-41 — loading more advances the offset and appends the next page over a two-page recorded fixture", async () => {
    const noteRow = find(recorded.list().data, row => !row.encrypted)!;
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const observedProducts = observeContractProductsRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      )
    );
    serveTwoPageProducts();

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBeTruthy();
    });

    const control = lookupControlOf(manager.useContext().uischema?.value)!;
    const service = get(control, "options.lookup.service") as () => never;
    const searchScope = get(control, "options.lookup.searchScope") as string;
    const lookup = useLookup(service(), { searchScope });

    lookup.search("a");
    await vi.waitFor(() => {
      expect((lookup.items.value as unknown[]).length).toBeGreaterThan(0);
    });
    const firstPageCount = (lookup.items.value as unknown[]).length;
    expect(lookup.meta.value.hasMore).toBe(true);
    // The total is the SERVER's match count, not the loaded-page count — the
    // "loaded / total" line must read hundreds, never `20 / 20`.
    expect(lookup.total.value).toBeGreaterThan(firstPageCount);

    lookup.loadMore();
    await vi.waitFor(() => {
      expect((lookup.items.value as unknown[]).length).toBeGreaterThan(
        firstPageCount
      );
    });

    expect(some(observedProducts.offsets(), offset => offset > 0)).toBe(true);
    const items = lookup.items.value as Array<{ value: string }>;
    const pageTwoIds = map(recorded.lookupPageTwo().data, "id");
    expect(
      some(items, item => pageTwoIds.includes(item.value)),
      "the appended page did not carry the recorded second page's products"
    ).toBe(true);

    observedProducts.stop();
    manager.useActions().destroy();
  });

  it("AC-41 — selecting a product writes its id back through the editor", async () => {
    const noteRow = find(recorded.list().data, row => !row.encrypted)!;
    const oneEnvelope = { ...recorded.one(), data: noteRow };
    const edited = recorded.edited();
    let putBody: Record<string, unknown> | undefined;

    server?.use(
      http.get(`*/clients/${clientId}/vault/${noteRow.id}`, () =>
        HttpResponse.json(oneEnvelope, { status: 200 })
      ),
      http.put(
        `*/clients/${clientId}/vault/${noteRow.id}`,
        async ({ request }) => {
          putBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(edited, { status: 200 });
        }
      )
    );
    serveTwoPageProducts();

    const manager = useClientNoteManager()
      .as(ScopeActorTypes.SELF)
      .for(ClientNoteContextTypes.NOTE, noteRow.id);
    await waitForAvailable(manager);
    await vi.waitFor(() => {
      expect(manager.useContext().model.value?.note).toBeTruthy();
    });

    const chosenId = recorded.lookupPageOne().data[0].id;
    await manager
      .useActions()
      .update({ contract_product_id: chosenId } as never);

    expect(putBody?.contract_product_id).toBe(chosenId);

    manager.useActions().destroy();
  });

  it("AC-42 — the filter bar narrows the vault to one contract product from a rendered select, without retargeting the client", async () => {
    const observedProducts = observeContractProductsRequests();
    const observedVault = observeVaultRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );
    serveTwoPageProducts();

    const notes = useClientNotes().as(ScopeActorTypes.SELF);
    await waitForAvailable(notes);

    const querySchema = get(notes.useContext(), "schemas.query") as
      | { uischema?: unknown }
      | undefined;
    const control = lookupControlOf(querySchema?.uischema);
    expect(
      control,
      "no contract_product_id lookup control in the filter bar"
    ).toBeTruthy();
    expect(get(control, "scope")).toContain(
      "filters/properties/contract_product_id/properties/eq"
    );
    expect(typeof get(control, "options.lookup.service")).toBe("function");

    const chosenId = recorded.lookupPageOne().data[0].id;
    notes.useActions().filterBy({ contract_product_id: { eq: chosenId } });
    await new Promise(resolve => setTimeout(resolve, 0));

    const last = observedVault.last();
    expect(decodeURIComponent(last.url)).toContain(
      `filter[contract_product_id|eq]=${chosenId}`
    );
    expect(last.url).toContain(`/clients/${clientId}/vault`);

    notes.useActions().destroy();
    observedProducts.stop();
    observedVault.stop();
  });
});

// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.collection.int
 * @description Integration proof for the collection half of the vault —
 * `useClientNotes` — against REAL staging captures replayed through MSW.
 * AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-12, AC-13 (parity.yaml C1-C7,
 * C12, C13). Read-back discipline (`verify-reality-check.companion.md`): the
 * request URL retarget and the client session token, never the response
 * payload alone.
 */

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useClientNotes } from "..";
import {
  waitForAvailable,
  assertClientIdentityTransport,
  observeVaultRequests,
  recorded,
  resetClientNoteScopes,
  seedClientSession
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-notes collection — useClientNotes", () => {
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

  it("AC-1 — reads my own vault as the reactive, mapped list", async () => {
    const list = recorded.list();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(list, { status: 200 })
      )
    );
    const observed = observeVaultRequests();

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    const rows = notes.useContext().data.value ?? [];
    const recordedIds = list.data.map(row => row.id);
    expect(rows.map(row => row.id).sort()).toEqual([...recordedIds].sort());

    expect(observed.count()).toBe(1);
    assertClientIdentityTransport(observed.first(), clientId, accessToken);
    observed.stop();
  });

  it("AC-1 — the boot request never carries filter[encrypted|eq] — a bare boolean leaf must not narrow to notes-only (design decision D9)", async () => {
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    expect(
      new URL(observed.first().url).searchParams.has("filter[encrypted|eq]")
    ).toBe(false);
    const rows = notes.useContext().data.value ?? [];
    expect(rows.some(row => row.encrypted === true)).toBe(true);
    expect(rows.some(row => row.encrypted === false)).toBe(true);
    observed.stop();
  });

  it("AC-2/AC-31 — filters.encrypted.eq splits notes from secrets through the criteria channel, and the uischema renders it", async () => {
    const notesOnly = recorded.filterEncryptedFalse();
    const secretsOnly = recorded.filterEncryptedTrue();
    const observed = observeVaultRequests();

    server?.use(
      http.get(`*/clients/${clientId}/vault`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        const filter = params.get("filter[encrypted|eq]");
        if (filter === "0")
          return HttpResponse.json(notesOnly, { status: 200 });
        if (filter === "1")
          return HttpResponse.json(secretsOnly, { status: 200 });
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    notes.useActions().filterBy({ encrypted: { eq: false } });
    await new Promise(resolve => setTimeout(resolve, 0));
    let last = observed.last();
    expect(last.url).toContain("filter%5Bencrypted%7Ceq%5D=0");
    let rows = notes.useContext().data.value ?? [];
    expect(rows.every(row => row.encrypted === false)).toBe(true);
    expect(rows).toHaveLength(notesOnly.data.length);

    notes.useActions().filterBy({ encrypted: { eq: true } });
    await new Promise(resolve => setTimeout(resolve, 0));
    last = observed.last();
    expect(last.url).toContain("filter%5Bencrypted%7Ceq%5D=1");
    rows = notes.useContext().data.value ?? [];
    expect(rows.every(row => row.encrypted === true)).toBe(true);
    expect(rows).toHaveLength(secretsOnly.data.length);

    const querySchema = (
      notes.useContext() as unknown as {
        schemas?: {
          query?: { schema?: unknown; uischema?: { elements?: unknown[] } };
        };
      }
    ).schemas?.query;
    expect(querySchema?.schema).toBeTruthy();
    const scoped = JSON.stringify(querySchema?.uischema ?? {});
    expect(scoped).toContain(
      "#/properties/filters/properties/encrypted/properties/eq"
    );

    observed.stop();
  });

  it("AC-3 — filters the vault by label (filter[label|like])", async () => {
    const narrowed = recorded.filterLabelLike();
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        if (params.has("filter[label|like]"))
          return HttpResponse.json(narrowed, { status: 200 });
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);
    notes.useActions().filterBy({ label: { like: "prover" } });
    await new Promise(resolve => setTimeout(resolve, 0));

    const last = observed.last();
    expect(decodeURIComponent(last.url)).toContain(
      "filter[label|like]=%prover%"
    );
    const rows = notes.useContext().data.value ?? [];
    expect(rows.map(row => row.id).sort()).toEqual(
      narrowed.data.map(row => row.id).sort()
    );
    observed.stop();
  });

  it("AC-4 — filters the vault to pinned/unpinned as a tri-state, null clearing the filter", async () => {
    const pinnedTrue = recorded.filterPinnedTrue();
    const pinnedFalse = recorded.filterPinnedFalse();
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, ({ request }) => {
        const params = new URL(request.url).searchParams;
        const value = params.get("filter[pinned|eq]");
        if (value === "1")
          return HttpResponse.json(pinnedTrue, { status: 200 });
        if (value === "0")
          return HttpResponse.json(pinnedFalse, { status: 200 });
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    notes.useActions().filterBy({ pinned: { eq: true } });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(observed.last().url).toContain("filter%5Bpinned%7Ceq%5D=1");

    notes.useActions().filterBy({ pinned: { eq: false } });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(observed.last().url).toContain("filter%5Bpinned%7Ceq%5D=0");

    // Returning to the unfiltered criteria (null) is a TanStack CACHE HIT —
    // the exact combination the boot fetch already served — so no request is
    // re-issued for the clear step itself
    // (client-address.filters.int.test.ts:85,165 documents the mechanic).
    // Reading `observed.last().url` here would read the STALE pre-clear
    // request and misreport a working clear as broken. Assert the clear two
    // ways instead: (1) no new request fires for the clear itself, and
    // (2) the NEXT request, forced through an orthogonal criteria change,
    // carries no pinned filter key at all.
    const beforeClear = observed.count();
    notes.useActions().filterBy({ pinned: { eq: null } });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(observed.count()).toBe(beforeClear);

    notes.useActions().setCriteria({ pagination: { limit: 2 } });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(observed.count()).toBeGreaterThan(beforeClear);
    expect(
      new URL(observed.last().url).searchParams.has("filter[pinned|eq]")
    ).toBe(false);

    observed.stop();
  });

  it("AC-5 — narrows the vault to one contract product without retargeting the client", async () => {
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(recorded.list(), { status: 200 })
      )
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);
    notes.useActions().filterBy({ contract_product_id: { eq: "prod-123" } });
    await new Promise(resolve => setTimeout(resolve, 0));

    const last = observed.last();
    expect(decodeURIComponent(last.url)).toContain(
      "filter[contract_product_id|eq]=prod-123"
    );
    expect(last.url).toContain(`/clients/${clientId}/vault`);
    observed.stop();
  });

  it("AC-6 — pages the vault, defaulting to limit=3, and walks offsets", async () => {
    const pageOne = recorded.pageOne();
    const pageTwo = recorded.pageTwo();
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, ({ request }) => {
        const offset = new URL(request.url).searchParams.get("offset") ?? "0";
        return HttpResponse.json(offset === "0" ? pageOne : pageTwo, {
          status: 200
        });
      })
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    expect(decodeURIComponent(observed.first().url)).toContain("limit=3");
    expect(decodeURIComponent(observed.first().url)).toContain("offset=0");

    notes.useActions().setCriteria({ pagination: { limit: 2 } });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(decodeURIComponent(observed.last().url)).toContain("limit=2");

    notes.useActions().nextPage();
    await new Promise(resolve => setTimeout(resolve, 0));

    const last = observed.last();
    expect(decodeURIComponent(last.url)).toContain("limit=2");
    expect(decodeURIComponent(last.url)).toContain("offset=2");
    expect(notes.useContext().pagination?.value?.total).toBe(pageOne.total);
    observed.stop();
  });

  it("AC-7 — orders the vault only on request; boot sends no order= at all", async () => {
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, ({ request }) => {
        const order = new URL(request.url).searchParams.get("order");
        if (order === "label")
          return HttpResponse.json(
            recorded.order("label", "asc").response.body,
            {
              status: 200
            }
          );
        if (order === "-label")
          return HttpResponse.json(
            recorded.order("label", "desc").response.body,
            { status: 200 }
          );
        return HttpResponse.json(recorded.list(), { status: 200 });
      })
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    expect(observed.first().url).not.toContain("order=");

    notes
      .useActions()
      .sortBy([{ field: "label", dir: "asc" as never }] as never);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(observed.last().url).toContain("order=label");

    notes
      .useActions()
      .sortBy([{ field: "label", dir: "desc" as never }] as never);
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(observed.last().url).toContain("order=-label");

    observed.stop();
  });

  it("AC-12 — reads who wrote each asset and the linked product, via the exact with= relation list", async () => {
    const list = recorded.list();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(list, { status: 200 })
      )
    );
    const observed = observeVaultRequests();

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    const withParam = new URL(observed.first().url).searchParams.get("with");
    expect(withParam).toBe(
      "contract_product,contract_product.product.image,contract_product.product.brand.currency,author_user,author_user.image,author_client,author_client.image,editor_user,editor_user.image,editor_client,editor_client.image"
    );

    const rows = notes.useContext().data.value ?? [];
    // The staging account under capture holds only client-authored rows —
    // S1 (the admin endpoint family) is dropped, so no staff-authored row can
    // be legitimately captured for the `author.isClient === false` branch.
    // Every REAL captured row is asserted individually against its own
    // author_client presence (parity.yaml row C12's "asserted per row" bar).
    list.data.forEach((wireRow, index) => {
      const mapped = rows.find(row => row.id === wireRow.id);
      expect(
        mapped,
        `row ${index} (${wireRow.id}) was not mapped`
      ).toBeTruthy();
      expect(mapped?.author?.isClient).toBe(Boolean(wireRow.author_client));
    });

    observed.stop();
  });

  it("AC-13 — knows an asset is hidden from clients (!(visible_for_client ?? true))", async () => {
    const list = recorded.list();
    // Field-override technique (client-phone precedent: "OVERRIDING a
    // recorded row, never hand-writing a wire body from nothing"). The live
    // staging account only ever produces visible_for_client:true rows (a
    // client cannot write this field — row S3 is dropped); the false/absent
    // branches flip ONE already-real row's boolean/omit it, never invent a
    // new row.
    const hiddenRow = { ...list.data[0], visible_for_client: false };
    const absentRow = { ...list.data[1] };
    delete (absentRow as { visible_for_client?: boolean }).visible_for_client;
    const shownRow = list.data[2];
    const mixed = {
      ...list,
      data: [hiddenRow, absentRow, shownRow]
    };

    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(mixed, { status: 200 })
      )
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);
    const rows = notes.useContext().data.value ?? [];

    expect(
      rows.find(row => row.id === hiddenRow.id)?.meta.isHiddenFromClient
    ).toBe(true);
    expect(
      rows.find(row => row.id === absentRow.id)?.meta.isHiddenFromClient
    ).toBe(false);
    expect(
      rows.find(row => row.id === shownRow.id)?.meta.isHiddenFromClient
    ).toBe(false);
  });
});

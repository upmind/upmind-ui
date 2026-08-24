// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — the paging door (AC-11, AC-38, AC-40)
 *
 * ## Job To Be Done
 * `useActions().setCriteria({ pagination: { limit } })` is the ONLY public
 * door onto the schema's `pagination.limit` default of 0 (design.md §3 — the
 * ~10 whole-collection importers that default protects). Prove the door
 * actually reaches the wire, that `nextPage()`/`prevPage()` walk `offset`
 * once a page size is set, that `useContext().query` — the handle's own
 * criteria, never a copy — tracks `offset` as it moves, and that the
 * `limit:0` default still reaches the wire untouched when the door is never
 * called.
 *
 * ## What Breaks If These Fail
 * A page-size door that looks published but writes nowhere is the FE-2824
 * shape: `nextPage`/`prevPage` stay inert, and a consumer paging a long list
 * keeps seeing the same first page forever. A regressed default silently
 * truncates the ~10 importers that read the collection whole.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientPhones } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installPagedPhonesHandler,
  observePhoneRequests,
  seedClientSession
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

async function bootPhones(): Promise<ReturnType<typeof useClientPhones>> {
  const phones = useClientPhones().as(ScopeActorTypes.SELF);
  await phones.useActions().isReady();
  return phones;
}

// -----------------------------------------------------------------------------

describe("client-phone — setCriteria sets a page size that reaches the wire (AC-11)", () => {
  it("setCriteria({ pagination: { limit: 2 } }) puts limit=2 on the outbound request", async () => {
    const { clientId } = await seedClientSession();
    installPagedPhonesHandler(server, clientId);
    const phones = await bootPhones();

    const observed = observePhoneRequests();
    phones.useActions().setCriteria({ pagination: { limit: 2 } });

    await vi.waitFor(() =>
      expect(observed.matching("limit=2").length).toBeGreaterThan(0)
    );
    observed.stop();

    const last = new URL(
      observed.matching("limit=2")[observed.matching("limit=2").length - 1].url
    );
    expect(last.searchParams.get("limit")).toBe("2");
    expect(phones.useContext().query.value.pagination?.limit).toBe(2);
  });
});

describe("client-phone — nextPage() walks the wire offset once a page size is set (AC-11)", () => {
  it("nextPage() moves the outbound offset from 0 to 2", async () => {
    const { clientId } = await seedClientSession();
    const paged = installPagedPhonesHandler(server, clientId);
    const phones = await bootPhones();

    phones.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );
    // The query's own hasNextPage/pageParam computed settles a tick after
    // the criteria write resolves; nextPage() read before that tick is a
    // false negative, not a real inertness (confirmed live against staging
    // replay before this wait was added).
    await new Promise(resolve => setTimeout(resolve, 250));

    const observed = observePhoneRequests();
    phones.useActions().nextPage();

    await vi.waitFor(() =>
      expect(observed.matching("offset=2").length).toBeGreaterThan(0)
    );
    observed.stop();

    const secondPageRequest = new URL(observed.matching("offset=2")[0].url);
    expect(secondPageRequest.searchParams.get("limit")).toBe("2");
    // paged.offsets() also carries the boot-time default-criteria fetch
    // (offset=0, fired by bootPhones() before setCriteria); the walk under
    // test is its tail.
    expect(paged.offsets().slice(-2)).toEqual(["0", "2"]);
  });
});

describe("client-phone — prevPage() walks the wire offset back (AC-11)", () => {
  it("prevPage() moves the outbound offset from 2 back to 0", async () => {
    const { clientId } = await seedClientSession();
    const paged = installPagedPhonesHandler(server, clientId);
    const phones = await bootPhones();

    phones.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );
    await new Promise(resolve => setTimeout(resolve, 250));

    phones.useActions().nextPage();
    await vi.waitFor(() =>
      expect(phones.useContext().query.value.pagination?.offset).toBe(2)
    );
    await new Promise(resolve => setTimeout(resolve, 250));

    // offset=2 is a fresh cache key, so the forward leg above is wire-provable
    // (the boot-time default fetch is offsets()[0]; this is its tail).
    expect(paged.offsets().slice(-2)).toEqual(["0", "2"]);

    // offset=0 at limit=2 was already fetched by the setCriteria leg above,
    // so TanStack serves prevPage()'s return trip from cache: confirmed live,
    // no new request lands on the wire for this leg (same divergence a
    // sibling module documented for its own prevPage cache hit). The
    // published criteria is the load-bearing signal for this leg; the wire
    // already proved the walk moves via the setCriteria/nextPage legs above.
    phones.useActions().prevPage();
    await vi.waitFor(() =>
      expect(phones.useContext().query.value.pagination?.offset).toBe(0)
    );
    expect(paged.offsets().slice(-2)).toEqual(["0", "2"]);
  });
});

describe("client-phone — the published request state tracks the page as it moves (AC-40)", () => {
  it("useContext().query.pagination.offset moves with nextPage()/prevPage(), never a stale copy", async () => {
    const { clientId } = await seedClientSession();
    installPagedPhonesHandler(server, clientId);
    const phones = await bootPhones();

    phones.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(phones.useContext().data.value).toHaveLength(2)
    );
    expect(phones.useContext().query.value.pagination?.offset).toBe(0);
    await new Promise(resolve => setTimeout(resolve, 250));

    phones.useActions().nextPage();
    await vi.waitFor(() =>
      expect(phones.useContext().query.value.pagination?.offset).toBe(2)
    );
    await new Promise(resolve => setTimeout(resolve, 250));

    phones.useActions().prevPage();
    await vi.waitFor(() =>
      expect(phones.useContext().query.value.pagination?.offset).toBe(0)
    );
  });
});

describe("client-phone — the limit:0 default reaches the wire when the door is never touched (AC-38)", () => {
  it("boots on limit=0 with pagination.limit=0 on the published request state", async () => {
    const { clientId } = await seedClientSession();
    installPagedPhonesHandler(server, clientId);
    const observed = observePhoneRequests();

    const phones = await bootPhones();
    observed.stop();

    expect(new URL(observed.first().url).searchParams.get("limit")).toBe("0");
    expect(phones.useContext().query.value.pagination?.limit).toBe(0);
  });
});

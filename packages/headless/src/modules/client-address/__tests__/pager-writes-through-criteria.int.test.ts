// -----------------------------------------------------------------------------
/**
 * @fileoverview `nextPage()`/`prevPage()` write THROUGH the criteria (AC-9)
 *
 * ## Job To Be Done
 * Replaces the deleted `pager-writes-through-criteria.int.test.ts`, rewritten
 * against the scoped `.as(actor)` / `useActions()` / `useContext()` surface
 * this module now exposes, in place of the old flat `addresses.nextPage()` /
 * `addresses.criteria` API the deleted file called.
 *
 * ## DISCLOSED FINDING — the happy-path half needed a genuinely paged
 * collection, opened through `setCriteria` (see below)
 * The deleted spec's assertion (`nextPage()` moves the outbound `offset` AND
 * `useContext().query` tracks it) needs a collection that is genuinely
 * PAGED — `pagination.limit > 0` at the point `nextPage()` is called. Probed
 * empirically (never by reading src, per §3.9):
 *
 *   1. `useClientAddresses({ pagination: { limit: 2 } })` — boot request is
 *      byte-identical to the zero-arg call (`limit=0`); the argument has no
 *      observable effect, on pagination OR on filters (a `filters.name.like`
 *      probe on the same argument never reaches the wire either).
 *   2. `.as(ScopeActorTypes.CLIENT, { pagination: { limit: 2 } })` — same
 *      null effect.
 *   3. `nextPage(2)` — the function ignores an argument entirely.
 *   4. Serving the boot request with an explicit `total: 98` (98 rows behind
 *      a 2-row page) still reports `pagination.value.pages === 1`: `limit=0`
 *      is unconditionally treated as exactly one page, matching the platform
 *      comment `client-address.collection.int.test.ts` already cites
 *      ("Can only be 1 page if limit=0").
 *
 * ## What this file DOES prove
 * Two halves. First, the boot-default (unpaged) half directly below: a
 * rejected `nextPage()`/`prevPage()` leaves the published `useContext().query`
 * untouched — the model and the wire cannot disagree about the page showing,
 * because neither one moves. (Previously untested; `collection.int.test.ts`'s
 * AC-9 block proves the rejection settles cleanly but not that `query` is left
 * alone by it.) Second, the genuinely paged half further below, opened
 * through `setCriteria` — see its own docblock for what that proves.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressesListHandler,
  installPagedAddressesHandler,
  observeAddressRequests,
  recordedRows,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";
import { some } from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * The RESOLVED scoped instance `.as(CLIENT)` actually returns — not
 * `ReturnType<typeof useClientAddresses>`, which is the un-resolved
 * `ScopeBuilder` one level up the chain and carries neither `useActions` nor
 * `useContext`.
 */
type ClientAddressesInstance = ReturnType<
  ReturnType<typeof useClientAddresses>["as"]
>;

async function bootCollection(): Promise<ClientAddressesInstance> {
  const { clientId } = await seedClientSession();
  const { primary, secondary } = recordedRows();
  installAddressesListHandler(server, clientId, [primary, secondary]);
  const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
  await addresses.useActions().isReady();
  return addresses;
}

// -----------------------------------------------------------------------------

describe("client-address pager — the guarded path leaves the published query untouched (AC-9)", () => {
  it("AC-9 a rejected nextPage() does not move useContext().query off its booted state", async () => {
    const addresses = await bootCollection();
    const before = addresses.useContext().query.value;

    await addresses
      .useActions()
      .nextPage()
      .catch(() => undefined);

    expect(addresses.useContext().query.value).toEqual(before);
  });

  it("AC-9 a rejected prevPage() does not move useContext().query off its booted state", async () => {
    const addresses = await bootCollection();
    const before = addresses.useContext().query.value;

    await addresses
      .useActions()
      .prevPage()
      .catch(() => undefined);

    expect(addresses.useContext().query.value).toEqual(before);
  });
});

// -----------------------------------------------------------------------------
/**
 * The happy-path half the header above disclosed as missing. `setCriteria`
 * is now published on `useActions()` — the generic criteria door
 * (`useClientAddresses.actions.ts`'s `setCriteria: query.setCriteria`,
 * mirroring `client-email-history`'s precedent, not `client-email`'s, which
 * has no page-window door at all). This proves a caller can reach a genuinely
 * paged collection through it and that `nextPage()`/`prevPage()` then move a
 * real outbound `offset`, against the recorded `?limit=2` page-1/page-2
 * capture (`fixtures/get-clients-id-addresses-case-page-*.json`,
 * `total: 98`) — never a fixture built for this test.
 *
 * Negative control: `pager-setCriteria-door.must-fail.patch` reduces
 * `setCriteria` to a forwarding no-op (`query.setCriteria({})`) and must flip
 * the first assertion below RED, since a caller's `{ pagination: { limit } }`
 * intent then never reaches the model at all.
 */

async function bootPagedCollection(): Promise<{
  addresses: ClientAddressesInstance;
}> {
  const { clientId } = await seedClientSession();
  installPagedAddressesHandler(server, clientId);
  const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
  await addresses.useActions().isReady();
  return { addresses };
}

describe("client-address pager — setCriteria opens a real paged collection (AC-9)", () => {
  it("AC-9 setCriteria({ pagination: { limit } }) puts limit on the outbound request", async () => {
    const { addresses } = await bootPagedCollection();
    const observed = observeAddressRequests();

    addresses.useActions().setCriteria({ pagination: { limit: 2 } });

    await vi.waitFor(() =>
      expect(
        some(
          observed.all(),
          request => new URL(request.url).searchParams.get("limit") === "2"
        )
      ).toBe(true)
    );
    await vi.waitFor(() =>
      expect(addresses.useContext().pagination.value.limit).toBe(2)
    );
    observed.stop();
  });

  it("AC-9 nextPage() moves the outbound offset once a page size is set", async () => {
    const { addresses } = await bootPagedCollection();
    addresses.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.pagination?.limit).toBe(2)
    );
    // `nextPage()` reads an internal pager ref that lags the PUBLISHED
    // `query.value.pagination.limit` by one reactive flush — empirically
    // probed (never off src, per §3.9): calling it in the same microtask
    // queue as the `limit` flip is a no-op (it silently resolves without
    // moving `offset` or firing a request at all), even though `limit` and
    // the DERIVED `pagination.value.pages` already read the new value at
    // that point — ruling out "wait on `pages`" as a fix, since `pages` is a
    // pure `total/limit` computation that updates in the SAME tick `limit`
    // does. A single macrotask yield (this `setTimeout(0)`) is what lets the
    // lagging ref catch up; a plain microtask flush (`await
    // Promise.resolve()`) measurably does not.
    await new Promise(resolve => setTimeout(resolve, 0));
    const observed = observeAddressRequests();

    await addresses.useActions().nextPage();

    await vi.waitFor(
      () =>
        expect(
          some(
            observed.all(),
            request => new URL(request.url).searchParams.get("offset") === "2"
          )
        ).toBe(true),
      { timeout: 3000 }
    );
    observed.stop();
  });

  it("AC-9 prevPage() moves the offset back once a page size is set", async () => {
    const { addresses } = await bootPagedCollection();
    addresses.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.pagination?.limit).toBe(2)
    );
    // See the settle-window note in the "moves the outbound offset" spec
    // above — `nextPage()` needs one macrotask yield past the `limit` flip.
    await new Promise(resolve => setTimeout(resolve, 0));
    await addresses.useActions().nextPage();
    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.pagination?.offset).toBe(2)
    );
    // `offset=0&limit=2` was already fetched on the way to page 2 (the very
    // first re-fetch `setCriteria` triggered), so TanStack Query answers the
    // return trip from cache — the same documented cache-hit shape
    // `client-address.filters.int.test.ts` already carries for "clearing a
    // filter returns to a combination already fetched." No new request is
    // the CORRECT wire behaviour here, so the proof is the model, which is
    // the one thing a cache hit cannot fake: the read the app renders from.
    await addresses.useActions().prevPage();

    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.pagination?.offset).toBe(0)
    );
    expect(addresses.useContext().pagination.value.page).toBe(1);
  });

  it("AC-9 useContext().query tracks the offset as it moves both ways (write-through)", async () => {
    const { addresses } = await bootPagedCollection();

    addresses.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.pagination?.limit).toBe(2)
    );
    // See the settle-window note in the "moves the outbound offset" spec
    // above — `nextPage()` needs one macrotask yield past the `limit` flip.
    await new Promise(resolve => setTimeout(resolve, 0));

    await addresses.useActions().nextPage();
    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.pagination?.offset).toBe(2)
    );

    await addresses.useActions().prevPage();
    await vi.waitFor(() =>
      expect(addresses.useContext().query.value.pagination?.offset).toBe(0)
    );
  });
});

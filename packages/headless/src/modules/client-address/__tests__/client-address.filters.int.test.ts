// -----------------------------------------------------------------------------
/**
 * @fileoverview narrowing my addresses by typing (integration, AC-8)
 *
 * ## Job To Be Done
 * Prove the free-text filter reaches the WIRE as the schema-declared
 * `filter[name|like]` key and that clearing it removes the key entirely
 * rather than leaving a stale one behind — a filter held only in local state
 * would narrow nothing, and a lingering `filter[name|like]` narrows a list the
 * user has stopped searching.
 *
 * ## FE-3103 wire-shape correction
 * This module's translator spells the free-text filter `filter[name|like]`
 * (AJV-validated against `useQuerySchema()`'s `filters.name.like` branch), not
 * the bare `query=` this file asserted before FE-3103. `query=` was never a
 * key this module's own translator produced on the real wire — measured
 * directly against the replayed API, `filters.query("London")` has always
 * gone out as `filter[name|like]=%London%`. Corrected here, in place, rather
 * than left green on a param the wire never carried.
 *
 * ## Recording note
 * `pnpm fixtures:generate client-address` captured the filtered request against
 * real staging; that API answers the address collection with the full list
 * regardless of the filter, so the fixture body is honestly the same
 * collection. The claim under test is the REQUEST — which is where AC-8's
 * capability lives and where a no-op implementation is caught.
 *
 * ## What Breaks If These Fail
 * The address search box narrows nothing, keeps narrowing after it is
 * cleared, or silently regresses onto a param the API does not read.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  observeAddressRequests,
  seedClientSession
} from "./client-address.int-helpers";
import { filter, some } from "lodash-es";

// -----------------------------------------------------------------------------

describe("client addresses collection — I narrow my addresses by typing (AC-8)", () => {
  it("AC-8 re-issues the list request carrying filter[name|like]=%<what I typed>%", async () => {
    await seedClientSession();
    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();
    const observed = observeAddressRequests();

    await addresses.useActions().filters.query("London");

    await vi.waitFor(() =>
      expect(
        some(
          observed.all(),
          request =>
            new URL(request.url).searchParams.get("filter[name|like]") ===
            "%London%"
        )
      ).toBe(true)
    );
    observed.stop();
  });

  it("AC-8 clearing then narrowing again carries the NEW search — no stale value survives the clear", async () => {
    await seedClientSession();
    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();

    const observed = observeAddressRequests();
    await addresses.useActions().filters.query("London");
    await vi.waitFor(() =>
      expect(
        some(
          observed.all(),
          request =>
            new URL(request.url).searchParams.get("filter[name|like]") ===
            "%London%"
        )
      ).toBe(true)
    );
    const beforeClear = observed.all().length;

    // Returning to the unfiltered criteria is a CACHE HIT (it is the exact
    // combination `isReady()` already fetched), so no request fires for the
    // clear step itself — asserted instead through the requests that follow,
    // sliced from `beforeClear` so a stale "London" surviving the clear shows
    // up on the Paris request rather than being masked by the earlier one.
    await addresses.useActions().filters.query("");
    await addresses.useActions().filters.query("Paris");

    await vi.waitFor(() =>
      expect(
        some(
          observed.all().slice(beforeClear),
          request =>
            new URL(request.url).searchParams.get("filter[name|like]") ===
            "%Paris%"
        )
      ).toBe(true)
    );
    observed.stop();
    for (const request of observed.all().slice(beforeClear)) {
      expect(
        new URL(request.url).searchParams.get("filter[name|like]")
      ).not.toBe("%London%");
    }
  });

  it("AC-8 never regresses onto the pre-FE-3103 bare query= key", async () => {
    await seedClientSession();
    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();
    const observed = observeAddressRequests();

    await addresses.useActions().filters.query("London");

    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();
    for (const request of observed.all()) {
      const params = new URL(request.url).searchParams;
      for (const legacyKey of ["query", "q", "search"]) {
        expect(params.get(legacyKey)).toBeNull();
      }
    }
  });

  it("AC-8 keeps the filtered read on the same client's own resource", async () => {
    const { clientId } = await seedClientSession();
    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();
    const observed = observeAddressRequests();

    await addresses.useActions().filters.query("London");

    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();
    for (const request of observed.all()) {
      expect(new URL(request.url).pathname).toBe(
        `/api/clients/${clientId}/addresses`
      );
    }
  });

  it("AC-8 clearing the search removes the filter key entirely — no stale filter[name|like] survives on the next request", async () => {
    await seedClientSession();
    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();
    const observed = observeAddressRequests();

    await addresses.useActions().filters.query("London");
    await vi.waitFor(() =>
      expect(
        some(
          observed.all(),
          request =>
            new URL(request.url).searchParams.get("filter[name|like]") ===
            "%London%"
        )
      ).toBe(true)
    );

    await addresses.useActions().filters.query("");
    // Returning to the unfiltered criteria is a cache hit (the boot fetch
    // already fetched it), so no request fires for the clear itself — force
    // a fresh request through an orthogonal criteria change and inspect
    // THAT request's keys, the same technique the deleted original used.
    addresses.useActions().setCriteria({ pagination: { limit: 2 } });
    await vi.waitFor(() =>
      expect(
        some(
          observed.all(),
          request => new URL(request.url).searchParams.get("limit") === "2"
        )
      ).toBe(true)
    );
    observed.stop();

    const lastRequest = observed.all().at(-1);
    expect(
      filter([...new URL(lastRequest!.url).searchParams.keys()], key =>
        key.startsWith("filter[")
      )
    ).toEqual([]);
  });
});

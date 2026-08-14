// -----------------------------------------------------------------------------
/**
 * @fileoverview narrowing my addresses by typing (integration, AC-8)
 *
 * ## Job To Be Done
 * Prove the free-text filter reaches the WIRE and that clearing it removes the
 * key entirely rather than leaving an empty one behind — a filter held only in
 * local state would narrow nothing, and a lingering `query=` narrows a list the
 * user has stopped searching.
 *
 * ## Recording note
 * `pnpm fixtures:generate client-address` captured the filtered request against
 * real staging; that API answers the address collection with the full list
 * regardless of `query`, so the fixture body is honestly the same collection.
 * The claim under test is the REQUEST — which is where AC-8's capability lives
 * and where a no-op implementation is caught.
 *
 * ## What Breaks If These Fail
 * The address search box narrows nothing, or keeps narrowing after it is
 * cleared.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  observeAddressRequests,
  seedClientSession
} from "./client-address.int-helpers";

// -----------------------------------------------------------------------------

describe("client addresses collection — I narrow my addresses by typing (AC-8)", () => {
  it("AC-8 re-issues the list request carrying query=<what I typed>", async () => {
    await seedClientSession();
    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();
    const observed = observeAddressRequests();

    await addresses.useActions().filters.query("London");

    await vi.waitFor(() =>
      expect(
        observed
          .all()
          .some(
            request =>
              new URL(request.url).searchParams.get("query") === "London"
          )
      ).toBe(true)
    );
    observed.stop();
  });

  it("AC-8 drops the query key entirely when the search is cleared — never a lingering empty one", async () => {
    await seedClientSession();
    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();
    await addresses.useActions().filters.query("London");

    const observed = observeAddressRequests();
    await addresses.useActions().filters.query("");

    await vi.waitFor(() => expect(observed.all().length).toBeGreaterThan(0));
    observed.stop();
    const last = observed.all().at(-1);
    expect(new URL(last!.url).searchParams.has("query")).toBe(false);
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
});

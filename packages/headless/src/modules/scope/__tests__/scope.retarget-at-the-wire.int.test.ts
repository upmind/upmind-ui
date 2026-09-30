// -----------------------------------------------------------------------------
/**
 * @fileoverview scope identity at the wire — the client a request is built
 * around, resolved through the scope seam and read off the outbound request
 * (integration, AC-9).
 *
 * ## Job To Be Done
 * `scope.feature`'s `@AC-9` promises a read ADDRESSES the client the scope
 * resolved and CARRIES the session credentials chosen for it. That is a WIRE
 * contract, so it is read off the outbound request — URL plus auth transport —
 * never a resolved value and never a response payload. The scope module owns
 * the `resolveClientId` seam every client-scoped module targets its request
 * through; this proves the seam's answer reaches the wire, driven through a real
 * consumer composable (`useClientAddresses`, public surface) against the vehicle
 * module's own staging recordings.
 *
 * The discriminator is a scope naming a DIFFERENT client from the one the
 * session holds. While the two agree, every branch produces the same URL and the
 * proof cannot tell which source built it; `.for('client', other)` forces them
 * apart, so a request built from the session's own `activeUser` addresses the
 * wrong client and goes RED. All three CELL-1 request families are covered — the
 * list read, the set-default and the delete.
 *
 * ## What Breaks If These Fail
 * A request goes out addressed to the session's own client instead of the one
 * the scope resolved — one actor served another's view. That is FE-2824, and an
 * optional context id (FE-3239) is the change that can reintroduce it with
 * nothing going red.
 *
 * @anchor scope.feature
 * @anchor AC-9
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import {
  ClientAddressesContextTypes,
  useClientAddresses
} from "../../client-address";
import { ScopeActorTypes } from "../scope.types";
import {
  assertBearerToken,
  assertNoActingAsHeaders,
  observeAddressRequests,
  recordedAddressId,
  resetScopes,
  seedClientSession
} from "./scope.int-helpers";
import "./setup.integration";

// -----------------------------------------------------------------------------

/** A client id this session never had — the retarget discriminator (a uuid, so
 * the outbound URL segment templates to the recorded list fixture). */
const OTHER_CLIENT_ID = "11111111-2222-3333-4444-555555555555";

const path = (url: string): string => new URL(url).pathname;

// -----------------------------------------------------------------------------

describe("scope identity at the wire (AC-9)", () => {
  beforeEach(() => {
    clearSessionCookies();
    sessionStorage.clear();
  });

  afterEach(async () => {
    resetScopes();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  it("@AC-9 addresses the actor's own account when the scope names no entity", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const observed = observeAddressRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    expect(observed.all().length).toBeGreaterThan(0);
    for (const request of observed.all()) {
      expect(path(request.url)).toBe(`/api/clients/${clientId}/addresses`);
      assertBearerToken(request, accessToken);
      assertNoActingAsHeaders(request.headers);
    }
  });

  it("@AC-9 addresses the named client, as that client, with no acting-as header, while the session's own activeUser is a different client", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const observed = observeAddressRequests();

    const addresses = useClientAddresses()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    expect(observed.all().length).toBeGreaterThan(0);
    for (const request of observed.all()) {
      expect(path(request.url)).toBe(
        `/api/clients/${OTHER_CLIENT_ID}/addresses`
      );
      expect(request.url).not.toContain(clientId);
      assertBearerToken(request, accessToken);
      assertNoActingAsHeaders(request.headers);
    }
  });

  it("@AC-9 sends the delete and the set-default to the named client, not the session's own", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const addressId = recordedAddressId();
    const observed = observeAddressRequests();

    const addresses = useClientAddresses()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressesContextTypes.CLIENT, OTHER_CLIENT_ID);

    await addresses
      .useActions()
      .setDefault(addressId)
      .catch(() => undefined);
    await addresses
      .useActions()
      .remove(addressId)
      .catch(() => undefined);

    await vi.waitFor(() => {
      expect(observed.byMethod("PUT").length).toBeGreaterThan(0);
      expect(observed.byMethod("DELETE").length).toBeGreaterThan(0);
    });
    observed.stop();

    for (const request of [
      ...observed.byMethod("PUT"),
      ...observed.byMethod("DELETE")
    ]) {
      expect(path(request.url)).toBe(
        `/api/clients/${OTHER_CLIENT_ID}/addresses/${addressId}`
      );
      expect(request.url).not.toContain(clientId);
      assertBearerToken(request, accessToken);
      assertNoActingAsHeaders(request.headers);
    }
  });
});

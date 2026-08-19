// -----------------------------------------------------------------------------
/**
 * @fileoverview client addresses auth guard — nothing of mine is touched while
 * I am signed out (integration, AC-3/AC-11/AC-13)
 *
 * ## Job To Be Done
 * Prove the request is NEVER ISSUED. Parity row L1's read-back law is explicit:
 * asserting that a rejection surfaced DOES NOT DISCRIMINATE — the pre-fix
 * inverted guard (`isAuthenticated || !clientId`) resolved `true` for an
 * unauthenticated session with no client id and the call failed *downstream*,
 * so a rejection-shaped assertion passed both before and after. Every
 * assertion below is therefore on an EMPTY capture log, with the rejection
 * asserted only as an additional property, never as the proof.
 *
 * Both limbs of the addressability predicate are exercised: signed out
 * entirely, and authenticated-but-with-no-resolved-client-id (the second limb,
 * which the `client-id-limb` control mutates).
 *
 * ## What Breaks If These Fail
 * A signed-out session fires `DELETE clients/undefined/addresses/{id}` at the
 * API — the live defect this story closes (parity rows L1, W2).
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  logoutClientSession,
  observeAllRequests,
  recordedRows,
  resetClientAddressScopes,
  seedAuthenticatedSessionWithoutClientId,
  seedClientSession
} from "./client-address.int-helpers";

// -----------------------------------------------------------------------------

/** Every observed request that touched this module's resource. */
function addressRequests(observed: { all: () => { url: string }[] }): string[] {
  return observed
    .all()
    .map(request => request.url)
    .filter(url => url.includes("/addresses"));
}

beforeEach(() => {
  resetClientAddressScopes();
});

// -----------------------------------------------------------------------------

describe("client addresses auth guard — signed out, nothing is looked up (AC-3)", () => {
  it("AC-3 issues NO list request at all and reports the collection unavailable", async () => {
    await seedClientSession();
    await logoutClientSession();
    const observed = observeAllRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    void addresses.useContext().data.value;
    await new Promise(resolve => setTimeout(resolve, 500));
    observed.stop();

    expect(addressRequests(observed)).toEqual([]);
    expect(addresses.useMeta().isAvailable.value).toBe(false);
  });

  it("AC-3 authenticated but with NO resolved client id is equally unavailable and equally silent", async () => {
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observeAllRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    void addresses.useContext().data.value;
    await new Promise(resolve => setTimeout(resolve, 500));
    observed.stop();

    expect(addressRequests(observed)).toEqual([]);
    expect(addresses.useMeta().isAvailable.value).toBe(false);
  });

  it("AC-3 refresh() rejects rather than reaching the wire while unaddressable", async () => {
    await seedClientSession();
    await logoutClientSession();
    const observed = observeAllRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await expect(addresses.useActions().refresh()).rejects.toBeDefined();
    observed.stop();

    expect(addressRequests(observed)).toEqual([]);
  });
});

describe("client addresses auth guard — signed out, nothing of mine is deleted (AC-11)", () => {
  it("AC-11 leaves the capture log EMPTY when remove() is called while signed out", async () => {
    const { secondary } = recordedRows();
    await seedClientSession();
    await logoutClientSession();
    const observed = observeAllRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await expect(
      addresses.useActions().remove(secondary.id)
    ).rejects.toBeDefined();
    await new Promise(resolve => setTimeout(resolve, 300));
    observed.stop();

    expect(addressRequests(observed)).toEqual([]);
  });

  it("AC-11 leaves the capture log EMPTY when the session authenticates but resolves no client id", async () => {
    const { secondary } = recordedRows();
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observeAllRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await expect(
      addresses.useActions().remove(secondary.id)
    ).rejects.toBeDefined();
    await new Promise(resolve => setTimeout(resolve, 300));
    observed.stop();

    expect(addressRequests(observed)).toEqual([]);
  });
});

describe("client addresses auth guard — signed out, my default is not changed (AC-13)", () => {
  it("AC-13 leaves the capture log EMPTY when setDefault() is called while signed out", async () => {
    const { secondary } = recordedRows();
    await seedClientSession();
    await logoutClientSession();
    const observed = observeAllRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await expect(
      addresses.useActions().setDefault(secondary.id)
    ).rejects.toBeDefined();
    await new Promise(resolve => setTimeout(resolve, 300));
    observed.stop();

    expect(addressRequests(observed)).toEqual([]);
  });

  it("AC-13 leaves the capture log EMPTY when the session authenticates but resolves no client id", async () => {
    const { secondary } = recordedRows();
    await seedAuthenticatedSessionWithoutClientId();
    const observed = observeAllRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await expect(
      addresses.useActions().setDefault(secondary.id)
    ).rejects.toBeDefined();
    await new Promise(resolve => setTimeout(resolve, 300));
    observed.stop();

    expect(addressRequests(observed)).toEqual([]);
  });
});

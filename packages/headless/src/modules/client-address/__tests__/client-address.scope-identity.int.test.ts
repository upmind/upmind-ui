// -----------------------------------------------------------------------------
/**
 * @fileoverview scope identity — the address I read and write belongs to the
 * account the scope resolved (integration, AC-2/AC-30)
 *
 * ## Job To Be Done
 * The A7 read-back, in full: the request URL's `{clientId}` segment is the
 * SCOPE-resolved client, the `Authorization` header carries that client
 * session's own token, and NO acting-as header is sent. A response payload is
 * never sufficient proof of identity, so nothing here asserts on one.
 *
 * AC-30 adds the discriminator that separates a real seam from five call sites
 * each re-reading the session (parity rows W12/L10 — the module's live
 * FE-2824): once a scope has resolved, moving the session onto a DIFFERENT
 * client mid-flight must not move the request. An implementation that reads
 * `activeUser` at request time sends the new id; one that reads the seam sends
 * the resolved one.
 *
 * ## Why AC-2 needs its own discriminator
 * With one live actor and a bare `.as(CLIENT)`, the scope resolves to the SAME
 * id the session holds, so a URL assertion taken while the two agree passes
 * whichever source the code read: the first two specs are AC-2's ordinary-path
 * coverage and CANNOT detect the seam's removal on their own. The three that
 * follow force the two sources apart FIRST, then assert the URL — the scope
 * carries `.for(CLIENT, other)` (`CLIENT_ADDRESSES_SCOPE_MATRIX`, design D-3:
 * the resolved scope context, session-self only as fallback) while the session's
 * own `activeUser` stays this client. Reading the session at the call site
 * sends the session's id and goes RED; reading the seam sends the scope's.
 * All three CELL-1 request families are covered — the list read, the delete and
 * the set-default — plus a scope resolved after the session moved, which is
 * what keeps the seam from being satisfiable by a frozen id.
 *
 * ## What is constructed, and why
 * The second client id has no recording — a capture of this staging client
 * always carries this client's id — so `switchActiveClientId` puts a different
 * id on the RECORDED session body, and the retargeted scope's list is the
 * RECORDED rows served under that id. That single field is the boundary being
 * tested; everything else, including the token, stays verbatim.
 *
 * ## What Breaks If These Fail
 * A client reads or writes another account's addresses, or the request goes
 * out as the wrong identity — the failure class this whole story exists to
 * close.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  ClientAddressContextTypes,
  ClientAddressesContextTypes,
  useClientAddressManager
} from "..";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  assertNoActingAsHeaders,
  installAddressHandler,
  installAddressesListHandler,
  installLookupHandlers,
  observeAddressRequests,
  recorded,
  recordedRows,
  resetClientAddressScopes,
  seedClientSession,
  switchActiveClientId
} from "./client-address.int-helpers";
import { server } from "./setup.integration";
import type { ObservedRequest } from "./client-address.int-helpers";

// -----------------------------------------------------------------------------

/** A client id this session never had — the retarget discriminator. */
const OTHER_CLIENT_ID = "11111111-2222-3333-4444-555555555555";

/**
 * Captures every per-address write, whatever client id it goes to, so the URL
 * a wrong-source read produces is observed rather than 404'd by a handler
 * pinned to the right client.
 */
function captureAnyWrite(): { seen: () => ObservedRequest[] } {
  const seen: ObservedRequest[] = [];
  const record = (request: Request): void => {
    seen.push({
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });
  };

  server?.use(
    http.put("*/clients/:clientId/addresses/:addressId", ({ request }) => {
      record(request);
      return HttpResponse.json(recorded.updated(), { status: 200 });
    }),
    http.delete("*/clients/:clientId/addresses/:addressId", ({ request }) => {
      record(request);
      return HttpResponse.json(recorded.removed(), { status: 200 });
    })
  );

  return { seen: () => seen };
}

/** Opens the collection over the recorded rows and waits for it to settle. */
async function openCollection() {
  const { clientId, accessToken } = await seedClientSession();
  const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
  await vi.waitFor(() =>
    expect(addresses.useContext().data.value.length).toBeGreaterThan(0)
  );
  return { addresses, clientId, accessToken };
}

// -----------------------------------------------------------------------------

describe("scope identity — I only ever see my own addresses (AC-2)", () => {
  it("AC-2 sends the list request to the SCOPE-resolved client, as that client, with no acting-as header", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const observed = observeAddressRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    const request = observed.first();
    assertClientIdentityTransport(request, clientId, accessToken);
    expect(new URL(request.url).pathname).toBe(
      `/api/clients/${clientId}/addresses`
    );
  });

  it("AC-2 addresses no other client's resource on any request it makes", async () => {
    const { clientId } = await seedClientSession();
    const observed = observeAddressRequests();

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    expect(observed.all().length).toBeGreaterThan(0);
    for (const request of observed.all()) {
      expect(new URL(request.url).pathname).toContain(`/clients/${clientId}/`);
      assertNoActingAsHeaders(request.headers);
    }
  });
});

describe("scope identity — the list I read is the account the SCOPE resolved (AC-2)", () => {
  it("AC-2 reads the SCOPE-CONTEXT client's list while the session's own activeUser is a different client", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { primary } = recordedRows();
    installAddressesListHandler(server, OTHER_CLIENT_ID, [primary]);
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
      expect(new URL(request.url).pathname).toBe(
        `/api/clients/${OTHER_CLIENT_ID}/addresses`
      );
      expect(request.url).not.toContain(clientId);
      expect(
        request.headers.authorization ?? request.headers.Authorization
      ).toBe(`Bearer ${accessToken}`);
      assertNoActingAsHeaders(request.headers);
    }
  });

  it("AC-2 sends the delete and the set-default to the SCOPE-CONTEXT client, not the session's own", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const { primary, secondary } = recordedRows();
    installAddressesListHandler(server, OTHER_CLIENT_ID, [primary, secondary]);
    const addresses = useClientAddresses()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressesContextTypes.CLIENT, OTHER_CLIENT_ID);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value).toHaveLength(2)
    );
    const writes = captureAnyWrite();

    await addresses
      .useActions()
      .setDefault(secondary.id)
      .catch(() => undefined);
    await addresses
      .useActions()
      .remove(secondary.id)
      .catch(() => undefined);

    expect(
      writes
        .seen()
        .map(request => request.method)
        .sort()
    ).toEqual(["DELETE", "PUT"]);
    for (const request of writes.seen()) {
      expect(new URL(request.url).pathname).toBe(
        `/api/clients/${OTHER_CLIENT_ID}/addresses/${secondary.id}`
      );
      expect(request.url).not.toContain(clientId);
      expect(
        request.headers.authorization ?? request.headers.Authorization
      ).toBe(`Bearer ${accessToken}`);
      assertNoActingAsHeaders(request.headers);
    }
  });

  it("AC-2 addresses the NEW client when the scope is resolved AFTER the session moved", async () => {
    const { clientId } = await openCollection();
    const { primary } = recordedRows();

    await switchActiveClientId(OTHER_CLIENT_ID);
    resetClientAddressScopes();
    installAddressesListHandler(server, OTHER_CLIENT_ID, [primary]);
    const observed = observeAddressRequests();

    const moved = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(moved.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    expect(observed.all().length).toBeGreaterThan(0);
    for (const request of observed.all()) {
      expect(new URL(request.url).pathname).toBe(
        `/api/clients/${OTHER_CLIENT_ID}/addresses`
      );
      expect(request.url).not.toContain(clientId);
    }
  });
});

describe("scope identity — the editor edits the account it was opened for (AC-30)", () => {
  it("AC-30 keeps the RESOLVED client on the save URL after the session moves to another client mid-flight", async () => {
    const { clientId, accessToken } = await seedClientSession();
    installLookupHandlers(server);
    const row = recorded.one().data;
    installAddressHandler(server, clientId, row);
    const puts = captureAnyWrite();

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, row.id);
    await manager.useActions().isReady();

    manager.useActions().input({ address: { city: "Manchester" } } as never);
    await new Promise(resolve => setTimeout(resolve, 900));

    await switchActiveClientId(OTHER_CLIENT_ID);
    await manager.useActions().update();

    expect(puts.seen()).toHaveLength(1);
    const request = puts.seen()[0];
    expect(new URL(request.url).pathname).toBe(
      `/api/clients/${clientId}/addresses/${row.id}`
    );
    expect(new URL(request.url).pathname).not.toContain(OTHER_CLIENT_ID);
    assertClientIdentityTransport(request, clientId, accessToken);
  });

  it("AC-30 keeps the resolved client on the per-address READ too, not just the write", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    const row = recorded.one().data;
    installAddressHandler(server, clientId, row);
    const observed = observeAddressRequests();

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, row.id);
    await manager.useActions().isReady();
    await switchActiveClientId(OTHER_CLIENT_ID);
    observed.stop();

    expect(observed.all().length).toBeGreaterThan(0);
    for (const request of observed.all()) {
      expect(new URL(request.url).pathname).toContain(`/clients/${clientId}/`);
      expect(new URL(request.url).pathname).not.toContain(OTHER_CLIENT_ID);
    }
  });
});

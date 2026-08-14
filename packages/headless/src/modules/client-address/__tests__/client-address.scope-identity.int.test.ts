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
 * ## What is constructed, and why
 * The second client id has no recording — a capture of this staging client
 * always carries this client's id — so `switchActiveClientId` puts a different
 * id on the RECORDED session body. That single field is the boundary being
 * tested; everything else, including the token, stays verbatim.
 *
 * ## What Breaks If These Fail
 * A client reads or writes another account's addresses, or the request goes
 * out as the wrong identity — the failure class this whole story exists to
 * close.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ClientAddressContextTypes, useClientAddressManager } from "..";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  assertNoActingAsHeaders,
  installAddressHandler,
  installLookupHandlers,
  observeAddressRequests,
  recorded,
  seedClientSession,
  switchActiveClientId
} from "./client-address.int-helpers";
import { server } from "./setup.integration";
import type { ObservedRequest } from "./client-address.int-helpers";

// -----------------------------------------------------------------------------

/** A client id this session never had — the retarget discriminator. */
const OTHER_CLIENT_ID = "11111111-2222-3333-4444-555555555555";

/** Captures the PUT the manager issues, whatever URL it goes to. */
function captureAnyPut(): { seen: () => ObservedRequest[] } {
  const seen: ObservedRequest[] = [];
  server?.use(
    http.put("*/clients/:clientId/addresses/:addressId", ({ request }) => {
      seen.push({
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers.entries())
      });
      return HttpResponse.json(recorded.updated(), { status: 200 });
    })
  );
  return { seen: () => seen };
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

describe("scope identity — the editor edits the account it was opened for (AC-30)", () => {
  it("AC-30 keeps the RESOLVED client on the save URL after the session moves to another client mid-flight", async () => {
    const { clientId, accessToken } = await seedClientSession();
    installLookupHandlers(server);
    const row = recorded.one().data;
    installAddressHandler(server, clientId, row);
    const puts = captureAnyPut();

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

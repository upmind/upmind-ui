// -----------------------------------------------------------------------------
/**
 * @fileoverview the client an outbound request is built around, once a context
 * id is optional (integration, AC-9)
 *
 * ## Job To Be Done
 * `scope.feature`'s `@AC-9` promises the request ADDRESSES the named client and
 * CARRIES the credentials chosen for that read. That is a wire contract, so it
 * is read off the outbound request — URL plus auth transport, never a resolved
 * value and never a response payload (A7).
 *
 * FE-3239 makes `ScopeContext.id` optional, which widens the seam every
 * client-scoped module resolves its request target through. This story
 * therefore owns a wire read-back of BOTH arms of that seam rather than
 * borrowing client-address's own AC-2 oracle
 * (`client-address.scope-identity.int.test.ts`), which predates the widening
 * and covers only the named arm.
 *
 * The two cases are a pair, and the pair is the discriminator: one seam, two
 * context shapes, two DIFFERENT outbound clients. A seam resolving `undefined`
 * from the id-less context fails the first; one hardwiring the session's own
 * client fails the second.
 *
 * ## The id-less call, and why it is spelled with a cast
 * `CLIENT_ADDRESSES_SCOPE_MATRIX` declares `client` a RETARGET member, so the
 * type split refuses the one-argument form here on purpose — that refusal is
 * `@AC-2`, proven in `scope.surface.test.ts`. The shape stays reachable at
 * RUNTIME and design §9 records the decision to let it through: a `/for/client`
 * URL with no id now parses valid, and the scenario port then calls `.for(type)`
 * with one argument. The cast reaches that same runtime step. It is the input
 * under test, not a way around a failing assertion.
 *
 * ## What Breaks If These Fail
 * A request goes out addressed to `undefined`, to a context type, or to the
 * wrong client — one actor served another's view. That is FE-2824, and an
 * optional context id is the change that can reintroduce it with nothing
 * going red.
 *
 * @anchor scope.feature
 * @anchor AC-9
 */

import { describe, expect, it, vi } from "vitest";
import { ClientAddressesContextTypes, useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  assertClientIdentityTransport,
  assertNoActingAsHeaders,
  installAddressesListHandler,
  observeAddressRequests,
  recordedRows,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

/** A client id this session never had — the named-arm discriminator. */
const OTHER_CLIENT_ID = "11111111-2222-3333-4444-555555555555";

// -----------------------------------------------------------------------------

describe("the client an optional context id addresses (AC-9)", () => {
  it("@AC-9 addresses the session's own client when the scope names a client with no entity", async () => {
    const { clientId, accessToken } = await seedClientSession();
    const observed = observeAddressRequests();

    const addresses = useClientAddresses()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressesContextTypes.CLIENT as never);

    await vi.waitFor(() =>
      expect(addresses.useContext().data.value.length).toBeGreaterThan(0)
    );
    observed.stop();

    expect(observed.all().length).toBeGreaterThan(0);

    for (const request of observed.all()) {
      assertClientIdentityTransport(request, clientId, accessToken);
      expect(new URL(request.url).pathname).toBe(
        `/api/clients/${clientId}/addresses`
      );
      expect(request.url).not.toContain("undefined");
      expect(request.url).not.toContain(
        `/clients/${ClientAddressesContextTypes.CLIENT}/`
      );
    }
  });

  it("@AC-9 addresses the named client, as that client, when the scope names one", async () => {
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
});

/**
 * @fileoverview delegates — an owner invites another party (integration)
 *
 * ## Job To Be Done
 * Drive the REAL `inviteClientDelegate` service against MSW-replayed,
 * staging-captured fixtures taken while a real client-portal invitation was
 * issued: the invitation is addressed to the party the owner named and lands
 * awaiting their acceptance (AC-DL3), re-inviting a party who already holds
 * access is refused (AC-DL6), and nothing the owner can see ever carries the
 * route to accept (AC-DL8).
 *
 * ## What Breaks If These Fail
 * An owner's invitation goes to the wrong address, or lands already active —
 * granting an unconfirmed stranger the run of the account without them ever
 * confirming they asked for it. A refused duplicate that resolves instead of
 * rejecting shows the owner a second grant that does not exist. And if the
 * acceptance route ever leaked onto the owner-visible record, any owner could
 * accept on the invitee's behalf — the confirmation step becomes decorative.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { inviteClientDelegate, readClientDelegates } from "..";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import {
  ACCEPT_ROUTE,
  acceptRouteFromInvitation,
  assertNamedAccountTransport,
  clearSession,
  installDelegateHandlers,
  observeDelegateRequests,
  recorded,
  seedSession
} from "./delegates.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("delegates — an owner invites another party to their account", () => {
  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    await clearSession();
  });

  afterEach(() => {
    server?.events.removeAllListeners();
  });

  it("AC-DL3 addresses the invitation to the party named and records it awaiting acceptance", async () => {
    const { clientId, accessToken } = await seedSession("owner");
    const wire = recorded.invited();
    const handlers = installDelegateHandlers();
    handlers.serveInvite({ body: wire, status: 200 });
    const observed = observeDelegateRequests();

    const grant = await inviteClientDelegate(clientId, {
      email: wire.data.invite_email,
      fullDelegate: true
    });
    observed.stop();

    assertNamedAccountTransport(observed.first(), clientId, accessToken);
    expect(observed.first().method).toBe("POST");
    expect(handlers.sentInvitation()).toMatchObject({
      delegate_email: wire.data.invite_email
    });

    expect(grant.id).toBe(wire.data.id);
    expect(grant.ownerClientId).toBe(wire.data.owner_client_id);
    expect(grant.inviteEmail).toBe(wire.data.invite_email);
    expect(grant.isFullDelegate).toBe(true);
    expect(grant.isAccepted).toBe(false);
  });

  it("AC-DL6 refuses a second invitation to a party who already holds access", async () => {
    const { clientId } = await seedSession("owner");
    const refusal = recorded.alreadyADelegate();
    const handlers = installDelegateHandlers();
    handlers.serveInvite({ body: refusal.body, status: refusal.status });

    expect(refusal.status).toBe(409);
    await expect(
      inviteClientDelegate(clientId, {
        email: recorded.acceptedList().data[0].invite_email,
        fullDelegate: true
      })
    ).rejects.toBeDefined();
  });

  it("AC-DL19 surfaces an unavailable service rather than reporting an invitation awaiting acceptance", async () => {
    const { clientId } = await seedSession("owner");
    const outage = recorded.inviteUnavailable();
    const handlers = installDelegateHandlers();
    handlers.serveInvite({ body: outage.body, status: outage.status });

    expect(outage.status).toBe(503);
    await expect(
      inviteClientDelegate(clientId, {
        email: recorded.invited().data.invite_email,
        fullDelegate: true
      })
    ).rejects.toBeDefined();
  });

  it("AC-DL8 offers the route to accept nowhere on what the owner can see", async () => {
    const { clientId } = await seedSession("owner");
    const handlers = installDelegateHandlers();
    handlers.serveList({ body: recorded.pendingList(), status: 200 });
    handlers.serveInvite({ body: recorded.invited(), status: 200 });

    const invited = await inviteClientDelegate(clientId, {
      email: recorded.invited().data.invite_email,
      fullDelegate: true
    });
    const listed = await readClientDelegates(clientId);

    expect(ACCEPT_ROUTE.test(JSON.stringify(invited))).toBe(false);
    expect(ACCEPT_ROUTE.test(JSON.stringify(listed))).toBe(false);
    expect(JSON.stringify(invited)).not.toContain(acceptRouteFromInvitation());
    expect(JSON.stringify(listed)).not.toContain(acceptRouteFromInvitation());

    // The contrast that makes the two absences above mean something: the route
    // the owner cannot see is the one the invitee's own invitation carries.
    expect(ACCEPT_ROUTE.test(recorded.invitation().data.data?.body ?? "")).toBe(
      true
    );
  });
});

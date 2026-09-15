/**
 * @fileoverview delegates — the invitee accepts (integration)
 *
 * ## Job To Be Done
 * Drive the REAL `acceptDelegateInvite` service against MSW-replayed,
 * staging-captured fixtures taken while a real invitee accepted a real
 * invitation: the route the invitee found in their OWN correspondence is the
 * route the acceptance goes out on (AC-DL7), accepting turns the outstanding
 * grant into an active one on the owner's account (AC-DL9), and a route that
 * was never issued is refused (AC-DL10).
 *
 * The acceptance route is not published on the delegate record at client
 * scope, so the invitation email is the only client-scope place it exists.
 * Every hash used below is therefore read out of the recorded invitation body,
 * exactly as a real invitee reads it — never lifted from an administrative
 * surface, which is out of scope for this module by design.
 *
 * ## What Breaks If These Fail
 * An invitee cannot take up access they were granted, or the acceptance goes
 * out against the wrong route and silently activates somebody else's
 * invitation. A 404 that resolves instead of rejecting tells an invitee their
 * access is live when no grant exists at all.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { acceptDelegateInvite } from "..";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import {
  acceptRouteFromInvitation,
  clearSession,
  installDelegateHandlers,
  observeDelegateRequests,
  recorded,
  seedSession
} from "./delegates.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("delegates — an invitee takes up the access they were offered", () => {
  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    await clearSession();
  });

  afterEach(() => {
    server?.events.removeAllListeners();
  });

  it("AC-DL7 accepts by the route the invitee's own correspondence offered them", async () => {
    await seedSession("invitee");
    const route = acceptRouteFromInvitation();
    const invitation = recorded.invitation();
    const handlers = installDelegateHandlers();
    handlers.serveAccept({ body: recorded.accepted(), status: 200 });
    const observed = observeDelegateRequests();

    await acceptDelegateInvite(route);
    observed.stop();

    expect(recorded.correspondence().data.map(row => row.id)).toContain(
      invitation.data.id
    );
    expect(invitation.data.subject).toBe("New Customer Access Invitation");
    expect(observed.all()).toHaveLength(1);
    expect(observed.first().method).toBe("PATCH");
    expect(observed.first().url).toContain(`/delegate_access/accept/${route}`);
  });

  it("AC-DL9 turns the outstanding grant on the owner's account into an active one", async () => {
    await seedSession("invitee");
    const outstanding = recorded.invited().data;
    const wire = recorded.accepted();
    const handlers = installDelegateHandlers();
    handlers.serveAccept({ body: wire, status: 200 });

    const accepted = await acceptDelegateInvite(acceptRouteFromInvitation());

    expect(outstanding.active).toBe(false);
    expect(accepted.id).toBe(outstanding.id);
    expect(accepted.isAccepted).toBe(true);
  });

  it("AC-DL10 refuses an acceptance by a route that was never issued", async () => {
    await seedSession("invitee");
    const refusal = recorded.unissuedRoute();
    const handlers = installDelegateHandlers();
    handlers.serveAccept({ body: refusal.body, status: refusal.status });

    expect(refusal.status).toBe(404);
    await expect(
      acceptDelegateInvite("notarealinvitehash")
    ).rejects.toBeDefined();
  });

  it("AC-DL20 surfaces an unavailable service rather than reporting access granted", async () => {
    await seedSession("invitee");
    const outage = recorded.acceptUnavailable();
    const handlers = installDelegateHandlers();
    handlers.serveAccept({ body: outage.body, status: outage.status });

    expect(outage.status).toBe(503);
    await expect(
      acceptDelegateInvite(acceptRouteFromInvitation())
    ).rejects.toBeDefined();
  });
});

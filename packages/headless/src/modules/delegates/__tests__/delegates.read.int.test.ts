/**
 * @fileoverview delegates — reading who holds access to an account (integration)
 *
 * ## Job To Be Done
 * Drive the REAL `readClientDelegates` service against MSW-replayed, staging-
 * captured fixtures taken while a real client-portal grant was performed:
 * an owner reads an accepted grant (AC-DL1) and an outstanding one (AC-DL4),
 * an account that has granted nothing reports none rather than failing
 * (AC-DL2), the account read is the one NAMED rather than the caller's own
 * (AC-DL5), and a caller with no claim on the account is turned away
 * (AC-DL13, AC-DL14).
 *
 * ## What Breaks If These Fail
 * An owner cannot see who holds access to their account, or worse — the read
 * is hardwired to the session's own client id (the FE-2824 shape), so naming
 * another account silently reads your own and the caller believes they are
 * looking at somebody else's delegates. A swallowed 403/401 would show an
 * empty delegate list where access was actually refused, which reads as
 * "nobody has access" when the truth is "we were not allowed to look".
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { readClientDelegates } from "..";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import {
  assertNamedAccountTransport,
  clearSession,
  installDelegateHandlers,
  observeDelegateRequests,
  recorded,
  seedSession
} from "./delegates.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("delegates — an owner reads who holds access to their own account", () => {
  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    await clearSession();
  });

  afterEach(() => {
    server?.events.removeAllListeners();
  });

  it("AC-DL1 lists a party holding accepted access on the owner's own account", async () => {
    const { clientId, accessToken } = await seedSession("owner");
    const handlers = installDelegateHandlers();
    const wire = recorded.acceptedList();
    handlers.serveList({ body: wire, status: 200 });
    const observed = observeDelegateRequests();

    const delegates = await readClientDelegates(clientId);
    observed.stop();

    assertNamedAccountTransport(observed.first(), clientId, accessToken);
    expect(delegates).toHaveLength(wire.data.length);
    expect(delegates[0].id).toBe(wire.data[0].id);
    expect(delegates[0].ownerClientId).toBe(wire.data[0].owner_client_id);
    expect(delegates[0].inviteEmail).toBe(wire.data[0].invite_email);
    expect(delegates[0].publicName).toBe(wire.data[0].public_name);
    expect(delegates[0].imageUrl).toBe(wire.data[0].image_url);
    expect(delegates[0].isFullDelegate).toBe(true);
    expect(delegates[0].isAccepted).toBe(true);
  });

  it("AC-DL4 lists a party still awaiting acceptance as not yet accepted", async () => {
    const { clientId } = await seedSession("owner");
    const handlers = installDelegateHandlers();
    const wire = recorded.pendingList();
    handlers.serveList({ body: wire, status: 200 });

    const delegates = await readClientDelegates(clientId);

    expect(delegates[0].id).toBe(wire.data[0].id);
    expect(delegates[0].inviteEmail).toBe(wire.data[0].invite_email);
    expect(delegates[0].isAccepted).toBe(false);
    expect(delegates[0].publicName).toBeNull();
  });

  it("AC-DL2 reports an account that has granted nothing as having no delegates", async () => {
    const { clientId } = await seedSession("invitee");
    const handlers = installDelegateHandlers();
    handlers.serveList({ body: recorded.emptyList(), status: 200 });

    const delegates = await readClientDelegates(clientId);

    expect(delegates).toEqual([]);
  });

  it("AC-DL5 reads the account it was NAMED, not the account the caller is signed in as", async () => {
    const { clientId: callerId } = await seedSession("invitee");
    const namedId = recorded.acceptedList().data[0].owner_client_id;
    expect(namedId).not.toBe(callerId);

    const handlers = installDelegateHandlers();
    handlers.serveList({ body: recorded.acceptedList(), status: 200 });
    const observed = observeDelegateRequests();

    await readClientDelegates(namedId);
    observed.stop();

    expect(observed.all()).toHaveLength(1);
    expect(observed.first().url).toContain(`/clients/${namedId}/delegates`);
    expect(observed.first().url).not.toContain(callerId);
  });

  it("AC-DL13 refuses a client reading an account it does not own, disclosing no delegate", async () => {
    await seedSession("invitee");
    const namedId = recorded.acceptedList().data[0].owner_client_id;
    const refusal = recorded.notTheOwner();
    const handlers = installDelegateHandlers();
    handlers.serveList({ body: refusal.body, status: refusal.status });

    expect(refusal.status).toBe(403);
    await expect(readClientDelegates(namedId)).rejects.toBeDefined();
  });

  it("AC-DL14 refuses a caller whose bearer the brand rejects, disclosing no delegate", async () => {
    const { clientId } = await seedSession("owner");
    const refusal = recorded.rejectedBearer();
    const handlers = installDelegateHandlers();
    handlers.serveList({ body: refusal.body, status: refusal.status });

    expect(refusal.status).toBe(401);
    await expect(readClientDelegates(clientId)).rejects.toBeDefined();
  });

  it("AC-DL18 surfaces an unavailable service rather than reporting an account with no delegates", async () => {
    const { clientId } = await seedSession("owner");
    const outage = recorded.readUnavailable();
    const handlers = installDelegateHandlers();
    handlers.serveList({ body: outage.body, status: outage.status });

    expect(outage.status).toBe(503);
    await expect(readClientDelegates(clientId)).rejects.toBeDefined();
  });
});

/**
 * @fileoverview delegates — the access an accepted grant puts on the invitee's
 * own identity (integration)
 *
 * ## Job To Be Done
 * Drive the REAL session store against the two `/self` captures this module
 * recorded on either side of a real acceptance — the SAME staging account,
 * before and after — so the delegated access an accepted grant confers is
 * proven on the invitee's identity, not merely on the owner's delegate list:
 * after accepting, the invitee's identity carries access to the owner's
 * account (AC-DL11); with nothing accepted, the same invitee carries none
 * (AC-DL12).
 *
 * This is the pair FE-3036 exists to produce. Before this capture, every
 * recorded identity in the repo carried an absent delegated-access map, so the
 * populated branch had no fixture and could not be proven at all.
 *
 * ## What Breaks If These Fail
 * An invitee who accepted an invitation signs in and sees only their own
 * account — the access they were granted is invisible, so the whole delegate
 * feature is inert from the invitee's side. In the other direction, a client
 * who was granted nothing appears to hold access to an account that never
 * offered it.
 *
 * ## Disclosed scope
 * Today's staging grant is account-level, so the recorded map carries the
 * account key ALONE. Per-product and per-ticket grants ride FE-3041 (DG-2);
 * no stand-in for them is invented here.
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { clearSessionCookies } from "../../../__tests__/int-test-helpers";
import { useActiveSession } from "../../session-store";
import { clearSession, recorded, seedSession } from "./delegates.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("delegates — accepted access on the invitee's own identity", () => {
  beforeEach(async () => {
    clearSessionCookies();
    sessionStorage.clear();
    await clearSession();
  });

  afterEach(() => {
    server?.events.removeAllListeners();
  });

  it("AC-DL11 carries delegated access to the account whose invitation was accepted", async () => {
    const grantedBy = recorded.acceptedList().data[0].owner_client_id;
    const { clientId } = await seedSession("delegated-invitee");

    const session = useActiveSession().useContext();

    expect(clientId).not.toBe(grantedBy);
    expect(session.delegatedIds.value).toEqual(
      recorded.delegatedSelf().data.delegated_ids
    );
    expect(session.delegatedIds.value.client).toContain(grantedBy);
  });

  it("AC-DL12 carries no delegated access for the same invitee before any acceptance", async () => {
    const { clientId } = await seedSession("invitee");

    const session = useActiveSession().useContext();

    expect(clientId).toBe(recorded.delegatedSelf().data.actor.id);
    expect(recorded.undelegatedSelf().data.delegated_ids).toBeNull();
    expect(session.delegatedIds.value).toEqual({});
  });
});

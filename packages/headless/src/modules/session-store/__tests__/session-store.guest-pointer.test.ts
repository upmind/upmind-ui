/**
 * @fileoverview Guest pointer resolution (unit)
 *
 * ## Job To Be Done
 * Pin the pure half of FE-3087: `resolveActiveSession` honours a guest pointer
 * backed by a real pooled guest session through the SAME branch it uses for
 * client and staff, and the guest FLOOR never claims the pointer. No store
 * boot, no cookies, no network.
 *
 * ## What Breaks If These Fail
 * A user who chose "browse as guest" is thrown back to their client session on
 * the next store write; or, inverted, a guest nobody chose becomes sticky and
 * stops upgrading when that user logs in in another tab.
 */

import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { AccessRoleTypes } from "@upmind-automation/types";
// Intra-module import: the resolver is the module-private pure function the
// design makes guest-inclusive, and it is not re-exported through the barrel.
import { resolveActiveSession } from "../session-store.store";
import type { SessionEntry, SessionState } from "../session-store.types";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

const GUEST_KEY = "9f1c6c1e-1f4b-4f4a-9a2e-0d4a5b6c7d8e";

function entry(scope: AccessRoleTypes, token: IToken): SessionEntry {
  return { scope, token };
}

function state(overrides: Partial<SessionState>): SessionState {
  return {
    guestSessions: {},
    clientSessions: {},
    staffSessions: {},
    activeActor: AccessRoleTypes.GUEST,
    impersonatedSessions: {},
    initialised: true,
    loading: false,
    ...overrides
  };
}

// -----------------------------------------------------------------------------

describe("resolveActiveSession — guest as a pooled session", () => {
  const guestToken = getFixtureBody<IToken>("post-oauth-access-token-guest", {
    recordingsDir
  });
  const clientToken = getFixtureBody<IToken>("post-oauth-access-token-client", {
    recordingsDir
  });
  const clientId = clientToken.actor_id as string;

  it("honours a guest pointer backed by a pooled guest session over a signed-in client @AC-G2", () => {
    const resolved = resolveActiveSession(
      state({
        activeActor: AccessRoleTypes.GUEST,
        activeSessionId: GUEST_KEY,
        guestSessions: {
          [GUEST_KEY]: entry(AccessRoleTypes.GUEST, guestToken)
        },
        clientSessions: {
          [clientId]: entry(AccessRoleTypes.CLIENT, clientToken)
        }
      })
    );

    expect(resolved.activeActor).toBe(AccessRoleTypes.GUEST);
    expect(resolved.activeSessionId).toBe(GUEST_KEY);
  });

  it("honours the guest pointer among several pooled guest sessions @AC-G11", () => {
    // R8: the pool is no longer capped at the one cookie-backed guest, so the
    // pointer has to win over insertion order rather than agree with it.
    const otherKey = "2b7f0a44-6b3e-4f52-8a10-3c5d9e2f7a61";
    const resolved = resolveActiveSession(
      state({
        activeActor: AccessRoleTypes.GUEST,
        activeSessionId: otherKey,
        guestSessions: {
          [GUEST_KEY]: entry(AccessRoleTypes.GUEST, guestToken),
          [otherKey]: entry(AccessRoleTypes.GUEST, guestToken)
        }
      })
    );

    expect(resolved.activeActor).toBe(AccessRoleTypes.GUEST);
    expect(resolved.activeSessionId).toBe(otherKey);
  });

  it("drops a guest pointer that names no pooled guest session and falls to the client @AC-G13", () => {
    const resolved = resolveActiveSession(
      state({
        activeActor: AccessRoleTypes.GUEST,
        activeSessionId: GUEST_KEY,
        guestSessions: {},
        clientSessions: {
          [clientId]: entry(AccessRoleTypes.CLIENT, clientToken)
        }
      })
    );

    expect(resolved.activeActor).toBe(AccessRoleTypes.CLIENT);
    expect(resolved.activeSessionId).toBe(clientId);
  });

  it("leaves the pointer unclaimed when guest is the floor rather than a choice @AC-G5", () => {
    const resolved = resolveActiveSession(
      state({
        activeActor: AccessRoleTypes.GUEST,
        guestSessions: {
          [GUEST_KEY]: entry(AccessRoleTypes.GUEST, guestToken)
        }
      })
    );

    expect(resolved.activeActor).toBe(AccessRoleTypes.GUEST);
    expect(resolved.activeSessionId).toBeUndefined();
  });

  it("prefers a signed-in client over an unchosen pooled guest session @AC-G23", () => {
    const resolved = resolveActiveSession(
      state({
        activeActor: AccessRoleTypes.GUEST,
        guestSessions: {
          [GUEST_KEY]: entry(AccessRoleTypes.GUEST, guestToken)
        },
        clientSessions: {
          [clientId]: entry(AccessRoleTypes.CLIENT, clientToken)
        }
      })
    );

    expect(resolved.activeActor).toBe(AccessRoleTypes.CLIENT);
    expect(resolved.activeSessionId).toBe(clientId);
  });
});

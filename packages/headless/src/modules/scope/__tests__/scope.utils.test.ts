// -----------------------------------------------------------------------------
/**
 * @fileoverview scope.utils — actor resolution & scope-key generation (unit)
 *
 * ## Job To Be Done
 * Prove the two pure decisions every scoped composable is built on:
 *   1. `resolveSelfActor` — turning the ergonomic `SELF` alias into the concrete
 *      actor the current session belongs to (ADR-001 §5 "Session Lookup",
 *      §"self means use the current session actor").
 *   2. `generateScopeKey` — deriving the singleton registry key from a scope so
 *      that distinct scopes never collide and identical scopes always match
 *      (ADR-001 §4 actor→context matrix footprint, §8 singleton behaviour).
 *
 * ## What Breaks If These Fail
 * A `.as('self')` call binds to the wrong actor (a client instance mints staff
 * grants, or an anonymous visitor is treated as an authenticated actor); or the
 * registry key collides so a staff view of client-123 is served the org-wide
 * instance — cross-scope data leakage between different clients/brands.
 */

import { beforeEach, describe, expect, it } from "vitest";
import "./mocks";
import { ScopeActorTypes } from "../scope.types";
import { generateScopeKey, resolveSelfActor } from "../scope.utils";
import { sessionState } from "./mocks";

// -----------------------------------------------------------------------------

describe("resolveSelfActor", () => {
  beforeEach(() => {
    sessionState.activeActor = undefined;
  });

  it("returns an explicit actor unchanged (no session lookup)", () => {
    // Explicit actors are authoritative — the session's actor must never
    // override an actor the caller named outright.
    expect(resolveSelfActor(ScopeActorTypes.STAFF)).toBe(ScopeActorTypes.STAFF);
    expect(resolveSelfActor(ScopeActorTypes.CLIENT)).toBe(
      ScopeActorTypes.CLIENT
    );
    expect(resolveSelfActor(ScopeActorTypes.GUEST)).toBe(ScopeActorTypes.GUEST);
  });

  it("resolves SELF to the active session's actor", () => {
    sessionState.activeActor = ScopeActorTypes.CLIENT;

    expect(resolveSelfActor(ScopeActorTypes.SELF)).toBe(ScopeActorTypes.CLIENT);
  });

  it("resolves SELF to GUEST when there is no active session", () => {
    sessionState.activeActor = undefined;

    // ADR-001 §5: the anonymous case degrades to a guest scope rather than
    // erroring — the visitor still gets a (guest) basket.
    expect(resolveSelfActor(ScopeActorTypes.SELF)).toBe(ScopeActorTypes.GUEST);
  });
});

// -----------------------------------------------------------------------------

describe("generateScopeKey", () => {
  it("keys an org-wide actor by name and actor alone", () => {
    expect(generateScopeKey("invoices", { actor: ScopeActorTypes.STAFF })).toBe(
      `invoices:${ScopeActorTypes.STAFF}`
    );
  });

  it("folds the .for() context into the key", () => {
    expect(
      generateScopeKey("basket", {
        actor: ScopeActorTypes.STAFF,
        context: { type: "client", id: "123" }
      })
    ).toBe(`basket:${ScopeActorTypes.STAFF}:client:123`);
  });

  it("separates an org-wide scope from a context-specific scope", () => {
    // The registry singleton contract (ADR-001 §8) rests on this: staff viewing
    // client-123 must not be served the org-wide instance.
    const orgWide = generateScopeKey("basket", {
      actor: ScopeActorTypes.STAFF
    });
    const forClient = generateScopeKey("basket", {
      actor: ScopeActorTypes.STAFF,
      context: { type: "client", id: "123" }
    });

    expect(orgWide).not.toBe(forClient);
  });

  it("keys two different context ids to two different scopes", () => {
    // ADR-001 §8: same actor, different client id → different instance.
    const client123 = generateScopeKey("basket", {
      actor: ScopeActorTypes.STAFF,
      context: { type: "client", id: "123" }
    });
    const client456 = generateScopeKey("basket", {
      actor: ScopeActorTypes.STAFF,
      context: { type: "client", id: "456" }
    });

    expect(client123).not.toBe(client456);
  });

  it("appends the brand filter to the key", () => {
    expect(
      generateScopeKey("invoices", {
        actor: ScopeActorTypes.STAFF,
        brandId: "brand-abc"
      })
    ).toBe(`invoices:${ScopeActorTypes.STAFF}:brand:brand-abc`);
  });

  it("gives every fresh scope a unique key so remounts never adopt a stale instance", () => {
    // .fresh() spawns an isolated instance that starts a new session; two fresh
    // requests for the same scope must produce distinct keys, otherwise a
    // remounting consumer would inherit the previous (possibly authenticated)
    // fresh instance the moment before its unmount destroys it.
    const first = generateScopeKey("auth", {
      actor: ScopeActorTypes.GUEST,
      newSession: true
    });
    const second = generateScopeKey("auth", {
      actor: ScopeActorTypes.GUEST,
      newSession: true
    });

    expect(first).not.toBe(second);
  });
});

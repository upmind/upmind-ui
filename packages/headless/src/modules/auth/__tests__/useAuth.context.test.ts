// -----------------------------------------------------------------------------
/**
 * @fileoverview useAuth context — scope wiring exposure (unit)
 *
 * ## Job To Be Done
 * Prove the composable exposes the configured scope through its reactive
 * context — the value that tells services which grant type to use.
 *
 * ## What Breaks If These Fail
 * A client instance mints staff grants (or vice versa); impersonation flows
 * lose their target context and mint tokens for the wrong actor.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import { ScopeActorTypes } from "../../scope";
import { AuthContextTypes } from "../auth.types";
import { useAuth } from "../useAuth";

// -----------------------------------------------------------------------------

// NB: the impersonation scopeContext assertion lives in auth.int.test.ts
// (AU-I0) — scopeContext is machine-context-sourced, which a mocked-machine
// unit cannot populate (triage A1; test-design.md AU-U5 amendment).

describe("useAuth context", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes scopeActor matching the configured actor (client)", () => {
    const auth = useAuth().as(ScopeActorTypes.CLIENT);

    expect(auth.useContext().scopeActor.value).toBe(ScopeActorTypes.CLIENT);
  });

  it("exposes scopeActor matching the configured actor (staff)", () => {
    const auth = useAuth().as(ScopeActorTypes.STAFF);

    expect(auth.useContext().scopeActor.value).toBe(ScopeActorTypes.STAFF);
  });

  it("exposes scopeActor under impersonation wiring", () => {
    const auth = useAuth()
      .as(ScopeActorTypes.STAFF)
      .for(AuthContextTypes.CLIENT, "client-456");

    expect(auth.useContext().scopeActor.value).toBe(ScopeActorTypes.STAFF);
  });
});

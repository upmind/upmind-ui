// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC-4 — `SCOPE_ACTOR`'s runtime value set must equal live
 * headless `ScopeActorTypes` — the drift backstop for the core's own actor
 * mirror (the core cannot import headless, so it re-declares the enum from
 * the shared vue-free `AccessRoleTypes` source; this test is what would
 * catch the two definitions diverging).
 *
 * FE-3051 — the barrel-cycle bug that previously blocked collection of any
 * headless-importing test in this lane is fixed; this file now executes.
 */

import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { SCOPE_ACTOR } from "@upmind-automation/scenario-harness";

describe("@AC-4 scope-actor-drift.int — SCOPE_ACTOR mirrors live ScopeActorTypes", () => {
  it("carries exactly the same runtime value set as headless ScopeActorTypes", () => {
    // GUEST/CLIENT/STAFF are initialized from AccessRoleTypes.X (a property
    // access, not a literal), so esbuild emits a reverse mapping for each —
    // e.g. both ScopeActorTypes.GUEST === "guest" and
    // ScopeActorTypes["guest"] === "GUEST" exist at runtime. The reverse key
    // is always inserted immediately after its forward pair (JS assignment
    // evaluation order), so the first time a key is seen it is the forward
    // (actor-value) entry — skip any key already recorded as a value.
    const seenAsValue = new Set<string>();
    const live: string[] = [];
    for (const [key, value] of Object.entries(ScopeActorTypes)) {
      if (seenAsValue.has(key)) continue;
      live.push(value);
      seenAsValue.add(value);
    }

    const mirrored = Object.values(SCOPE_ACTOR).sort();

    expect(live.sort()).toStrictEqual(mirrored);
  });

  it('STAFF\'s wire value is "user" on both sides, never "staff"', () => {
    expect(SCOPE_ACTOR.STAFF).toBe(ScopeActorTypes.STAFF);
    expect(ScopeActorTypes.STAFF).toBe("user");
  });
});

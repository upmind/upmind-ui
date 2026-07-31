import { describe, expect, it } from "vitest";
import { SCOPE_ACTOR } from "../scope-actor";

/**
 * @AC-4 — the actor value set the port/world contracts are built on. Pinned
 * here as a canary: `AccessRoleTypes.STAFF`'s wire value is `"user"`, never
 * `"staff"` — the journeys-lane drift test
 * (tests/journeys/scenario-harness/scope-actor-drift.int.test.ts) asserts
 * this same value set equals live headless `ScopeActorTypes`.
 */
describe("@AC-4 SCOPE_ACTOR — the runtime value set", () => {
  it("pins the exact runtime value set {self, guest, client, user}", () => {
    const values = Object.values(SCOPE_ACTOR).sort();

    expect(values).toStrictEqual(["client", "guest", "self", "user"]);
  });

  it('STAFF carries the wire value "user", never "staff"', () => {
    expect(SCOPE_ACTOR.STAFF).toBe("user");
  });

  it("SELF is the only local literal, distinct from the AccessRoleTypes-sourced members", () => {
    expect(SCOPE_ACTOR.SELF).toBe("self");
    expect(new Set(Object.values(SCOPE_ACTOR)).size).toBe(4);
  });
});

// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC-4 — `SCOPE_ACTOR`'s runtime value set must equal live
 * headless `ScopeActorTypes` — the drift backstop for the core's own actor
 * mirror (the core cannot import headless, so it re-declares the enum from
 * the shared vue-free `AccessRoleTypes` source; this test is what would
 * catch the two definitions diverging).
 *
 * FE-3051 — blocked, not executed, in this MR: this file imports
 * `@upmind-automation/headless`, whose barrel transitively pulls in
 * `packages/headless/src/modules/payment-gateways/razorpay/schemas.ts` — a
 * pre-existing, unrelated broken relative import (`../schemas`/`../utils`/
 * `../types`, none of which exist) that fails `vitest run`'s collection step
 * for any headless-importing test in this lane, reproduced identically on
 * the pre-existing `storefront-guest-oneoff-checkout-stripe.int.test.ts`
 * journey. Typecheck-clean (`pnpm run typecheck:journeys`, zero errors here);
 * unexecuted until FE-3051 lands.
 */

import { describe, expect, it } from "vitest";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { SCOPE_ACTOR } from "@upmind-automation/scenario-harness";

describe("@AC-4 scope-actor-drift.int — SCOPE_ACTOR mirrors live ScopeActorTypes", () => {
  it("carries exactly the same runtime value set as headless ScopeActorTypes", () => {
    const live = Object.values(ScopeActorTypes).sort();
    const mirrored = Object.values(SCOPE_ACTOR).sort();

    expect(mirrored).toStrictEqual(live);
  });

  it('STAFF\'s wire value is "user" on both sides, never "staff"', () => {
    expect(SCOPE_ACTOR.STAFF).toBe(ScopeActorTypes.STAFF);
    expect(ScopeActorTypes.STAFF).toBe("user");
  });
});

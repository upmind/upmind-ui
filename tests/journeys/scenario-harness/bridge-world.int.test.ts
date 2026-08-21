// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC-4 — the bridge-world typed skeleton. Its only runtime
 * behaviour today is a loud, explicit "not implemented" rejection;
 * the typecheck-against-World proof is structural (this file compiling
 * against `BridgeWorld implements World` IS the @AC-4 stub-leg-2 proof).
 *
 * FE-3051 — blocked, not executed, in this MR: `./registry` imports
 * `useAuth` from `@upmind-automation/headless`, whose barrel transitively
 * pulls in `packages/headless/src/modules/payment-gateways/razorpay/
 * schemas.ts` — a pre-existing, unrelated broken relative import
 * (`../schemas`/`../utils`/`../types`, none of which exist) that fails
 * `vitest run`'s collection step for any headless-importing test in this
 * lane, reproduced identically on the pre-existing
 * `storefront-guest-oneoff-checkout-stripe.int.test.ts` journey.
 * Typecheck-clean (`pnpm run typecheck:journeys`, zero errors here);
 * unexecuted until FE-3051 lands.
 */

import { describe, expect, it } from "vitest";
import { SCOPE_ACTOR } from "@upmind-automation/scenario-harness";
import { BRIDGE_WORLD_NOT_IMPLEMENTED, BridgeWorld } from "./bridge-world";
import { COMPOSABLE_KEY } from "./manifest";
import { registry } from "./registry";

describe("@AC-4 bridge-world.int — the typed Node/bridge skeleton", () => {
  it("boot() rejects with an explicit not-implemented marker, never a silent no-op", async () => {
    const world = new BridgeWorld();

    await expect(
      world.boot(COMPOSABLE_KEY.AUTH, { actor: SCOPE_ACTOR.SELF })
    ).rejects.toThrow(BRIDGE_WORLD_NOT_IMPLEMENTED);
  });

  it("fire()/expectMeta()/dispose() all reject with the same marker", async () => {
    const world = new BridgeWorld();

    await expect(world.fire("resolve")).rejects.toThrow(
      BRIDGE_WORLD_NOT_IMPLEMENTED
    );
    await expect(world.expectMeta({ isIdle: true })).rejects.toThrow(
      BRIDGE_WORLD_NOT_IMPLEMENTED
    );
    await expect(world.dispose()).rejects.toThrow(BRIDGE_WORLD_NOT_IMPLEMENTED);
  });

  it("the executor registry binds COMPOSABLE_KEY.AUTH to the live useAuth factory (@AC-6)", () => {
    // Deliberately does not invoke `registry.auth()`: calling it accesses the
    // builder without `.as(actor)`, which would boot a default-scoped
    // singleton into the shared scope registry as an unwanted side effect
    // (enumerating/invoking a builder-alike prematurely instantiates it) and
    // leak across this file's other tests. The compiles-against-
    // ScenarioRegistry `satisfies` clause is the real proof here.
    expect(Object.keys(registry)).toStrictEqual(["auth"]);
    expect(typeof registry.auth).toBe("function");
  });
});

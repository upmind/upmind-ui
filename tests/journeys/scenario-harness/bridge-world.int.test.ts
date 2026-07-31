// -----------------------------------------------------------------------------
/**
 * @fileoverview @AC-4 — the bridge-world typed skeleton (T14). Its only
 * runtime behaviour today is a loud, explicit "not implemented" rejection;
 * the typecheck-against-World proof is structural (this file compiling
 * against `BridgeWorld implements World` IS the @AC-4 stub-leg-2 proof).
 */

import { describe, expect, it } from "vitest";
import { BRIDGE_WORLD_NOT_IMPLEMENTED, BridgeWorld } from "./bridge-world";
import { registry } from "./registry";

describe("@AC-4 bridge-world.int — the typed Node/bridge skeleton", () => {
  it("boot() rejects with an explicit not-implemented marker, never a silent no-op", async () => {
    const world = new BridgeWorld();

    await expect(world.boot("auth", { actor: "self" })).rejects.toThrow(
      BRIDGE_WORLD_NOT_IMPLEMENTED
    );
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
    // (risk §11.1) and leak across this file's other tests. The compiles-
    // against-ComposableRegistry `satisfies` clause is the real proof here.
    expect(Object.keys(registry)).toStrictEqual(["auth"]);
    expect(typeof registry.auth).toBe("function");
  });
});

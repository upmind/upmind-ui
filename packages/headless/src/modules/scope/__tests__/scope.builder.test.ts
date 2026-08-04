// -----------------------------------------------------------------------------
/**
 * @fileoverview scope.builder — createScopedComposable factory wiring (unit)
 *
 * ## Job To Be Done
 * Prove the fluent builder every scoped composable is created with does four
 * jobs correctly:
 *   1. Feeds the factory the *resolved* scope config the chain describes
 *      (actor, `.for()` context, `.inBrand()` brand) — ADR-001 §2 chaining.
 *   2. Resolves `.as('self')` to the current session actor before building
 *      (ADR-001 §5), so the factory never sees the `SELF` alias.
 *   3. Surfaces the factory's four-layer return (useContext / useMeta /
 *      useActions / useInternals) through the builder proxy, all backed by one
 *      shared instance (ADR-001 §"Sub-Composables Access").
 *   4. Honours singleton-per-scope-key and `.fresh()` isolation (ADR-001 §8).
 *
 * ## What Breaks If These Fail
 * A composable is built for the wrong actor/context/brand; `.as('self')` binds
 * to nobody; `useX().useMeta()` is undefined because the proxy stops forwarding;
 * two callers of the same scope drift apart; or `.fresh()` hands back the stale
 * cached instance instead of an isolated one.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import { createScopedComposable } from "../scope.builder";
import { clearAll } from "../scope.registry";
import { ScopeActorTypes } from "../scope.types";
import { sessionState } from "./mocks";
import type { ScopeConfig, ScopeKey } from "../scope.types";

// -----------------------------------------------------------------------------

/** A minimal four-layer composable return, per ADR-001 §"Composable Return". */
type Layered = {
  useContext: () => { actor: string };
  useMeta: () => { count: number };
  useActions: () => { inc: () => void };
  useInternals: () => { id: symbol };
};

/**
 * Builds a fresh scoped composable whose factory records the config/key it was
 * called with and exposes a shared mutable counter across its four layers.
 */
function makeComposable() {
  const captured: { config?: ScopeConfig; key?: ScopeKey } = {};

  const factory = vi.fn((config: ScopeConfig, scopeKey: ScopeKey): Layered => {
    captured.config = config;
    captured.key = scopeKey;
    let count = 0;
    const id = Symbol("instance");
    return {
      useContext: () => ({ actor: config.actor }),
      useMeta: () => ({ count }),
      useActions: () => ({
        inc: () => {
          count++;
        }
      }),
      useInternals: () => ({ id })
    };
  });

  return {
    use: createScopedComposable<Layered>("basket", factory),
    factory,
    captured
  };
}

// -----------------------------------------------------------------------------

describe("createScopedComposable", () => {
  beforeEach(() => {
    clearAll();
    sessionState.activeActor = undefined;
  });

  describe("config wiring", () => {
    it("feeds the factory the resolved actor and derived scope key", () => {
      const { use, captured } = makeComposable();

      use().as(ScopeActorTypes.STAFF).useInternals();

      expect(captured.config?.actor).toBe(ScopeActorTypes.STAFF);
      expect(captured.config?.context).toBeUndefined();
      expect(captured.key).toBe(`basket:${ScopeActorTypes.STAFF}`);
    });

    it("feeds the factory the .for() context and .inBrand() brand", () => {
      const { use, captured } = makeComposable();

      use()
        .as(ScopeActorTypes.STAFF)
        .for("client", "123")
        .inBrand("brand-x")
        .useInternals();

      expect(captured.config?.context).toEqual({ type: "client", id: "123" });
      expect(captured.config?.brandId).toBe("brand-x");
      expect(captured.key).toBe(
        `basket:${ScopeActorTypes.STAFF}:client:123:brand:brand-x`
      );
    });
  });

  describe("self resolution", () => {
    it("resolves .as('self') to the active session actor before building", () => {
      sessionState.activeActor = ScopeActorTypes.CLIENT;
      const { use, captured } = makeComposable();

      use().as(ScopeActorTypes.SELF).useInternals();

      // The factory must never see the SELF alias — it needs a concrete actor
      // to pick the right grant/endpoint.
      expect(captured.config?.actor).toBe(ScopeActorTypes.CLIENT);
      expect(captured.key).toBe(`basket:${ScopeActorTypes.CLIENT}`);
    });

    it("resolves .as('self') to GUEST when no session is active", () => {
      sessionState.activeActor = undefined;
      const { use, captured } = makeComposable();

      use().as(ScopeActorTypes.SELF).useInternals();

      expect(captured.config?.actor).toBe(ScopeActorTypes.GUEST);
    });
  });

  describe("four-layer wiring", () => {
    it("surfaces all four layers through the proxy, backed by one instance", () => {
      const { use, factory } = makeComposable();

      const basket = use().as(ScopeActorTypes.STAFF);

      // An action mutation is visible through the meta layer → both layers are
      // the same underlying instance, not fresh factory runs per access.
      basket.useActions().inc();
      basket.useActions().inc();

      expect(basket.useMeta().count).toBe(2);
      expect(basket.useContext().actor).toBe(ScopeActorTypes.STAFF);
      expect(basket.useInternals().id).toBe(basket.useInternals().id);
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe("singleton behaviour (ADR-001 §8)", () => {
    it("shares one instance across identical scopes", () => {
      const { use, factory } = makeComposable();

      const a = use().as(ScopeActorTypes.STAFF).for("client", "123");
      const b = use().as(ScopeActorTypes.STAFF).for("client", "123");

      a.useActions().inc();

      expect(b.useMeta().count).toBe(1);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("isolates instances across different contexts", () => {
      const { use, factory } = makeComposable();

      const client123 = use().as(ScopeActorTypes.STAFF).for("client", "123");
      const client456 = use().as(ScopeActorTypes.STAFF).for("client", "456");

      client123.useActions().inc();

      expect(client456.useMeta().count).toBe(0);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it("gives .fresh() an isolated instance rather than the cached one", () => {
      const { use, factory } = makeComposable();

      const first = use().as(ScopeActorTypes.STAFF).fresh();
      const second = use().as(ScopeActorTypes.STAFF).fresh();

      first.useActions().inc();

      expect(second.useMeta().count).toBe(0);
      expect(factory).toHaveBeenCalledTimes(2);
    });
  });
});

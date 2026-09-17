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
 *
 * @anchor scope.feature
 * @anchor AC-1
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import "./mocks";
import { createScopedComposable } from "../scope.builder";
import { clearAll } from "../scope.registry";
import { ScopeActorTypes } from "../scope.types";
import { selector } from "../scope.utils";
import { sessionState } from "./mocks";
import { forEach, map, sortBy } from "lodash-es";
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

  describe("the single record (.withId, FE-3095)", () => {
    it("feeds the factory config.id and the id-bearing scope key", () => {
      const { use, captured } = makeComposable();

      use().withId("email-1").useInternals();

      expect(captured.config?.id).toBe("email-1");
      expect(captured.config?.context).toBeUndefined();
      expect(captured.key).toBe(`basket:${ScopeActorTypes.GUEST}:id:email-1`);
    });

    it("defaults the actor to the current session's own when .as() is never called", () => {
      sessionState.activeActor = ScopeActorTypes.CLIENT;
      const { use, captured } = makeComposable();

      use().withId("email-1").useInternals();

      expect(captured.config?.actor).toBe(ScopeActorTypes.CLIENT);
      expect(captured.key).toBe(`basket:${ScopeActorTypes.CLIENT}:id:email-1`);
    });

    it("reaches the same instance whichever order .as() and .withId() are chained in", () => {
      const { use, factory } = makeComposable();

      const asThenId = use().as(ScopeActorTypes.CLIENT).withId("email-1");
      const idThenAs = use().withId("email-1").as(ScopeActorTypes.CLIENT);

      asThenId.useActions().inc();

      expect(idThenAs.useMeta().count).toBe(1);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("isolates instances across different record ids", () => {
      // Same actor, different record: two instances. Sharing one would serve the
      // second email the first email's body.
      const { use, factory } = makeComposable();

      const first = use().withId("email-1");
      const second = use().withId("email-2");

      first.useActions().inc();

      expect(second.useMeta().count).toBe(0);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it("separates a record-scoped instance from the same actor's unscoped one", () => {
      const { use, factory } = makeComposable();

      const unscoped = use().as(ScopeActorTypes.CLIENT);
      const record = use().as(ScopeActorTypes.CLIENT).withId("email-1");

      unscoped.useActions().inc();

      expect(record.useMeta().count).toBe(0);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it("leaves config.id and the key absent for a chain that names no record", () => {
      const { use, captured } = makeComposable();

      use().as(ScopeActorTypes.STAFF).for("client", "123").useInternals();

      expect(captured.config?.id).toBeUndefined();
      expect(captured.key).toBe(`basket:${ScopeActorTypes.STAFF}:client:123`);
    });

    it("offers .withId() after a context, keeping the context", () => {
      // A record id and a context coexist: the context names the entity the
      // ACTOR acts upon, the id the ONE record read. Adding `.inBrand()` to this
      // chain does not type-check — `ScopeBuilderAfterFor.inBrand` returns a
      // bare `T`, so a context + brand + id chain is unreachable. See the
      // handoff finding, not worked around here.
      const { use, captured } = makeComposable();

      use()
        .as(ScopeActorTypes.STAFF)
        .for("client", "123")
        .withId("email-1")
        .useInternals();

      expect(captured.config?.context).toEqual({ type: "client", id: "123" });
      expect(captured.config?.id).toBe("email-1");
      expect(captured.key).toBe(
        `basket:${ScopeActorTypes.STAFF}:client:123:id:email-1`
      );
    });

    it("offers .withId() after a brand, keeping the brand", () => {
      const { use, captured } = makeComposable();

      use()
        .as(ScopeActorTypes.STAFF)
        .inBrand("brand-x")
        .withId("email-1")
        .useInternals();

      expect(captured.config?.brandId).toBe("brand-x");
      expect(captured.config?.id).toBe("email-1");
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

// -----------------------------------------------------------------------------

/**
 * One actor, three declared members: a retarget member and two catalogues. This
 * is the mixed cell FE-3239 mints — the shape `scope.feature`'s Background
 * declares and `@AC-1` grades.
 */
const CUSTOM_FIELDS_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: [
    "values",
    selector("invoice"),
    selector("cancel_request")
  ],
  [ScopeActorTypes.GUEST]: null as never
} as const;

const CUSTOM_FIELDS = "client-custom-fields";

/**
 * A scoped composable on the mixed cell, recording every config it was built
 * with against the key it was built under.
 */
function makeCustomFields() {
  const configs = new Map<ScopeKey, ScopeConfig>();

  const factory = vi.fn((config: ScopeConfig, scopeKey: ScopeKey): Layered => {
    configs.set(scopeKey, config);
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
    use: createScopedComposable<Layered, typeof CUSTOM_FIELDS_MATRIX>(
      CUSTOM_FIELDS,
      factory,
      CUSTOM_FIELDS_MATRIX
    ),
    factory,
    configs
  };
}

describe("createScopedComposable — the catalogue context (FE-3239)", () => {
  beforeEach(() => {
    clearAll();
    sessionState.activeActor = undefined;
  });

  it("@AC-1 keeps two catalogues read through one module separate", () => {
    const { use, factory } = makeCustomFields();

    const invoices = use().as(ScopeActorTypes.CLIENT).for("invoice");
    const cancellations = use()
      .as(ScopeActorTypes.CLIENT)
      .for("cancel_request");

    invoices.useActions().inc();

    expect(cancellations.useMeta().count).toBe(0);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("@AC-1 hands the first catalogue back the instance it already had", () => {
    const { use, factory } = makeCustomFields();

    const invoices = use().as(ScopeActorTypes.CLIENT).for("invoice");
    use().as(ScopeActorTypes.CLIENT).for("cancel_request").useInternals();

    invoices.useActions().inc();
    use().as(ScopeActorTypes.CLIENT).for("invoice").useActions().inc();

    expect(invoices.useMeta().count).toBe(2);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it("@AC-1 keys each catalogue on the member alone", () => {
    const { use, configs } = makeCustomFields();

    use().as(ScopeActorTypes.CLIENT).for("invoice").useInternals();
    use().as(ScopeActorTypes.CLIENT).for("cancel_request").useInternals();

    // The literal keys, not a template over the enum the builder itself reads.
    // Instance distinctness alone is already green on a builder that keys
    // `…:invoice:undefined`, so the string IS the capability AC-1 grades.
    expect(sortBy([...configs.keys()])).toEqual([
      "client-custom-fields:client:cancel_request",
      "client-custom-fields:client:invoice"
    ]);
  });

  it("@AC-1 attributes no entity to either catalogue read", () => {
    const { use, configs } = makeCustomFields();

    use().as(ScopeActorTypes.CLIENT).for("invoice").useInternals();
    use().as(ScopeActorTypes.CLIENT).for("cancel_request").useInternals();

    const contexts = map([...configs.values()], config => config.context);

    expect(sortBy(map(contexts, "type"))).toEqual([
      "cancel_request",
      "invoice"
    ]);

    forEach(contexts, context =>
      expect(Object.hasOwn(context ?? {}, "id")).toBe(false)
    );
  });

  it("leaves the retargeted member of the same cell resolving to the instance it always did", () => {
    const { use, factory, configs } = makeCustomFields();

    const first = use().as(ScopeActorTypes.CLIENT).for("values", "123");
    const second = use().as(ScopeActorTypes.CLIENT).for("values", "123");

    first.useActions().inc();

    expect(second.useMeta().count).toBe(1);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(
      configs.get(`${CUSTOM_FIELDS}:${ScopeActorTypes.CLIENT}:values:123`)
        ?.context
    ).toEqual({ type: "values", id: "123" });
  });

  it("separates a catalogue read from a retargeted read of the same cell", () => {
    const { use, factory } = makeCustomFields();

    const retargeted = use().as(ScopeActorTypes.CLIENT).for("values", "123");
    const catalogue = use().as(ScopeActorTypes.CLIENT).for("invoice");

    retargeted.useActions().inc();

    expect(catalogue.useMeta().count).toBe(0);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

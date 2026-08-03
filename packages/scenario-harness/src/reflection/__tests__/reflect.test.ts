import { describe, expect, it } from "vitest";
import { FIXTURE_KEY } from "../../__fixtures__/fixture-registry";
import { ARCHETYPE, OBJECT_SCHEMA_TYPE } from "../../archetype/archetype.types";
import { SCOPE_ACTOR } from "../../world/scope-actor";
import { reflect } from "../reflect";
import type { CompositionPort } from "../../port/port.types";
import type { ReflectedSnapshot } from "../reflection.types";

const REAL_SCHEMA = {
  type: OBJECT_SCHEMA_TYPE,
  properties: { username: { type: "string" } }
};

/**
 * A port that throws on any property access outside its named `snapshot`/
 * `table` members, and on any enumeration trap — the builder-guard fixture
 * for the risk that enumerating a builder-alike port side-effectfully
 * instantiates it. If `reflect()` ever enumerates the port (or reads
 * `getMeta`/`actions`, which belong to other consumers, never reflection),
 * this throws and the test fails loud.
 */
function buildGuardedPort(
  snapshot: ReflectedSnapshot,
  table?: CompositionPort["table"]
): { port: CompositionPort; snapshotCalls: () => number } {
  let calls = 0;
  const allowed = new Set(["snapshot", "table"]);
  const target = {
    snapshot: (): ReflectedSnapshot => {
      calls += 1;
      return snapshot;
    },
    table
  };

  const port = new Proxy(target as unknown as CompositionPort, {
    get(obj, prop) {
      if (typeof prop === "symbol" || !allowed.has(prop)) {
        throw new Error(
          `builder-guard: unexpected property access "${String(prop)}"`
        );
      }
      return Reflect.get(obj, prop);
    },
    ownKeys() {
      throw new Error("builder-guard: port was enumerated (ownKeys)");
    },
    getOwnPropertyDescriptor() {
      throw new Error(
        "builder-guard: port was enumerated (getOwnPropertyDescriptor)"
      );
    },
    has() {
      throw new Error("builder-guard: port existence-checked (has)");
    }
  });

  return { port, snapshotCalls: () => calls };
}

describe("@AC-2 reflect — pure, stateless reflection", () => {
  it("pulls a fresh snapshot() on every call — never caches", () => {
    const { port, snapshotCalls } = buildGuardedPort({
      actions: ["turnOn"],
      context: {},
      meta: { isOn: false }
    });

    reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);
    expect(snapshotCalls()).toBe(1);

    reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);
    expect(snapshotCalls()).toBe(2);
  });

  it("never enumerates the port and never reads getMeta/actions — only snapshot/table", () => {
    const { port } = buildGuardedPort({
      actions: ["turnOn"],
      context: {},
      meta: { isOn: false }
    });

    expect(() =>
      reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port)
    ).not.toThrow();
  });

  it("carries the key and actor through to the descriptor untouched", () => {
    const { port } = buildGuardedPort({
      actions: [],
      context: {},
      meta: {}
    });

    const descriptor = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.STAFF, port);

    expect(descriptor.key).toBe(FIXTURE_KEY.SWITCH);
    expect(descriptor.actor).toBe(SCOPE_ACTOR.STAFF);
  });

  it("composes the classifier: a schema+model port reflects to Form-Flow", () => {
    const { port } = buildGuardedPort({
      actions: ["resolve"],
      context: { schema: REAL_SCHEMA, model: { username: "" } },
      meta: { isValid: true }
    });

    const descriptor = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);

    expect(descriptor.archetype.archetype).toBe(ARCHETYPE.FORM_FLOW);
  });

  it("every reflected meta value is a literal boolean — no wrapper object crosses reflection", () => {
    const { port } = buildGuardedPort({
      actions: [],
      context: {},
      meta: { isOn: true, isOff: false }
    });

    const descriptor = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);

    for (const value of Object.values(descriptor.snapshot.meta)) {
      expect(typeof value).toBe("boolean");
    }
  });

  it("an undefined array element inside context is dropped, not carried as null — JSON round-trip stays clean", () => {
    const { port } = buildGuardedPort({
      actions: [],
      context: { list: ["a", undefined, "b"] },
      meta: {}
    });

    const descriptor = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);

    expect(descriptor.snapshot.context.list).toStrictEqual(["a", "b"]);

    const roundTripped = JSON.parse(JSON.stringify(descriptor)) as unknown;
    expect(roundTripped).toStrictEqual(descriptor);
  });

  it("a self-referential context does not throw — the cycle guard drops the revisited value", () => {
    const circular: Record<string, unknown> = { name: "self-ref" };
    circular.self = circular;

    const { port } = buildGuardedPort({
      actions: [],
      context: { thing: circular },
      meta: {}
    });

    expect(() =>
      reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port)
    ).not.toThrow();

    const descriptor = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);
    const thing = descriptor.snapshot.context.thing as Record<string, unknown>;
    expect(thing.name).toBe("self-ref");
    expect(thing).not.toHaveProperty("self");
  });

  it("an own __proto__-named key in context does not pollute Object.prototype and does not leak into the emitted snapshot", () => {
    const rawContext: Record<string, unknown> = {};
    Object.defineProperty(rawContext, "__proto__", {
      value: { polluted: true },
      enumerable: true,
      configurable: true
    });

    const { port } = buildGuardedPort({
      actions: [],
      context: rawContext,
      meta: {}
    });

    const descriptor = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);

    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(descriptor.snapshot.context).not.toHaveProperty("polluted");

    const roundTripped = JSON.parse(JSON.stringify(descriptor)) as unknown;
    expect(roundTripped).toStrictEqual(descriptor);
  });

  it("two successive descriptors never share the same snapshot.actions array instance", () => {
    const sharedActions = ["turnOn", "turnOff"];
    const rawSnapshot: ReflectedSnapshot = {
      actions: sharedActions,
      context: {},
      meta: {}
    };
    const port: CompositionPort = {
      snapshot: () => rawSnapshot,
      getMeta: () => ({}),
      actions: {}
    };

    const first = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);
    const second = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);

    expect(first.snapshot.actions).not.toBe(second.snapshot.actions);
    expect(first.snapshot.actions).not.toBe(sharedActions);

    sharedActions.push("mutatedAfterTheFact");
    expect(first.snapshot.actions).toStrictEqual(["turnOn", "turnOff"]);
  });

  it("a reflect-produced descriptor survives a JSON round-trip unchanged (@AC-8 leg 2)", () => {
    const { port } = buildGuardedPort({
      actions: ["destroy", "resolve"],
      context: { schema: REAL_SCHEMA, model: { username: "" } },
      meta: { isValid: true, isIdle: false }
    });

    const descriptor = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);
    const roundTripped = JSON.parse(JSON.stringify(descriptor)) as unknown;

    expect(roundTripped).toStrictEqual(descriptor);
  });
});

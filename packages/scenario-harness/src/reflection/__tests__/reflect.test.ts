import { describe, expect, it } from "vitest";
import { COMPOSABLE_KEY } from "../../registry/registry";
import { SCOPE_ACTOR } from "../../world/scope-actor";
import { reflect } from "../reflect";
import type { CompositionPort } from "../../port/port.types";
import type { ReflectedSnapshot } from "../reflection.types";

const REAL_SCHEMA = {
  type: "object",
  properties: { username: { type: "string" } }
};

/**
 * A port that throws on any property access outside its named `snapshot`/
 * `table` members, and on any enumeration trap — the risk §11.1 builder-guard
 * fixture. If `reflect()` ever enumerates the port (or reads `getMeta`/
 * `actions`, which belong to other consumers, never reflection), this
 * throws and the test fails loud.
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

    reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);
    expect(snapshotCalls()).toBe(1);

    reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);
    expect(snapshotCalls()).toBe(2);
  });

  it("never enumerates the port and never reads getMeta/actions — only snapshot/table (risk §11.1)", () => {
    const { port } = buildGuardedPort({
      actions: ["turnOn"],
      context: {},
      meta: { isOn: false }
    });

    expect(() =>
      reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port)
    ).not.toThrow();
  });

  it("carries the key and actor through to the descriptor untouched", () => {
    const { port } = buildGuardedPort({
      actions: [],
      context: {},
      meta: {}
    });

    const descriptor = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.STAFF, port);

    expect(descriptor.key).toBe(COMPOSABLE_KEY.AUTH);
    expect(descriptor.actor).toBe(SCOPE_ACTOR.STAFF);
  });

  it("composes the classifier: a schema+model port reflects to Form-Flow", () => {
    const { port } = buildGuardedPort({
      actions: ["resolve"],
      context: { schema: REAL_SCHEMA, model: { username: "" } },
      meta: { isValid: true }
    });

    const descriptor = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);

    expect(descriptor.archetype.archetype).toBe("form-flow");
  });

  it("every reflected meta value is a literal boolean — no wrapper object crosses reflection", () => {
    const { port } = buildGuardedPort({
      actions: [],
      context: {},
      meta: { isOn: true, isOff: false }
    });

    const descriptor = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);

    for (const value of Object.values(descriptor.snapshot.meta)) {
      expect(typeof value).toBe("boolean");
    }
  });

  it("a reflect-produced descriptor survives a JSON round-trip unchanged (@AC-8 leg 2)", () => {
    const { port } = buildGuardedPort({
      actions: ["destroy", "resolve"],
      context: { schema: REAL_SCHEMA, model: { username: "" } },
      meta: { isValid: true, isIdle: false }
    });

    const descriptor = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);
    const roundTripped = JSON.parse(JSON.stringify(descriptor)) as unknown;

    expect(roundTripped).toStrictEqual(descriptor);
  });
});

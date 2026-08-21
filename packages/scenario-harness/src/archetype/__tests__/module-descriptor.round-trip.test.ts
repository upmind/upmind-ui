import { describe, expect, it } from "vitest";
import { FIXTURE_KEY } from "../../__fixtures__/fixture-registry";
import { reflect } from "../../reflection/reflect";
import { SCOPE_ACTOR } from "../../world/scope-actor";
import { ARCHETYPE, OBJECT_SCHEMA_TYPE } from "../archetype.types";
import type { CompositionPort } from "../../port/port.types";
import type { ReflectedSnapshot } from "../../reflection/reflection.types";
import type { ModuleDescriptor } from "../archetype.types";

/**
 * @AC-8 leg 1 [shape pin, not behaviour] — a hand-built `ModuleDescriptor`.
 * No production function runs on this leg's round-trip: the fixture below is
 * hand-typed JSON-primitive data one screen above the assertion that reads
 * it back, so `JSON.parse(JSON.stringify(descriptor))` only proves
 * `JSON.stringify` works on JSON — it documents the @AC-8 shape contract
 * (ADR-027 Am.13: plain snapshot + typed descriptors, nothing more) but
 * cannot fail for any reason other than a compile error or a REQUIRED
 * non-JSON field being added to `ModuleDescriptor` itself. The real,
 * production-code-exercising @AC-8 proof is the reflect()-produced legs
 * below (which DO run `reflect()` over a `CompositionPort` and DO catch a
 * regression in `deepOmitUndefined`), and `reflect.test.ts`'s own round-trip
 * cases.
 */
describe("@AC-8 ModuleDescriptor — JSON round-trip (hand-built leg)", () => {
  const descriptor: ModuleDescriptor = {
    key: FIXTURE_KEY.SWITCH,
    actor: SCOPE_ACTOR.CLIENT,
    archetype: {
      archetype: ARCHETYPE.FORM_FLOW,
      signals: {
        hasRealSchema: true,
        hasModel: true,
        hasTable: false,
        hasDataArray: false
      }
    },
    snapshot: {
      actions: ["destroy", "onDone", "onError", "reject", "resolve", "set"],
      context: {
        schema: {
          type: OBJECT_SCHEMA_TYPE,
          properties: { username: { type: "string" } }
        },
        uischema: { type: "VerticalLayout", elements: [] },
        model: { username: "" }
      },
      meta: { isIdle: true, isAuthenticated: false }
    }
  };

  it("[shape pin] survives a JSON round-trip against the original, unchanged", () => {
    expect(JSON.parse(JSON.stringify(descriptor))).toStrictEqual(descriptor);
  });

  it("[shape pin] carries no classes, no methods, no framework types on the descriptor itself", () => {
    const values = [
      descriptor,
      descriptor.archetype,
      descriptor.archetype.signals,
      descriptor.snapshot
    ];

    for (const value of values) {
      expect(value.constructor).toBe(Object);
    }
    for (const value of Object.values(descriptor.snapshot.meta)) {
      expect(typeof value).toBe("boolean");
    }
  });

  it("a reflect()-produced descriptor omits undefined-valued context/meta keys and round-trips clean because reflect omitted them", () => {
    const rawSnapshot = {
      actions: ["destroy", "resolve"],
      context: {
        schema: {
          type: OBJECT_SCHEMA_TYPE,
          properties: { username: { type: "string" } }
        },
        model: { username: "" },
        // Raw layer-factory derefs commonly yield undefined for an unset
        // optional field (e.g. `session`/`brandId` before a token exists) —
        // reflect() must omit these, not carry them through.
        session: undefined,
        brandId: undefined
      },
      meta: {
        isIdle: true,
        // A raw meta deref can likewise be undefined before its guard settles.
        isAuthenticated: undefined
      }
    } as unknown as ReflectedSnapshot;

    const port: CompositionPort = {
      snapshot: () => rawSnapshot,
      getMeta: () => ({}),
      actions: {}
    };

    const reflected = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);

    expect(reflected.snapshot.context).not.toHaveProperty("session");
    expect(reflected.snapshot.context).not.toHaveProperty("brandId");
    expect(reflected.snapshot.meta).not.toHaveProperty("isAuthenticated");

    const roundTripped = JSON.parse(JSON.stringify(reflected)) as unknown;
    expect(roundTripped).toStrictEqual(reflected);
  });

  it("a nested undefined-valued key (e.g. inside context.model) is also omitted — deep omission — and round-trips clean", () => {
    const rawSnapshot = {
      actions: ["set"],
      context: {
        schema: {
          type: OBJECT_SCHEMA_TYPE,
          properties: { username: { type: "string" } }
        },
        model: { username: undefined, email: "x" }
      },
      meta: { isIdle: true }
    } as unknown as ReflectedSnapshot;

    const port: CompositionPort = {
      snapshot: () => rawSnapshot,
      getMeta: () => ({}),
      actions: {}
    };

    const reflected = reflect(FIXTURE_KEY.SWITCH, SCOPE_ACTOR.CLIENT, port);
    const model = reflected.snapshot.context.model as Record<string, unknown>;

    expect(model).not.toHaveProperty("username");
    expect(model.email).toBe("x");

    const roundTripped = JSON.parse(JSON.stringify(reflected)) as unknown;
    expect(roundTripped).toStrictEqual(reflected);
  });
});

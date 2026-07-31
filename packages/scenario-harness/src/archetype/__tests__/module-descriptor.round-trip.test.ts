import { describe, expect, it } from "vitest";
import { reflect } from "../../reflection/reflect";
import { COMPOSABLE_KEY } from "../../registry/registry";
import { SCOPE_ACTOR } from "../../world/scope-actor";
import type { CompositionPort } from "../../port/port.types";
import type { ReflectedSnapshot } from "../../reflection/reflection.types";
import type { ModuleDescriptor } from "../archetype.types";

/**
 * @AC-8 leg 1 — a hand-built `ModuleDescriptor` (the reflect-produced leg 2
 * lives in `reflection/__tests__/reflect.test.ts`). The IR is the plain
 * snapshot + typed descriptors and nothing more (ADR-027 Am.13): every value
 * here is JSON-primitive-shaped, so a round-trip must be lossless.
 *
 * A `ModuleDescriptor` that is round-trip-asserted must never carry an
 * undefined-valued key directly (contract violation by construction:
 * `reflect()` itself omits undefined-valued context/meta entries, deeply, so
 * the emitted snapshot is strictly JSON data) — `toStrictEqual` treats
 * `{ x: undefined }` and `{}` as different, so such a fixture would fail
 * this exact round-trip for real, not pass it tautologically.
 */
describe("@AC-8 ModuleDescriptor — JSON round-trip (hand-built leg)", () => {
  const descriptor: ModuleDescriptor = {
    key: COMPOSABLE_KEY.AUTH,
    actor: SCOPE_ACTOR.CLIENT,
    archetype: {
      archetype: "form-flow",
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
          type: "object",
          properties: { username: { type: "string" } }
        },
        uischema: { type: "VerticalLayout", elements: [] },
        model: { username: "" }
      },
      meta: { isIdle: true, isAuthenticated: false }
    }
  };

  it("survives a JSON round-trip against the original, unchanged", () => {
    expect(JSON.parse(JSON.stringify(descriptor))).toStrictEqual(descriptor);
  });

  it("carries no classes, no methods, no framework types on the descriptor itself", () => {
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
          type: "object",
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

    const reflected = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);

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
          type: "object",
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

    const reflected = reflect(COMPOSABLE_KEY.AUTH, SCOPE_ACTOR.CLIENT, port);
    const model = reflected.snapshot.context.model as Record<string, unknown>;

    expect(model).not.toHaveProperty("username");
    expect(model.email).toBe("x");

    const roundTripped = JSON.parse(JSON.stringify(reflected)) as unknown;
    expect(roundTripped).toStrictEqual(reflected);
  });
});

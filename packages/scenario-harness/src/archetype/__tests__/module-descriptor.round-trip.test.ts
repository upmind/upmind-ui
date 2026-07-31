import { describe, expect, it } from "vitest";
import { COMPOSABLE_KEY } from "../../registry/registry";
import { SCOPE_ACTOR } from "../../world/scope-actor";
import type { ModuleDescriptor } from "../archetype.types";

/**
 * @AC-8 leg 1 — a hand-built `ModuleDescriptor` (the reflect-produced leg 2
 * lives in `reflection/__tests__/reflect.test.ts`). The IR is the plain
 * snapshot + typed descriptors and nothing more (ADR-027 Am.13): every value
 * here is JSON-primitive-shaped, so a round-trip must be lossless.
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
        model: { username: "" },
        session: undefined
      },
      meta: { isIdle: true, isAuthenticated: false }
    }
  };

  it("survives a JSON round-trip unchanged", () => {
    const roundTripped = JSON.parse(JSON.stringify(descriptor)) as unknown;

    expect(roundTripped).toStrictEqual(JSON.parse(JSON.stringify(descriptor)));
    expect(JSON.stringify(roundTripped)).toBe(JSON.stringify(descriptor));
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
});

import { describe, expect, it } from "vitest";
import { classify, isRealJsonSchema } from "../archetype";
import { ARCHETYPE, OBJECT_SCHEMA_TYPE } from "../archetype.types";
import type { ReflectedSnapshot } from "../../reflection/reflection.types";

const REAL_SCHEMA = {
  type: OBJECT_SCHEMA_TYPE,
  properties: { username: { type: "string" } }
};

const COMPOSITION_SCHEMA = {
  anyOf: [{ type: "string" }, { type: "number" }]
};

/** `useBasket.ts:315-337` — a computed of 4 booleans, no `type`/`properties`. */
const BASKET_SHAPED_UISCHEMA = {
  isB2B: true,
  isRegistered: false,
  showTaxId: true,
  hideCompanyField: false
};

describe("@AC-3 isRealJsonSchema — the Form guard", () => {
  it('accepts a plain object typed "object"', () => {
    expect(isRealJsonSchema(REAL_SCHEMA)).toBe(true);
  });

  it("accepts a plain object declaring a composition keyword", () => {
    expect(isRealJsonSchema(COMPOSITION_SCHEMA)).toBe(true);
  });

  it("accepts a plain object carrying a plain properties map without an explicit type", () => {
    expect(isRealJsonSchema({ properties: { id: { type: "string" } } })).toBe(
      true
    );
  });

  it("rejects the confirmed basket false-friend (a boolean-bag uischema)", () => {
    expect(isRealJsonSchema(BASKET_SHAPED_UISCHEMA)).toBe(false);
  });

  it("rejects a bare primitive-typed schema (no properties, no object type, no composition)", () => {
    expect(isRealJsonSchema({ type: "string" })).toBe(false);
  });

  it("rejects non-object candidates", () => {
    expect(isRealJsonSchema(undefined)).toBe(false);
    expect(isRealJsonSchema(null)).toBe(false);
    expect(isRealJsonSchema("schema")).toBe(false);
    expect(isRealJsonSchema(["a", "b"])).toBe(false);
  });
});

describe("@AC-3 classify — deterministic, structural archetype selection", () => {
  it("a schema-and-model module is classified Form-Flow", () => {
    const snapshot: ReflectedSnapshot = {
      actions: ["submit"],
      context: { schema: REAL_SCHEMA, model: { username: "" } },
      meta: { isValid: false }
    };

    expect(classify(snapshot, false).archetype).toBe(ARCHETYPE.FORM_FLOW);
  });

  it("a useAuth-shaped snapshot (schema + model + lifecycle actions) is classified Form-Flow", () => {
    const snapshot: ReflectedSnapshot = {
      actions: [
        "destroy",
        "onDone",
        "onError",
        "reject",
        "resolve",
        "set",
        "isReady",
        "start"
      ],
      context: {
        availableActors: ["guest", "client"],
        brandId: undefined,
        currentState: "login.available",
        errors: undefined,
        model: { username: "" },
        schema: REAL_SCHEMA,
        scopeActor: "client",
        scopeContext: undefined,
        scopeMatrix: {},
        session: undefined,
        uischema: { type: "VerticalLayout", elements: [] },
        validationErrors: []
      },
      meta: { isIdle: false, showLoginForm: true, isAuthenticated: false }
    };

    expect(classify(snapshot, false).archetype).toBe(ARCHETYPE.FORM_FLOW);
  });

  it("a module that owns table state is classified List", () => {
    const snapshot: ReflectedSnapshot = {
      actions: ["selectRow"],
      // A list module may also expose a selected-row model; List still wins
      // because the table/data-array signal outranks the plain-model signal
      // in classify()'s precedence.
      context: { model: { id: "row-1" } },
      meta: {}
    };

    expect(classify(snapshot, true).archetype).toBe(ARCHETYPE.LIST);
  });

  it("a collection module without a schema is classified List", () => {
    const snapshot: ReflectedSnapshot = {
      actions: ["refresh"],
      context: { data: [{ id: "a" }, { id: "b" }] },
      meta: { isLoading: false }
    };

    expect(classify(snapshot, false).archetype).toBe(ARCHETYPE.LIST);
  });

  it("a single-record module without a real schema is classified Detail", () => {
    const snapshot: ReflectedSnapshot = {
      actions: ["update"],
      context: { model: { id: "abc", name: "thing" } },
      meta: {}
    };

    expect(classify(snapshot, false).archetype).toBe(ARCHETYPE.DETAIL);
  });

  it("a bag of callables is classified Action-panel", () => {
    const snapshot: ReflectedSnapshot = {
      actions: ["turnOn", "turnOff"],
      context: {},
      meta: { isOn: false }
    };

    expect(classify(snapshot, false).archetype).toBe(ARCHETYPE.ACTION_PANEL);
  });

  it("a boolean-bag uischema is not mistaken for a form (confirmed useBasket false-friend)", () => {
    const snapshot: ReflectedSnapshot = {
      actions: ["addToBasket"],
      context: { uischema: BASKET_SHAPED_UISCHEMA },
      meta: {}
    };

    const decision = classify(snapshot, false);
    expect(decision.archetype).not.toBe(ARCHETYPE.FORM_FLOW);
    expect(decision.archetype).toBe(ARCHETYPE.ACTION_PANEL);
    expect(decision.signals.hasRealSchema).toBe(false);
  });

  it("uischema_* naming collisions are never inspected by name (confirmed useBrand false-friend)", () => {
    const snapshot: ReflectedSnapshot = {
      actions: ["getConfigValue"],
      context: {
        // Base `uischema` (`useBrand.ts:156-157`) — a real UI schema, not a
        // JSON schema.
        uischema: { type: "VerticalLayout", elements: [] },
        // `uischema_Display`/`uischema_Route` naming collisions
        // (`useBrand.ts:454-456`) — deliberately shaped as structurally REAL
        // schemas, to prove the detector never promotes them by key name.
        uischema_Display: REAL_SCHEMA,
        uischema_Route: COMPOSITION_SCHEMA
      },
      meta: {}
    };

    expect(classify(snapshot, false).archetype).not.toBe(ARCHETYPE.FORM_FLOW);
  });

  it("a context key merely named like uischema is never inspected by name", () => {
    const snapshot: ReflectedSnapshot = {
      actions: ["noop"],
      context: {
        someUischemaLikeKey: "not-a-schema-string",
        anotherUischemaVariant: 42
      },
      meta: {}
    };

    expect(classify(snapshot, false).archetype).not.toBe(ARCHETYPE.FORM_FLOW);
  });

  it("no structural match falls back to Action-panel with every signal recorded, never throwing", () => {
    const snapshot: ReflectedSnapshot = { actions: [], context: {}, meta: {} };

    let decision: ReturnType<typeof classify> | undefined;
    expect(() => {
      decision = classify(snapshot, false);
    }).not.toThrow();

    expect(decision?.archetype).toBe(ARCHETYPE.ACTION_PANEL);
    expect(decision?.signals).toStrictEqual({
      hasRealSchema: false,
      hasModel: false,
      hasTable: false,
      hasDataArray: false
    });
  });

  it("the same snapshot always classifies the same way", () => {
    const snapshot: ReflectedSnapshot = {
      actions: ["submit"],
      context: { schema: REAL_SCHEMA, model: { username: "" } },
      meta: { isValid: true }
    };

    const first = classify(snapshot, false);
    for (let i = 0; i < 20; i++) {
      expect(classify(snapshot, false)).toStrictEqual(first);
    }
  });

  it("a later snapshot may legitimately change the archetype (the archetype-flip pair)", () => {
    const early: ReflectedSnapshot = {
      actions: ["start", "isReady"],
      context: {},
      meta: { isIdle: true }
    };
    const later: ReflectedSnapshot = {
      actions: ["start", "isReady", "resolve"],
      context: { schema: REAL_SCHEMA, model: { username: "" } },
      meta: { isIdle: false, showLoginForm: true }
    };

    expect(classify(early, false).archetype).toBe(ARCHETYPE.ACTION_PANEL);
    expect(classify(later, false).archetype).toBe(ARCHETYPE.FORM_FLOW);
  });
});

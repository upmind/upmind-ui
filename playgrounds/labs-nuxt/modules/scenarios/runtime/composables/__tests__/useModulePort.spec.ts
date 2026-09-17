// @vitest-environment jsdom
/**
 * @module scenarios/runtime/composables/__tests__/useModulePort.spec
 * @description The port's ownership detection and debug chain assembly.
 * `ownsQueryState` is the decision; `criteria` and `snapshot().debug` are the
 * payloads only present when the decision is true.
 *
 * Negative control: `useModulePort.owns-query-false.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import { computed, ref } from "vue";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { ownsQueryState, useModulePort } from "../useModulePort";
import type {
  ScenarioScopedCell,
  FourLayerComposable
} from "../../scenario.types";
import type { ModulePort } from "../useModulePort.types";
import type { ActorContextMatrix } from "@upmind-automation/headless";

/**
 * A cell that OWNS query state: context carries `query` (the live model) and
 * `schemas.query` (the declared schema).
 */
function createCellWithQueryState(): ScenarioScopedCell {
  const queryModel = ref({ verified: true });

  return {
    useActions: () => ({}),
    useContext: () => ({
      query: computed(() => queryModel.value),
      schemas: {
        query: {
          schema: {
            type: "object",
            properties: { verified: { type: "boolean" } }
          },
          uischema: { type: "VerticalLayout", elements: [] }
        }
      }
    }),
    useMeta: () => ({ isReady: true }),
    useInternals: () => ({
      query: {
        setCriteria: (next: Record<string, unknown>) => {
          queryModel.value = { ...queryModel.value, ...next };
        }
      }
    })
  };
}

/**
 * A cell that does NOT own query state: context carries neither `query` nor
 * `schemas.query`.
 */
function createCellWithoutQueryState(): ScenarioScopedCell {
  return {
    useActions: () => ({}),
    useContext: () => ({ label: ref("plain") }),
    useMeta: () => ({ isReady: true })
  };
}

function createFakeComposable(cell: ScenarioScopedCell): FourLayerComposable {
  const composable = (() => ({
    as: () => cell
  })) as FourLayerComposable;
  return composable;
}

describe("@R3 ownsQueryState", () => {
  it("returns true when cell context has query and schemas.query", () => {
    const cell = createCellWithQueryState();
    expect(ownsQueryState(cell)).toBe(true);
  });

  it("returns false when cell context lacks query", () => {
    const cell = createCellWithoutQueryState();
    expect(ownsQueryState(cell)).toBe(false);
  });

  it("returns false when cell context has query but lacks schemas.query", () => {
    const cell: ScenarioScopedCell = {
      useActions: () => ({}),
      useContext: () => ({ query: computed(() => ({})) }),
      useMeta: () => ({ isReady: true })
    };
    expect(ownsQueryState(cell)).toBe(false);
  });
});

describe("@R3 useModulePort criteria", () => {
  it("exposes criteria when cell owns query state", () => {
    const cell = createCellWithQueryState();
    const composable = createFakeComposable(cell);
    const port = useModulePort(composable);

    expect(port.criteria).toBeDefined();
    expect(port.criteria?.schema).toEqual({
      type: "object",
      properties: { verified: { type: "boolean" } }
    });
  });

  it("omits criteria when cell does not own query state", () => {
    const cell = createCellWithoutQueryState();
    const composable = createFakeComposable(cell);
    const port = useModulePort(composable);

    expect(port.criteria).toBeUndefined();
  });
});

describe("@R3 useModulePort debug chain", () => {
  it("exposes debug in snapshot when cell owns query state", () => {
    const cell = createCellWithQueryState();
    const composable = createFakeComposable(cell);
    const port = useModulePort(composable);

    const snapshot = port.snapshot();
    expect(snapshot.debug).toBeDefined();
    expect(snapshot.debug?.schema).toEqual({
      type: "object",
      properties: { verified: { type: "boolean" } }
    });
    expect(snapshot.debug?.model).toEqual({ verified: true });
  });

  it("omits debug in snapshot when cell does not own query state", () => {
    const cell = createCellWithoutQueryState();
    const composable = createFakeComposable(cell);
    const port = useModulePort(composable);

    const snapshot = port.snapshot();
    expect(snapshot.debug).toBeUndefined();
  });
});

const SCOPED_SCHEMA = {
  type: "object",
  properties: { catalogue: { type: "string" } }
};

/**
 * A cell that records the arguments every `.for()` call reaches it with, and
 * hands back a DIFFERENT, fully-layered cell than the one it was reached
 * through. Two behaviours ride on it: the arity (a catalogue context has no
 * entity to pass, and a second argument of `undefined` keys a different
 * instance from no argument), and WHICH cell comes back — the scoped one the
 * `.for()` produced, never the unscoped one the chain started at.
 */
function createForRecordingComposable() {
  const calls: unknown[][] = [];
  const queryModel = ref<Record<string, unknown>>({ catalogue: "invoice" });

  const scoped: ScenarioScopedCell = {
    useActions: () => ({ retire: () => undefined }),
    useContext: () => ({
      query: computed(() => queryModel.value),
      schemas: {
        query: {
          schema: SCOPED_SCHEMA,
          uischema: { type: "VerticalLayout", elements: [] }
        }
      }
    }),
    useMeta: () => ({ isScoped: true }),
    useInternals: () => ({
      query: {
        setCriteria: (next: Record<string, unknown>) => {
          queryModel.value = { ...queryModel.value, ...next };
        }
      }
    })
  };

  const unscoped: ScenarioScopedCell = {
    useActions: () => ({ open: () => undefined }),
    useContext: () => ({ label: ref("unscoped") }),
    useMeta: () => ({ isScoped: false })
  };

  unscoped.for = ((...args: unknown[]) => {
    calls.push(args);
    return scoped;
  }) as ScenarioScopedCell["for"];

  return {
    composable: (() => ({ as: () => unscoped })) as FourLayerComposable,
    calls
  };
}

/**
 * Reads all four layers of the cell `.for()` returned back off the port. The
 * unscoped cell carries a different value in every one of them, so a port that
 * handed back the cell it was reached through fails here rather than passing on
 * a call it never made.
 *
 * @param port - The port under test.
 */
function expectScopedCellReturned(port: ModulePort): void {
  expect(port.snapshot().actions).toContain("retire");
  expect(port.snapshot().meta.isScoped).toBe(true);
  expect(port.criteria?.schema).toEqual(SCOPED_SCHEMA);

  port.criteria?.set({ catalogue: "cancel_request" });
  expect(port.snapshot().debug?.model).toEqual({
    catalogue: "cancel_request"
  });
}

describe("@R3 useModulePort context arity (FE-3239)", () => {
  it("calls .for() with the type alone for a catalogue context, and returns that cell", () => {
    const { composable, calls } = createForRecordingComposable();

    const port = useModulePort(composable, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: "invoice" }
    });

    expect(calls).toEqual([["invoice"]]);
    expectScopedCellReturned(port);
  });

  it("calls .for() with the type AND the entity for a retargeted context, and returns that cell", () => {
    const { composable, calls } = createForRecordingComposable();

    const port = useModulePort(composable, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: "client", id: "c-9" }
    });

    expect(calls).toEqual([["client", "c-9"]]);
    expectScopedCellReturned(port);
  });

  it("calls .for() at all only when the url named a context", () => {
    const { composable, calls } = createForRecordingComposable();

    const port = useModulePort(composable, { actor: ScopeActorTypes.CLIENT });

    expect(calls).toEqual([]);
    // The control for the two cases above: with no context named, the unscoped
    // cell IS the answer — so "the scoped cell came back" is a decision the
    // port made, not a shape both paths share.
    expect(port.snapshot().meta.isScoped).toBe(false);
    expect(port.criteria).toBeUndefined();
  });
});

// -----------------------------------------------------------------------------

/**
 * A matrix declaring exactly one member, so a url naming any other type is
 * naming one this module does not serve.
 */
const ONE_MEMBER_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: "invoice",
  [ScopeActorTypes.GUEST]: null as never
} as unknown as ActorContextMatrix;

describe("@R3 useModulePort refuses a context the matrix never declared", () => {
  /**
   * The url is a hand's input. `.for(type)` validates nothing at runtime — the
   * matrix constrains it through compile-time overloads a typed string never
   * passes through — so the port is the only place the declaration is checked.
   * Without the check an undeclared type reaches the module, which resolves its
   * own default and renders THAT: one catalogue shown while the url names
   * another, with nothing to say so.
   */
  it("never reaches .for(), and boots the unserved surface instead", () => {
    const { composable, calls } = createForRecordingComposable();
    composable.scopeMatrix = ONE_MEMBER_MATRIX;

    const port = useModulePort(composable, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: "invoicee" }
    });

    expect(calls).toEqual([]);
    expect(port.snapshot().meta.isScoped).toBeUndefined();
    expect(port.snapshot().actions).toEqual([]);
    expect(port.criteria).toBeUndefined();
  });

  it("still serves the member the same matrix DOES declare", () => {
    // The control: the refusal above is a decision about the TYPE, not a port
    // that refuses every context once a matrix is present.
    const { composable, calls } = createForRecordingComposable();
    composable.scopeMatrix = ONE_MEMBER_MATRIX;

    const port = useModulePort(composable, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: "invoice" }
    });

    expect(calls).toEqual([["invoice"]]);
    expectScopedCellReturned(port);
  });

  it("lets a fresh instance through, since it takes no .for() to refuse", () => {
    const { composable, calls } = createForRecordingComposable();
    composable.scopeMatrix = ONE_MEMBER_MATRIX;

    const port = useModulePort(composable, {
      actor: ScopeActorTypes.CLIENT,
      context: { type: "invoicee" },
      fresh: true
    });

    expect(calls).toEqual([]);
    expect(port.snapshot().meta.isScoped).toBe(false);
  });
});

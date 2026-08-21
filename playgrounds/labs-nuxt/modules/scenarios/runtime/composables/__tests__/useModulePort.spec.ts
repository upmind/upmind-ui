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
import { ownsQueryState, useModulePort } from "../useModulePort";
import type {
  ScenarioScopedCell,
  FourLayerComposable
} from "../../scenario.types";

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

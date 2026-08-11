import { describe, expect, it } from "vitest";
import {
  ARCHETYPE,
  createHarness,
  SCOPE_ACTOR
} from "@upmind-automation/scenario-harness";
import { useCompositionPort } from "../useCompositionPort";
import type { LiveCompositionCell } from "../useCompositionPort.types";
import type {
  ControlledTableChannel,
  ScenarioRegistry
} from "@upmind-automation/scenario-harness";

const REFLECT_FIXTURE_KEY = { PROBE: "probe" } as const;
type ReflectFixtureKey =
  (typeof REFLECT_FIXTURE_KEY)[keyof typeof REFLECT_FIXTURE_KEY];

// Local, colocated fixture registry — never the gated headless `scenarios`
// (design.md FE-2977 §Block B); `createHarness().reflect()` never consults a
// registry entry's factory, only `Object.keys(registry)` for `K`, so this
// exists purely to satisfy `ScenarioRegistry<ReflectFixtureKey>`.
const reflectFixtureRegistry = {
  [REFLECT_FIXTURE_KEY.PROBE]: () => undefined
} satisfies ScenarioRegistry<ReflectFixtureKey>;

const harness = createHarness(reflectFixtureRegistry);

function cellWith(context: Record<string, unknown>): LiveCompositionCell {
  return {
    useActions: () => ({}),
    useContext: () => context,
    useMeta: () => ({})
  };
}

const fakeTable: ControlledTableChannel = {
  read: () => ({ filter: {}, sort: [], pagination: { page: 1, perPage: 10 } }),
  emit: () => undefined
};

describe("@AC5 reflect — adapter port drives createHarness().reflect() to the expected archetype", () => {
  it("classifies a table-owning cell as list", () => {
    const port = useCompositionPort(cellWith({ data: [{ id: 1 }] }), {
      table: fakeTable
    });

    const descriptor = harness.reflect(
      REFLECT_FIXTURE_KEY.PROBE,
      SCOPE_ACTOR.SELF,
      port
    );

    expect(descriptor.archetype.archetype).toBe(ARCHETYPE.LIST);
  });

  it("classifies a schema+model cell as form-flow", () => {
    const port = useCompositionPort(
      cellWith({ schema: { type: "object", properties: {} }, model: {} })
    );

    const descriptor = harness.reflect(
      REFLECT_FIXTURE_KEY.PROBE,
      SCOPE_ACTOR.SELF,
      port
    );

    expect(descriptor.archetype.archetype).toBe(ARCHETYPE.FORM_FLOW);
  });

  it("classifies a model-only cell as detail", () => {
    const port = useCompositionPort(cellWith({ model: {} }));

    const descriptor = harness.reflect(
      REFLECT_FIXTURE_KEY.PROBE,
      SCOPE_ACTOR.SELF,
      port
    );

    expect(descriptor.archetype.archetype).toBe(ARCHETYPE.DETAIL);
  });

  it("classifies a bare-actions cell as action-panel", () => {
    const port = useCompositionPort(cellWith({}));

    const descriptor = harness.reflect(
      REFLECT_FIXTURE_KEY.PROBE,
      SCOPE_ACTOR.SELF,
      port
    );

    expect(descriptor.archetype.archetype).toBe(ARCHETYPE.ACTION_PANEL);
  });
});

describe("@AC5 reflect — the seam where undefined is omitted (W-D29's hand-off)", () => {
  it("emits a JSON-plain snapshot from a port that hands undefined through at depth", () => {
    const port = useCompositionPort(
      cellWith({
        model: { note: undefined, kept: "kept" },
        tags: [undefined, "kept"]
      })
    );

    const { snapshot } = harness.reflect(
      REFLECT_FIXTURE_KEY.PROBE,
      SCOPE_ACTOR.SELF,
      port
    );

    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    expect(snapshot.context.model).toEqual({ kept: "kept" });
    expect(snapshot.context.tags).toEqual(["kept"]);
  });
});

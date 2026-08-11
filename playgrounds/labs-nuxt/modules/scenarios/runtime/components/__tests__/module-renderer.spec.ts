import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import {
  ARCHETYPE,
  SCOPE_ACTOR,
  reflect
} from "@upmind-automation/scenario-harness";
import { ModuleRenderer } from "../index";
import {
  ActionPanelSurface,
  DetailSurface,
  FormFlowSurface,
  ListSurface
} from "../surfaces";
import type {
  CompositionPort,
  ControlledTableChannel
} from "@upmind-automation/scenario-harness";

const rendererSourcePath = resolve(
  import.meta.dirname,
  "../ModuleRenderer.vue"
);
const rendererSource = readFileSync(rendererSourcePath, "utf-8");

// Strip block/line comments before scanning for code identifiers — a JSDoc
// line documenting "never calls classify" must not trip its own check.
const rendererCode = rendererSource
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/\/\/[^\n]*/g, "");

const fakeTable: ControlledTableChannel = {
  read: () => ({ filter: {}, sort: [], pagination: { page: 1, perPage: 10 } }),
  emit: () => undefined
};

function portWith(context: Record<string, unknown>): CompositionPort {
  return {
    snapshot: () => ({ actions: ["run"], context, meta: {} }),
    getMeta: () => ({}),
    actions: { run: () => undefined },
    table: context.data !== undefined ? fakeTable : undefined
  };
}

const fixtures = [
  {
    archetype: ARCHETYPE.LIST,
    port: portWith({ data: [{ id: 1 }] }),
    surface: ListSurface
  },
  {
    archetype: ARCHETYPE.FORM_FLOW,
    port: portWith({ schema: { type: "object", properties: {} }, model: {} }),
    surface: FormFlowSurface
  },
  {
    archetype: ARCHETYPE.DETAIL,
    port: portWith({ model: { id: 1 } }),
    surface: DetailSurface
  },
  {
    archetype: ARCHETYPE.ACTION_PANEL,
    port: portWith({}),
    surface: ActionPanelSurface
  }
] as const;

const allSurfaces = [
  ActionPanelSurface,
  DetailSurface,
  FormFlowSurface,
  ListSurface
];

describe("@AC1 ModuleRenderer — archetype dispatch, zero renderer logic", () => {
  it.each(fixtures)(
    "renders the $archetype surface from its descriptor, and no other",
    ({ archetype, port, surface }) => {
      const descriptor = reflect(archetype, SCOPE_ACTOR.SELF, port);

      const wrapper = mount(ModuleRenderer, { props: { descriptor, port } });

      expect(wrapper.findComponent(surface).exists()).toBe(true);
      for (const other of allSurfaces.filter(s => s !== surface)) {
        expect(wrapper.findComponent(other).exists()).toBe(false);
      }
    }
  );

  it("has no classify/predicate call and no headless business import in its own source", () => {
    expect(rendererCode).not.toMatch(/\bclassify\s*\(/);
    expect(rendererCode).not.toMatch(
      /\b(isRealJsonSchema|hasRealSchema|hasDataArray|hasTable|hasModel)\b/
    );
    expect(rendererCode).not.toContain("@upmind-automation/headless");

    const importLines = rendererCode
      .split("\n")
      .filter(line => /^\s*import\b/.test(line));
    for (const line of importLines) {
      expect(line).not.toMatch(/@upmind-automation\/headless/);
      expect(line).not.toMatch(/\bclassify\b/);
    }
  });
});

describe("@AC3 ModuleRenderer — LIST degrades without a table channel (finding #7)", () => {
  it("routes a LIST descriptor with no table channel to ListSurface and still renders its rows", () => {
    const port: CompositionPort = {
      snapshot: () => ({
        actions: [],
        context: { data: [{ id: 1 }, { id: 2 }] },
        meta: {}
      }),
      getMeta: () => ({}),
      actions: {},
      table: undefined
    };
    const descriptor = reflect(ARCHETYPE.LIST, SCOPE_ACTOR.SELF, port);

    expect(descriptor.archetype.archetype).toBe(ARCHETYPE.LIST);
    expect(descriptor.archetype.signals.hasTable).toBe(false);

    const wrapper = mount(ModuleRenderer, { props: { descriptor, port } });

    expect(wrapper.findComponent(ListSurface).exists()).toBe(true);
    expect(wrapper.find("table").exists()).toBe(false);
    expect(wrapper.findAll("li")).toHaveLength(2);
  });
});

// @vitest-environment jsdom
/**
 * @module scenarios/runtime/composables/__tests__/world-cells.spec
 * @description The in-page world grades meta by type and holds ONE live cell PER
 * scenario key. A number expectation is graded against the live value EXACTLY; a
 * boolean one against the live value COERCED. Cells under different keys live
 * together — a list beside any number of editors — and booting a key replaces
 * only THAT key's cell, never another's. `fire` / `expectMeta` take an optional
 * trailing scenario key that picks which one, defaulting to the last booted; an
 * unknown key is refused.
 *
 * ## What breaks if these fail
 * A declared count notice loses its real value to a `!!` coercion; booting one
 * key tears down a cell held under another; or a track drives the wrong cell —
 * the one nobody named — because the key was ignored.
 */

import { describe, expect, it } from "vitest";
import { computed, ref } from "vue";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { useScenarioWorld } from "../useScenarioWorld";
import { mapValues } from "lodash-es";
import type { ScenarioBinding, ScenarioKey } from "../../scenario.types";
import type { ScenarioScopedCell } from "../../scenario.types";
import type { LiveMeta } from "../useCompositionPort.types";
import type { WorldScope } from "@upmind-automation/scenario-harness";

// -----------------------------------------------------------------------------

const LIST: ScenarioKey = "useClientEmails";
const OTHER_LIST: ScenarioKey = "useClientNotes";
const EDITOR: ScenarioKey = "useClientEmail";
const OTHER_EDITOR: ScenarioKey = "useClientNote";

const CLIENT: WorldScope = { actor: ScopeActorTypes.CLIENT };

type SpyCell = ScenarioScopedCell & {
  destroyed: number;
  fired: Array<{ action: string; input: unknown }>;
};

/**
 * A LIST cell — its context owns query criteria (`query` + `schemas.query`) and
 * its internals expose the criteria writer, the shape a real collection cell
 * carries.
 */
function listCell(meta: LiveMeta): SpyCell {
  const queryModel = ref<Record<string, unknown>>({ verified: true });
  const cell = {
    destroyed: 0,
    fired: [] as Array<{ action: string; input: unknown }>,
    useActions: () => ({
      destroy: () => {
        cell.destroyed += 1;
      },
      ensure: (input?: unknown) => {
        cell.fired.push({ action: "ensure", input });
      },
      save: (input?: unknown) => {
        cell.fired.push({ action: "save", input });
      }
    }),
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
    useMeta: () => meta,
    useInternals: () => ({
      query: {
        setCriteria: (next: Record<string, unknown>) => {
          queryModel.value = { ...queryModel.value, ...next };
        }
      }
    })
  } as SpyCell;

  return cell;
}

/** An EDITOR cell — its context owns no query criteria. */
function editorCell(meta: LiveMeta): SpyCell {
  const model = ref({ email: "" });
  const cell = {
    destroyed: 0,
    fired: [] as Array<{ action: string; input: unknown }>,
    useActions: () => ({
      destroy: () => {
        cell.destroyed += 1;
      },
      ensure: (input?: unknown) => {
        cell.fired.push({ action: "ensure", input });
      },
      save: (input?: unknown) => {
        cell.fired.push({ action: "save", input });
      }
    }),
    useContext: () => ({ model }),
    useMeta: () => meta
  } as SpyCell;

  return cell;
}

function worldOf(cells: Record<ScenarioKey, SpyCell>) {
  const bindings = mapValues(cells, cell => ({
    useList: () => ({ as: () => cell }),
    scope: { actor: ScopeActorTypes.CLIENT, contextType: "client" }
  })) as unknown as Record<ScenarioKey, ScenarioBinding>;

  return useScenarioWorld(bindings);
}

// -----------------------------------------------------------------------------

describe("the world grades a meta expectation by its declared type", () => {
  it("passes a number expectation only on an EXACT live match", async () => {
    const world = worldOf({
      [LIST]: listCell({ consolidatableCount: 3 })
    });
    await world.boot(LIST, CLIENT);

    await expect(
      world.expectMeta({ consolidatableCount: 3 })
    ).resolves.toBeUndefined();
  });

  it("fails a number expectation that shares truthiness but not value — the count is not coerced to a boolean", async () => {
    const world = worldOf({
      [LIST]: listCell({ consolidatableCount: 3 })
    });
    await world.boot(LIST, CLIENT);

    await expect(
      world.expectMeta({ consolidatableCount: 1 })
    ).rejects.toThrow();
  });

  it("grades a boolean expectation against the live value coerced — a live count reads as its truthiness", async () => {
    const world = worldOf({
      [LIST]: listCell({ consolidatableCount: 3 })
    });
    await world.boot(LIST, CLIENT);

    await expect(
      world.expectMeta({ consolidatableCount: true })
    ).resolves.toBeUndefined();
  });

  it("grades a boolean member as a boolean", async () => {
    const world = worldOf({
      [LIST]: listCell({ isEmpty: false })
    });
    await world.boot(LIST, CLIENT);

    await expect(world.expectMeta({ isEmpty: false })).resolves.toBeUndefined();
    await expect(world.expectMeta({ isEmpty: true })).rejects.toThrow();
  });
});

describe("the world holds one live cell per scenario key", () => {
  it("boots both without disposing either — a different KIND coexists rather than replacing", async () => {
    const list = listCell({ isEmpty: false });
    const editor = editorCell({ isDirty: true });
    const world = worldOf({ [LIST]: list, [EDITOR]: editor });

    await world.boot(LIST, CLIENT);
    await world.boot(EDITOR, CLIENT);

    expect(list.destroyed).toBe(0);
    expect(editor.destroyed).toBe(0);
  });

  it("keeps a previous SAME-kind cell alive when a DIFFERENT key is booted", async () => {
    const list = listCell({ isEmpty: false });
    const otherList = listCell({ isEmpty: true });
    const world = worldOf({ [LIST]: list, [OTHER_LIST]: otherList });

    await world.boot(LIST, CLIENT);
    await world.boot(OTHER_LIST, CLIENT);

    expect(list.destroyed).toBe(0);
    expect(otherList.destroyed).toBe(0);
  });

  it("holds two EDITOR cells under two keys at once — neither disposes the other", async () => {
    const editorA = editorCell({ isDirty: true });
    const editorB = editorCell({ isDirty: false });
    const world = worldOf({ [EDITOR]: editorA, [OTHER_EDITOR]: editorB });

    await world.boot(EDITOR, CLIENT);
    await world.boot(OTHER_EDITOR, CLIENT);

    expect(editorA.destroyed).toBe(0);
    expect(editorB.destroyed).toBe(0);
  });
});

describe("the optional key addresses one of the held cells", () => {
  it("fires against the cell the key names, never the other kind", async () => {
    const list = listCell({ isEmpty: false });
    const editor = editorCell({ isDirty: true });
    const world = worldOf({ [LIST]: list, [EDITOR]: editor });
    await world.boot(LIST, CLIENT);
    await world.boot(EDITOR, CLIENT);

    await world.fire("ensure", { email: "list@example.com" }, LIST);
    await world.fire("save", { email: "editor@example.com" }, EDITOR);

    expect(list.fired).toStrictEqual([
      { action: "ensure", input: { email: "list@example.com" } }
    ]);
    expect(editor.fired).toStrictEqual([
      { action: "save", input: { email: "editor@example.com" } }
    ]);
  });

  it("grades meta against the cell the key names", async () => {
    const list = listCell({ consolidatableCount: 3 });
    const editor = editorCell({ isDirty: true });
    const world = worldOf({ [LIST]: list, [EDITOR]: editor });
    await world.boot(LIST, CLIENT);
    await world.boot(EDITOR, CLIENT);

    await expect(
      world.expectMeta({ consolidatableCount: 3 }, LIST)
    ).resolves.toBeUndefined();
    await expect(
      world.expectMeta({ isDirty: true }, EDITOR)
    ).resolves.toBeUndefined();
    await expect(
      world.expectMeta({ consolidatableCount: 3 }, EDITOR)
    ).rejects.toThrow();
  });

  it("fires against the last-booted cell when no key is given", async () => {
    const list = listCell({ isEmpty: false });
    const editor = editorCell({ isDirty: true });
    const world = worldOf({ [LIST]: list, [EDITOR]: editor });
    await world.boot(LIST, CLIENT);
    await world.boot(EDITOR, CLIENT);

    await world.fire("save", { email: "last@example.com" });

    expect(editor.fired).toStrictEqual([
      { action: "save", input: { email: "last@example.com" } }
    ]);
    expect(list.fired).toStrictEqual([]);
  });

  it("refuses a key no booted cell answers to", async () => {
    const list = listCell({ isEmpty: false });
    const world = worldOf({ [LIST]: list });
    await world.boot(LIST, CLIENT);

    await expect(world.fire("ensure", {}, "useNeverBooted")).rejects.toThrow();
    await expect(
      world.expectMeta({ isEmpty: false }, "useNeverBooted")
    ).rejects.toThrow();
  });
});

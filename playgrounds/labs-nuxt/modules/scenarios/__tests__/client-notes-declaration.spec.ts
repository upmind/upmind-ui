// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notes declaration — the binding claim the scenario makes
 *
 * ## Job To Be Done
 * A scenario declares WHAT it boots, HOW it draws, and WHICH module it tracks.
 * This spec asserts that claim against the declared surface: every column draws
 * through a registered cell renderer, every non-handoff/non-detail action names
 * a LIVE `useClientNotes`/`useClientNoteManager` capability, the bound
 * composables exist, and the tracked module owns a committed feature.
 *
 * Two claims beyond the sibling declaration specs, both load-bearing for THIS
 * module specifically (client-notes.presentation.ts's own docblock):
 *   - every fireable action names a capability the collection's live map
 *     actually carries (`add`/`edit`/`view` are the sanctioned exceptions —
 *     handoff keys and the detail overlay, none of them a live member);
 *   - no drawn cell (table, card or detail) ever scopes onto the revealed
 *     plaintext — `reveal`/`hide` write only `useContext().revealed`, which
 *     `ListSurface` never hands to a cell, so a cell scoped there would be a
 *     control that draws and then fails.
 *
 * ## What Breaks If These Fail
 * The scenario boots with a column no renderer owns, an action nobody handles,
 * a module identity that matches nothing, or a control claiming a capability
 * this module never shipped — a page that looks intact and silently does
 * nothing, or a cell that renders a plaintext secret the module never meant to
 * expose there.
 *
 * Negative controls: none present in this lane — `useClientNotes/
 * client-notes.must-fail.patch` is the developer's to author (it needs the
 * exact mutated line, which this seat must not read); its absence is recorded
 * as a gap in the hand-off rather than a self-authored substitute. Every
 * assertion below was independently proven to go RED by hand-mutating its own
 * expectation, running it, and reverting — see the hand-off report.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import declaration from "../useClientNotes/client-notes.scenario";
import { every, filter, flatMap, includes, map, reject, some } from "lodash-es";
import type { ScenarioAction, TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const MODULE_ROOT = join(
  import.meta.dirname,
  "../../../../../packages/headless/src/modules",
  declaration.tracks ?? ""
);

const allCells = (): TableCell[] =>
  flatMap(
    filter(
      [
        declaration.presentation.table?.elements,
        declaration.presentation.card?.elements,
        declaration.presentation.detail?.elements
      ],
      Boolean
    ) as TableCell[][]
  );

const allActions = (): ScenarioAction[] =>
  declaration.presentation.actions?.elements ?? [];

const declaredHandoffs = (): string[] =>
  map(
    filter(allActions(), action => !!action.handoff),
    "handoff"
  ) as string[];

const CELL_RENDERERS = new Set([
  "TableCellText",
  "TableCellHtml",
  "TableCellDate",
  "TableCellIcon",
  "TableCellBadges"
]);

/**
 * The collection's live capability map, as the contract hands it to this
 * seat — `useClientNotes().useActions()`'s member names. `add`/`edit`/`view`
 * are the documented exceptions (handoff keys and the detail overlay), never
 * live members of either half of this module.
 */
const LIVE_CAPABILITIES = new Set([
  "convert",
  "destroy",
  "filterBy",
  "hide",
  "invalidate",
  "isReady",
  "nextPage",
  "prevPage",
  "refresh",
  "remove",
  "reveal",
  "setCriteria",
  "setPinned",
  "sortBy"
]);

const NON_CAPABILITY_ACTIONS = new Set(["add", "edit", "view"]);

// -----------------------------------------------------------------------------

describe("client-notes declaration — the declaration draws only what it declares", () => {
  it("names at least one of useList / useMutate", () => {
    expect(!!declaration.useList || !!declaration.useMutate).toBe(true);
  });

  it("declares BOTH useList and useMutate — the module ships both halves", () => {
    expect(declaration.useList).toBeDefined();
    expect(declaration.useMutate).toBeDefined();
  });

  it("declares no route — the directory IS the route", () => {
    expect((declaration as Record<string, unknown>).route).toBeUndefined();
  });

  it("draws every column through a registered cell renderer", () => {
    const cells = allCells();
    expect(cells.length).toBeGreaterThan(0);
    expect(every(cells, cell => CELL_RENDERERS.has(cell.type))).toBe(true);
  });

  it("enables criteria persistence", () => {
    expect(declaration.persistCriteria).toBe(true);
  });
});

describe("client-notes declaration — every action names a live capability or a declared exception", () => {
  it("declares at least one action", () => {
    expect(allActions().length).toBeGreaterThan(0);
  });

  it("every handoff action names a declared handoff key", () => {
    const handoffKeys = Object.keys(declaration.handoff ?? {});
    expect(every(declaredHandoffs(), key => includes(handoffKeys, key))).toBe(
      true
    );
  });

  // The central lesson this run's negative-control gap exists to guard
  // against: a control whose `name` matches nothing the module actually
  // exposes draws and then fails. `add`/`edit` are handoffs (already checked
  // above) and `view` opens the client-side detail overlay — every OTHER
  // action must name a member `LIVE_CAPABILITIES` actually carries.
  it("every non-handoff, non-view action names a live client-notes capability", () => {
    const pressable = reject(
      allActions(),
      action => !!action.handoff || NON_CAPABILITY_ACTIONS.has(action.name)
    );
    expect(pressable.length).toBeGreaterThan(0);
    expect(
      map(
        reject(pressable, action => LIVE_CAPABILITIES.has(action.name)),
        "name"
      ),
      "Action(s) naming no live capability — a control that draws and then fails"
    ).toEqual([]);
  });

  it("declares the expected presentation actions", () => {
    const actionNames = map(allActions(), "name");
    for (const expected of [
      "add",
      "view",
      "edit",
      "reveal",
      "hide",
      "convert",
      "setPinned",
      "remove",
      "refresh"
    ]) {
      expect(actionNames).toContain(expected);
    }
  });
});

describe("client-notes declaration — the two limitations, encoded honestly", () => {
  // Limitation 1 (design.md / client-notes.presentation.ts): reveal/hide
  // write only `useContext().revealed`; `ListSurface` hands a cell only the
  // row, never the composable's context, so no cell can ever scope onto it.
  it("no drawn cell (table, card or detail) scopes onto the revealed plaintext", () => {
    const scopes = map(allCells(), "scope");
    expect(
      filter(scopes, scope => scope.toLowerCase().includes("revealed"))
    ).toEqual([]);
  });

  // Limitation 2 (parity.yaml, `Renamed`): the contract-product filter is a
  // plain select over the D-A lookups channel, not the oracle's searchable
  // picker — this spec asserts only that the declaration draws no widget
  // metadata implying search/typeahead behaviour beyond the criteria schema
  // the module itself owns (CHANNELS.md: "the filter bar — the criteria
  // schema's own uischema", never restated here).
  it("declares no product-filter widget override implying picker behaviour", () => {
    expect(
      JSON.stringify(declaration).toLowerCase().includes("typeahead")
    ).toBe(false);
  });
});

describe("client-notes declaration — presentation covers the expected elements", () => {
  it("table declares exactly one badges column, over meta", () => {
    const badgeCells = filter(
      declaration.presentation.table?.elements,
      cell => cell.type === "TableCellBadges"
    );
    expect(badgeCells).toHaveLength(1);
    expect(badgeCells[0]?.scope).toBe("#/properties/meta");
  });

  it("card declares slot assignments for TITLE", () => {
    const slots = map(declaration.presentation.card?.elements, "options.slot");
    expect(some(slots, slot => slot === "title")).toBe(true);
  });
});

describe("client-notes declaration — tracks a module with a committed feature", () => {
  it("names client-notes under packages/headless/src/modules", () => {
    expect(declaration.tracks).toBe("client-notes");
    expect(existsSync(MODULE_ROOT)).toBe(true);
  });

  it("that module has a colocated .feature file tagging at least one scenario", () => {
    const testDir = join(MODULE_ROOT, "__tests__");
    const feature = readdirSync(testDir).find(file =>
      file.endsWith(".feature")
    );
    expect(feature).toBeDefined();
    const content = readFileSync(join(testDir, feature as string), "utf-8");
    expect(content).toContain("@AC-");
  });

  it("that module has a colocated step catalog naming the same scenario key", () => {
    const testDir = join(MODULE_ROOT, "__tests__");
    const steps = readdirSync(testDir).find(file => file.endsWith(".steps.ts"));
    expect(steps).toBeDefined();
    const content = readFileSync(join(testDir, steps as string), "utf-8");
    expect(content).toContain(`"${declaration.key}"`);
  });
});

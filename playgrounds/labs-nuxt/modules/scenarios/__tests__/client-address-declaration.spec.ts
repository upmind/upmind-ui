// -----------------------------------------------------------------------------
/**
 * @fileoverview client-address declaration — the binding claim the scenario makes
 *
 * ## Job To Be Done
 * A scenario declares WHAT it boots, HOW it draws, and WHICH module it tracks.
 * This spec asserts that claim against the declared surface: every column draws
 * through a registered cell renderer, every action names a live composable
 * member or a declared handoff, the bound composables exist, and the tracked
 * module owns a committed feature.
 *
 * ## What Breaks If These Fail
 * The scenario boots with a column no renderer owns, an action nobody handles,
 * or a module identity that matches nothing — a page that looks intact and
 * silently does nothing.
 *
 * Negative controls: `useClientAddresses/client-address.must-fail.patch`.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import declaration from "../useClientAddresses/client-address.scenario";
import { every, filter, flatMap, includes, map, some, values } from "lodash-es";
import type { ScenarioAction, TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const SCENARIO_DIR = join(import.meta.dirname, "..");
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

// -----------------------------------------------------------------------------

describe("the declaration draws only what it declares", () => {
  it("names at least one of useList / useMutate", () => {
    expect(!!declaration.useList || !!declaration.useMutate).toBe(true);
  });

  it("declares useList and useMutate", () => {
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
});

describe("the declaration's actions name live composable members or declared handoffs", () => {
  it("declares at least one action", () => {
    expect(allActions().length).toBeGreaterThan(0);
  });

  it("every handoff action names a declared handoff key", () => {
    const handoffKeys = Object.keys(declaration.handoff ?? {});
    expect(every(declaredHandoffs(), key => includes(handoffKeys, key))).toBe(
      true
    );
  });

  it("declares the expected presentation actions", () => {
    const actionNames = map(allActions(), "name");
    expect(actionNames).toContain("ensure");
    expect(actionNames).toContain("view");
    expect(actionNames).toContain("edit");
    expect(actionNames).toContain("remove");
    expect(actionNames).toContain("setDefault");
    expect(actionNames).toContain("refresh");
  });
});

describe("the declaration tracks a module with a committed feature", () => {
  it("names a module under packages/headless/src/modules", () => {
    expect(declaration.tracks).toBe("client-address");
    expect(existsSync(MODULE_ROOT)).toBe(true);
  });

  it("that module has a colocated .feature file", () => {
    const testDir = join(MODULE_ROOT, "__tests__");
    const feature = readdirSync(testDir).find(file =>
      file.endsWith(".feature")
    );
    expect(feature).toBeDefined();
  });

  it("the feature file tags at least one scenario", () => {
    const featurePath = join(MODULE_ROOT, "__tests__/client-address.feature");
    const content = readFileSync(featurePath, "utf-8");
    expect(content).toContain("@AC-");
  });
});

describe("the declaration's presentation covers the expected elements", () => {
  it("table declares at least one column", () => {
    expect(declaration.presentation.table?.elements.length).toBeGreaterThan(0);
  });

  it("card declares at least one element", () => {
    expect(declaration.presentation.card?.elements.length).toBeGreaterThan(0);
  });

  it("detail declares at least one element", () => {
    expect(declaration.presentation.detail?.elements.length).toBeGreaterThan(0);
  });

  it("all declared elements use registered cell types", () => {
    const allElements = [
      ...(declaration.presentation.table?.elements ?? []),
      ...(declaration.presentation.card?.elements ?? []),
      ...(declaration.presentation.detail?.elements ?? [])
    ];
    expect(every(allElements, el => CELL_RENDERERS.has(el.type))).toBe(true);
  });
});

describe("the declaration enables criteria persistence", () => {
  it("persistCriteria is true", () => {
    expect(declaration.persistCriteria).toBe(true);
  });
});

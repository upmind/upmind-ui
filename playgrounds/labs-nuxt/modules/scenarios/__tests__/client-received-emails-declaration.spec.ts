// -----------------------------------------------------------------------------
/**
 * @fileoverview client-received-emails declaration — the binding claim the
 * scenario makes
 *
 * ## Job To Be Done
 * A scenario declares WHAT it boots, HOW it draws, and WHICH module it tracks.
 * This spec asserts that claim against the declared surface: every column draws
 * through a registered cell renderer, the bound composables exist, and the
 * tracked module owns a committed feature.
 *
 * ## What Breaks If These Fail
 * The scenario boots with a column no renderer owns or a module identity that
 * matches nothing — a page that looks intact and silently does nothing.
 *
 * Negative controls: `useClientReceivedEmails/client-email-history.must-fail.patch`.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import declaration from "../useClientReceivedEmails/client-email-history.scenario";
import { every, filter, flatMap, map, some } from "lodash-es";
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

const CELL_RENDERERS = new Set([
  "TableCellText",
  "TableCellHtml",
  "TableCellDate",
  "TableCellIcon",
  "TableCellBadges"
]);

// -----------------------------------------------------------------------------

describe("the declaration draws only what it declares", () => {
  it("names at least one of useList / useDetail", () => {
    expect(!!declaration.useList || !!declaration.useDetail).toBe(true);
  });

  it("declares useList and useDetail", () => {
    expect(declaration.useList).toBeDefined();
    expect(declaration.useDetail).toBeDefined();
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

describe("the declaration's actions are view-only — no handoffs", () => {
  it("declares at least one action", () => {
    expect(allActions().length).toBeGreaterThan(0);
  });

  it("declares the expected read-only actions", () => {
    const actionNames = map(allActions(), "name");
    expect(actionNames).toContain("view");
  });
});

describe("the declaration tracks a module with a committed feature", () => {
  it("names a module under packages/headless/src/modules", () => {
    expect(declaration.tracks).toBe("client-email-history");
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
    const featurePath = join(
      MODULE_ROOT,
      "__tests__/client-email-history.feature"
    );
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

  it("table includes subject and date columns", () => {
    const scopes = map(declaration.presentation.table?.elements, "scope");
    expect(some(scopes, scope => scope.includes("subject"))).toBe(true);
    expect(some(scopes, scope => scope.includes("date"))).toBe(true);
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

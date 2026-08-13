// -----------------------------------------------------------------------------
/**
 * @module cells/__tests__/table-cell-tester.spec
 * @description `R6-36` — every cell renderer registers with its OWN `uiTypeIs`
 * tester, and the four testers partition the declared cell types: each element
 * type is claimed by exactly one entry, and an unregistered type by none. The
 * tester is what decides what a declaration draws, so it is the line under test
 * rather than the component behind it.
 *
 * ## What Breaks If These Fail
 * Two renderers claim one type and the winner is whichever ranks higher — a
 * copy-paste a fifth cell type invites, which silently retires a renderer that
 * is still exported, still registered and still passing its own render tests.
 *
 * Negative controls: `table-cell-tester.must-fail.patch`.
 */

import { rankWith, uiTypeIs } from "@jsonforms/core";
import { describe, expect, it } from "vitest";
import { tableCellRenderers } from "../cells.renderers";
import { filter, map, size, uniq } from "lodash-es";
import type { TableCell } from "../../../scenario.types";
import type {
  JsonSchema,
  TesterContext,
  UISchemaElement
} from "@jsonforms/core";

// -----------------------------------------------------------------------------

const DECLARED_TYPES: TableCell["type"][] = [
  "TableCellText",
  "TableCellDate",
  "TableCellIcon",
  "TableCellBadges"
];

const NO_SCHEMA = {} as JsonSchema;
const NO_CONTEXT: TesterContext = { rootSchema: NO_SCHEMA, config: {} };

const NOT_APPLICABLE = -1;

/** Which registry entries claim an element of this ui type. */
const claimants = (type: string) =>
  filter(
    tableCellRenderers,
    entry =>
      entry.tester({ type } as UISchemaElement, NO_SCHEMA, NO_CONTEXT) >
      NOT_APPLICABLE
  );

// -----------------------------------------------------------------------------

describe("R6-36 the testers partition the declared cell types", () => {
  it("registers one entry per declared type and no more", () => {
    expect(size(tableCellRenderers)).toBe(size(DECLARED_TYPES));
  });

  it("gives every declared type exactly one claimant", () => {
    expect(map(DECLARED_TYPES, type => size(claimants(type)))).toEqual([
      1, 1, 1, 1
    ]);
  });

  it("never lets two types resolve to the same renderer", () => {
    const resolved = map(
      DECLARED_TYPES,
      type => claimants(type)[0]?.renderer as unknown
    );

    expect(size(uniq(resolved))).toBe(size(DECLARED_TYPES));
  });

  it("claims nothing for a ui type no renderer registered for", () => {
    expect(claimants("TableCellNobodyRegistered")).toEqual([]);
  });
});

describe("R6-36 each tester is a real uiTypeIs tester, not a positional guess", () => {
  it("answers the same rank the ecosystem's own uiTypeIs answers", () => {
    const own = map(DECLARED_TYPES, type =>
      (claimants(type)[0] as (typeof tableCellRenderers)[number]).tester(
        { type } as UISchemaElement,
        NO_SCHEMA,
        NO_CONTEXT
      )
    );

    const ecosystem = map(DECLARED_TYPES, type =>
      rankWith(1, uiTypeIs(type))(
        { type } as UISchemaElement,
        NO_SCHEMA,
        NO_CONTEXT
      )
    );

    expect(own).toEqual(ecosystem);
  });
});

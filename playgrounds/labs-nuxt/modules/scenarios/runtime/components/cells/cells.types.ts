/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-12, 7394 nodes) — no
 * `TableCellProps` node exists in the tree, and no cell-renderer prop shape
 * under any other name. Nothing else here is minted: the element is
 * `runtime/scenario.types`' own `TableCell` union and the record is
 * `surfaces/ListSurface.types`' `ListRow`, both consumed rather than
 * re-declared. See `graphify-out/GRAPH_REPORT.md`.
 * Re-queried 2026-08-13 over the same `graphify-out/graph.json` (7457 nodes)
 * for a cell/column WIDTH vocabulary (`CellSizing` / `CellWidth` /
 * `ColumnSizing` / `ColumnWidth` / `*SizeTypes` / `*WidthTypes`): zero matches,
 * so `CellSizingTypes` is minted here once, beside the props every renderer
 * already answers to. The registry entry it rides on is `@jsonforms/core`'s own
 * `JsonFormsRendererRegistryEntry`, consumed rather than re-spelt.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/cells/cells.types
 * @description What every declared-cell renderer is handed — the element whose
 * own `type` selected it, and the record it draws one field of — and what it
 * answers back about the column it draws in.
 */

import type { TableCell } from "../../scenario.types";
import type { ListRow } from "../surfaces/ListSurface.types";
import type { JsonFormsRendererRegistryEntry } from "@jsonforms/core";

// -----------------------------------------------------------------------------

/**
 * A renderer narrows the element to the member it registered for, so its
 * declared options are typed rather than probed.
 */
export type TableCellProps<TElement extends TableCell = TableCell> = {
  element: TElement;
  row: ListRow;
};

/**
 * How wide the column a renderer draws in is (`R7-2`). It is the RENDERER's
 * answer, not the declaration's and not the surface's: a glyph is a glyph in
 * every table, so every column that ever draws one is sized the same way
 * without the scenario saying anything.
 */
export enum CellSizingTypes {
  /**
   * The column measures to what is in it — the glyph and its padding. A cell
   * of fixed width takes an equal share of the row otherwise, which is how one
   * star ends up as wide as an email address.
   */
  CONTENT = "content",
  /** The column absorbs the remainder, shared equally with the other fluid ones. */
  FLUID = "fluid"
}

/**
 * One entry of the declared-cell registry: the JSONForms pair the dispatcher
 * resolves against, plus what the renderer says about its own width. Absent,
 * a renderer is {@link CellSizingTypes.FLUID} — the treatment text has always
 * had, so only a renderer that measures to its content declares anything.
 */
export type TableCellRenderer = JsonFormsRendererRegistryEntry & {
  sizing?: CellSizingTypes;
};

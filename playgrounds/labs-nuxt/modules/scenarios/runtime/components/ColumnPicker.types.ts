/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-12, 7394 nodes) — no
 * `ColumnPicker` / `ColumnPickerProps` / `ColumnOption` node exists in the tree,
 * and no column-visibility shape under any other name, so both are minted for
 * this one control. Nothing else is: the options are derived from the table
 * uischema's own elements (`runtime/scenario.types`' `TableUischema`), which the
 * surface passes in already resolved, and the replay refusal is the ui
 * `Button`'s own `disabled`. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ColumnPicker.types
 * @description Type definitions for the display row's column picker — which of
 * the declared columns the table is drawing.
 */

// -----------------------------------------------------------------------------

/** One offerable column: the key the url carries, its header, and whether it is drawn. */
export type ColumnOption = {
  /** The field the column's declared `scope` addresses — the url's own token. */
  value: string;
  /** The column header, resolved from the element's own `i18n` key. */
  label: string;
  isVisible: boolean;
};

export type ColumnPickerProps = {
  /**
   * Every column the table DECLARES, in declaration order — the picker's whole
   * option list, one entry per Control (`R6-35`). Order is the declaration's;
   * the picker chooses what is drawn, never where.
   */
  columns: ColumnOption[];
  /**
   * A scenario is driving the collection, so what it draws is the script's
   * (`R6-23`). The trigger refuses to open rather than disappearing, which is
   * what makes the refusal read as intentional.
   */
  disabled?: boolean;
};

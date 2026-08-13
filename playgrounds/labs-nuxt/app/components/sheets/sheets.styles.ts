import { cva } from "class-variance-authority";
// -----------------------------------------------------------------------------
/**
 * @module sheets/sheets.styles
 * @description CVA configuration for the sheet host and its Debug pane.
 *
 * The host sets no width on the page and no page-side padding: a sheet is drawn
 * over the canvas, so the only geometry here is the panel's own (`P1-R5`).
 */

/**
 * A fenced block as the sheets draw it, stated once for every pane that shows
 * one. `Markdown` is prose, and prose ships its own code-block theme — a dark
 * `pre` whose text colour is that same dark, which paints a solid slab where the
 * code should be (`R6-11`). The block's surface is the pane's own canvas, so the
 * fence is handed back to it and the text simply inherits.
 */
export const fenceBlock = cva(
  "bg-canvas prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-inherit prose-code:text-inherit overflow-x-auto rounded-lg p-3"
);

export default {
  sheetHost: {
    root: cva("flex flex-col gap-0 overflow-hidden p-0"),

    // The panel's own strip, holding the switcher that stays reachable while the
    // panel covers the bar's. It sits above the pane, so it carries the divider.
    header: cva("border-surface shrink-0 border-b p-3"),

    tabs: cva("bg-canvas h-full flex-1 overflow-hidden p-4"),

    // The pane scrolls inside the panel rather than growing it, so a long
    // context or a long fence never reaches for the page's own width.
    pane: cva("max-h-[calc(100vh-8rem)] overflow-y-auto"),

    // The untabbed panes have no tab strip to inherit an inset from, so they
    // carry the same one themselves rather than sitting flush to the panel edge.
    body: cva("p-4"),

    empty: cva("text-muted p-4 text-xs")
  },

  debugPane: {
    root: cva("space-y-1"),

    section: cva(""),

    header: cva("border-surface relative mb-3 border-b pt-3 pb-1"),

    title: cva("text-display text-sm font-bold"),

    badges: cva("flex flex-wrap gap-2"),

    collapsible: cva("mt-3"),

    trigger: cva(
      "text-muted hover:text-display cursor-pointer text-xs font-semibold tracking-wider uppercase transition-colors"
    ),

    errors: cva("cursor-pointer"),

    errorPre: cva(
      "bg-accent-danger-muted text-accent-danger mt-2 max-h-48 w-full overflow-auto rounded-lg p-3 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap"
    ),

    matrix: cva("mt-2 space-y-1"),

    matrixRow: cva("flex items-center gap-2 text-xs"),

    matrixActor: cva("text-muted min-w-16 font-medium"),

    matrixArrow: cva("text-faint"),

    matrixContexts: cva("")
  }
};

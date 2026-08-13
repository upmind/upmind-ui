/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — a
 * label + source-file scan for `DebugPane` · `SheetHost` · pane-props returns
 * nothing: the only debug-panel nodes in the tree are
 * `app/components/inspector/**` (`Inspector.vue`, `inspector.types.ts`,
 * `useInspector.ts`), the files this pane replaces. So the props below are
 * minted, and the section shape they carry is NOT — `InspectorSection` is the
 * Inspector's own, relocated into `usePlaygroundSheet.types.ts` and consumed
 * here. See `graphify-out/GRAPH_REPORT.md`.
 */
// -----------------------------------------------------------------------------
/**
 * @module sheets/DebugPane.types
 * @description What the Debug view draws: exactly one registered section, the
 * host having chosen it by tab (`AC3.2`).
 */

import type { InspectorSection } from "./usePlaygroundSheet.types";

// -----------------------------------------------------------------------------

export type DebugPaneProps = {
  /**
   * The section to draw — a live read of the registering page's own state, meta,
   * context, scope matrix and errors. The pane renders what the section carries
   * and nothing else: a section with no scope has no scope block.
   */
  section: InspectorSection;
};

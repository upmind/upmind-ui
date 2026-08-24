// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ManageDialog.types
 * @description Type definitions for the editor a collection hands off to.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) —
 * `ResolvedHandoff` is minted once in `runtime/scenario.types.ts` and consumed
 * here rather than re-declared, and the record it opens on is headless's own
 * `ScopeContext`. The `fieldScope` member (2026-08-24) narrows the editor to
 * one field. See `graphify-out/GRAPH_REPORT.md`.
 */

import type { ResolvedHandoff } from "../scenario.types";
import type { ScopeContext } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export type ManageDialogProps = {
  /** The declared handoff, bound to the editor composable that drives it. */
  handoff: ResolvedHandoff;
  /**
   * The record being edited — whole, read off the row by the handoff's own
   * pointer. Absent, the editor opens on a record that does not exist yet.
   */
  context?: ScopeContext;
  /**
   * Narrows the editor to ONE field — the field code resolved from the row.
   * The editor draws only the control whose scope matches this field; absent,
   * the full form renders.
   */
  fieldScope?: string;
};

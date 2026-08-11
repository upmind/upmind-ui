// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ManageDialog.types
 * @description Type definitions for the editor a collection hands off to.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) —
 * `ResolvedHandoff` is minted once in `runtime/scenario.types.ts` and consumed
 * here rather than re-declared.
 */

import type { ResolvedHandoff } from "../scenario.types";

// -----------------------------------------------------------------------------

export type ManageDialogProps = {
  /** The declared handoff, already resolved to the target it opens. */
  handoff: ResolvedHandoff;
  /**
   * The record being edited, read from the row by the handoff's own
   * `contextFrom`. Absent, the editor opens on a new record.
   */
  contextId?: string;
};

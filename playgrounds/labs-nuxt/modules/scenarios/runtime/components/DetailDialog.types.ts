// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/DetailDialog.types
 * @description Type definitions for the read-only detail overlay — the read
 * twin of `ManageDialog`.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-14, 7457 nodes) — no
 * `DetailDialogProps` node exists in the tree; `ResolvedDetail` /
 * `DetailUischema` are minted once in `runtime/scenario.types.ts`, the row's
 * actions are `ActionSlots`' own `ActionSlotItem`, and the scope it boots at is
 * headless's own `ScopeContext`, all consumed rather than re-declared. See
 * `graphify-out/GRAPH_REPORT.md`.
 */

import type { ActionSlotItem } from "./ActionSlots.types";
import type { DetailUischema, ResolvedDetail } from "../scenario.types";
import type { ScopeContext } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export type DetailDialogProps = {
  /**
   * The clicked row — the record shown outright on the row-data path, and the
   * feed the fetch path replaces once its full record lands.
   */
  record: Record<string, unknown>;
  /**
   * The scenario's bound read composable, present iff it fetches the full
   * record. Absent, the overlay renders {@link DetailDialogProps.record} with
   * no fetch.
   */
  detail?: ResolvedDetail;
  /**
   * The scope the read boots at — the row's identity resolved to a
   * `.for(type, id)` by the list surface. Present iff {@link
   * DetailDialogProps.detail} is, and its absence (no id on the row) is what
   * keeps the overlay on the row-data path.
   */
  context?: ScopeContext;
  /** How the record draws — the declared read fields; absent, a raw dump. */
  presentation?: DetailUischema;
  /**
   * The row's own actions, pre-bound by the list surface. Edit rides here and
   * hands off to the existing editor exactly as it does from the row.
   */
  actions: ActionSlotItem[];
  /** A scenario is driving the surface, so the actions refuse and say why (`R6-23`). */
  locked?: boolean;
};

// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/DetailDialog.types
 * @description Type definitions for the read-only detail overlay — the read
 * twin of `ManageDialog`.
 *
 * @graphify-citation `graphify-out/graph.json` (2026-08-14, 7457 nodes) — no
 * `DetailDialogProps` node exists in the tree; `ResolvedDetail` /
 * `DetailUischema` are minted once in `runtime/scenario.types.ts` and the row's
 * actions are `ActionSlots`' own `ActionSlotItem`, both consumed rather than
 * re-declared. The read's target is a plain record id (the builder's
 * `.withId(id)`), so headless's `ScopeContext` is no longer consumed here. See
 * `graphify-out/GRAPH_REPORT.md`.
 */

import type { ActionSlotItem } from "./ActionSlots.types";
import type { DetailUischema, ResolvedDetail } from "../scenario.types";

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
   * The record the read fetches — the row's identity, read off the row by the
   * list surface and handed to the builder's `.withId(id)`. Present iff {@link
   * DetailDialogProps.detail} is, and its absence (no id on the row) is what
   * keeps the overlay on the row-data path. See this file's head
   * `graphify-out/` citation for why this is an id and not a context.
   */
  id?: string;
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

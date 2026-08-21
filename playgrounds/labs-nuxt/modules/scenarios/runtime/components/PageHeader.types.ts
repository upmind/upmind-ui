/**
 * @graphify-citation `graphify-out/graph.json` (2026-08-10, 6795 nodes) — no
 * `PageHeader` / `PageHeaderProps` node exists anywhere in the tree, and no
 * page-header component exists in `packages/ui` or `packages/client-vue` to
 * consume. The action shape is NOT re-declared here: it is
 * `ActionSlotItem`, minted once in `ActionSlots.types.ts` and already the
 * currency every surface hands its pre-bound declared actions in. See
 * `graphify-out/GRAPH_REPORT.md`. Re-queried 2026-08-13 over the same
 * `graphify-out/graph.json` for a replay-LOCK shape (`lock*`): the twelve
 * matches are all `block*` parser helpers, so nothing exists to consume — and
 * nothing is minted either, the lock being a boolean on the props already here.
 */
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/PageHeader.types
 * @description Type definitions for the page header — the scenario's own name
 * and the collection's own actions.
 */

import type { ActionSlotItem } from "./ActionSlots.types";

// -----------------------------------------------------------------------------

export type PageHeaderProps = {
  /**
   * The page's identity: the composable this scenario boots, which IS its
   * directory, its url segment and its route name — `RegisteredScenario.route`
   * (D1). Never a prettified alias, or the title would disagree with the path.
   */
  name: string;
  /**
   * The COLLECTION's own actions, already bound to their triggers by the
   * surface that owns the handoff they open (G4): the header renders the
   * control, the list still owns the editor it opens. Row actions never reach
   * here, and neither does a display setting — sort and view belong to the data
   * surface (G3).
   */
  actions?: ActionSlotItem[];
  /**
   * A scenario is driving the page, so Add new is held to what the script fires
   * (`R6-23`). The control stays where it is and says why it will not fire;
   * hiding it would move the row the moment a track armed.
   */
  locked?: boolean;
};

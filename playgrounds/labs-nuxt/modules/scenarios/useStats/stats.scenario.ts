// -----------------------------------------------------------------------------
/**
 * @module scenarios/useStats/stats.scenario
 * @description The client dashboard's stats — the four counts (total orders,
 * total invoices, unpaid invoices, active tickets) AND the Upmind-usage block,
 * on ONE scenario, because the module behind them is ONE composable.
 *
 * This module DRAWS ITSELF: `stats.page.vue` beside this file is the route's
 * component, so the shared renderer never sees it. `useStats` binds no
 * `useList` and no `useMutate` — it is five scoped single reads with no
 * context (design 8.9, ruling R11 B1) — so there is no table, card or detail
 * surface to bind to, and no forced-surface spec is owed
 * (`forced-surface-coverage.spec.ts`'s `drawsItself` exemption).
 *
 * Registration is unchanged by that: the key, the icon, the url segment and
 * the sidebar entry all come from here, exactly as they do for a
 * playground-drawn module.
 */

import { useStats } from "@upmind-automation/headless";
import type { ScenarioDeclaration } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** This module's key — the identity a `.feature` and the BDD world name it by. */
export const STATS_SCENARIO = "stats";

export default {
  key: STATS_SCENARIO,
  // No route params: the identity is always the signed-in client, self —
  // never a record id (design 8.9).

  // SELF-DRAWN: no `useList` / `useMutate` and no table / card / detail
  // uischema, because this module reads four fixed counts and one usage block
  // — neither a collection nor a record-by-id for the shared runtime to draw.
  // The record archetype is keyed on a record id (`useRecordTransport` boots
  // `.withId(id)`), which a self read has none of, so the page beside this file
  // draws them itself.
  //
  // It OPTS IN to the playlist all the same: `useManage` gives the harness a
  // boot thunk for the `stats` key, and `tracks` names the module whose
  // committed `.feature` and step catalog the page's own `ScenarioBar` plays —
  // each step booting the client×self cell the page already renders.
  useManage: useStats,
  tracks: "stats",
  presentation: {
    icon: "bar-chart-03"
  }
} satisfies ScenarioDeclaration;

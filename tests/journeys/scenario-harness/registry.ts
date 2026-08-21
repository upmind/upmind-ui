// -----------------------------------------------------------------------------
/**
 * @module tests/journeys/scenario-harness/registry
 * @description The Node/Playwright-executor live-factory map: keys come from
 * this consumer's own manifest (`./manifest.ts`'s `COMPOSABLE_KEY`) — the
 * package itself ships no manifest (item 4). The factory values are
 * executor-side, live from day one — `useAuth` is already 4-layer, so this
 * binds real behaviour, not a stub. The explicit `ScenarioRegistry<…>`
 * annotation (a plain `satisfies` infers an anonymous type referencing
 * @jsonforms/core internals that TS refuses to name — TS2742) gives the same
 * exhaustiveness: renaming or removing `COMPOSABLE_KEY.AUTH` fails
 * compilation here (@AC-6).
 */

import { useAuth } from "@upmind-automation/headless";
import { COMPOSABLE_KEY } from "./manifest";
import type { ComposableKey } from "./manifest";
import type { ScenarioRegistry } from "@upmind-automation/scenario-harness";

export const registry: ScenarioRegistry<
  ComposableKey,
  ReturnType<typeof useAuth>
> = {
  [COMPOSABLE_KEY.AUTH]: () => useAuth()
};

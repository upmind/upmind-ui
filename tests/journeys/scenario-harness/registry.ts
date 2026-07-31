// -----------------------------------------------------------------------------
/**
 * @module tests/journeys/scenario-harness/registry
 * @description The Node/Playwright-executor live-factory map: keys come from
 * the ONE shared manifest (`COMPOSABLE_KEY`); the factory values are
 * executor-side, live from day one — `useAuth` is already 4-layer, so this
 * binds real behaviour, not a stub. `satisfies ComposableRegistry<…>` gives
 * exhaustiveness: renaming or removing `COMPOSABLE_KEY.AUTH` fails
 * compilation here (@AC-6).
 */

import { useAuth } from "@upmind-automation/headless";
import { COMPOSABLE_KEY } from "@upmind-automation/scenario-harness";
import type { ComposableRegistry } from "@upmind-automation/scenario-harness";

export const registry = {
  [COMPOSABLE_KEY.AUTH]: () => useAuth()
} satisfies ComposableRegistry<ReturnType<typeof useAuth>>;

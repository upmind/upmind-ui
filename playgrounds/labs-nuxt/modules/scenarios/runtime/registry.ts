// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/registry
 * @description THE scenario index — collected, never hand-listed. Every
 * `<useComposable>/<module>.scenario.ts` beside this runtime is a scenario, and
 * `ls` over the module directory is the complete inventory: a declaration
 * cannot be written and left unregistered, and an entry cannot be registered
 * with no declaration behind it.
 *
 * The directory name is the scenario's url segment and route name, attached
 * here from the glob key. The build-time registrar (`../index.ts`) derives the
 * same segment from the same directory, and its `pages:resolved` guard fails
 * the build if two ever collide.
 */

import { SCENARIO_ROUTE_META_KEY } from "./scenario.constants";
import {
  filter,
  find,
  fromPairs,
  get,
  keyBy,
  keys,
  map,
  values
} from "lodash-es";
import type {
  RegisteredScenario,
  ScenarioDeclaration,
  ScenarioKey
} from "./scenario.types";
import type { ScenarioRegistry } from "@upmind-automation/scenario-harness";
import type { RouteLocationNormalized } from "vue-router";

// -----------------------------------------------------------------------------

const SCENARIO_DIRECTORY = /\/([^/]+)\/[^/]+\.scenario\.ts$/;

const declared = import.meta.glob<{ default: ScenarioDeclaration }>(
  "../*/*.scenario.ts",
  { eager: true }
);

const sources = import.meta.glob<string>("../*/*.scenario.ts", {
  query: "?raw",
  import: "default",
  eager: true
});

/** Every scenario, keyed by its own declared key. */
export const registry: Record<ScenarioKey, RegisteredScenario> = fromPairs(
  map(keys(declared), path => {
    const declaration = get(declared, [path, "default"]);
    const route = SCENARIO_DIRECTORY.exec(path)?.[1] as string;
    return [declaration.key, { ...declaration, route }];
  })
);

/** Every declared key, in directory order — what the playground loops. */
export const scenarioKeys = keys(registry);

/**
 * The keys the harness can BOOT — a self-drawn module binds no collection and
 * no editor, so there is no thunk to build for it and asking for one throws.
 *
 * Unless it OPTS IN. A self-drawn page that boots the module itself and merely
 * draws it by hand says so with `useManage`, and is bound here like any other
 * (`scenario.types.ts`). The member is read LAST, so a declaration already
 * binding a renderer keeps exactly the thunk it had, and a declaration naming
 * none of the three is excluded exactly as before.
 */
const boundKeys = filter(
  scenarioKeys,
  key =>
    !!(
      get(registry, [key, "useList"]) ??
      get(registry, [key, "useMutate"]) ??
      get(registry, [key, "useManage"])
    )
);

/**
 * The same scenarios addressed by their url segment. The registrar cannot read
 * a declaration (it runs before the app exists), so a route carries only the
 * directory it came from and resolves the rest through here.
 */
export const scenarioRoutes: Record<string, RegisteredScenario> = keyBy(
  values(registry),
  "route"
);

/**
 * The url segment a route location's own PAGE record was registered under.
 *
 * Never `route.meta[SCENARIO_ROUTE_META_KEY]`: vue-router merges `meta` down
 * the matched chain and the deeper record wins, so an overlay child injected
 * over a scenario page shadows the page's key with its own — an overlay that is
 * itself a scenario module (`overlay-payment`, `overlay-upgrade`) would make
 * the page beneath it draw the overlay's declaration. The FIRST matched record
 * carrying the key is the page; every deeper one is an overlay over it.
 *
 * @param route - The route location to read, or nothing before one resolves.
 * @returns The page's url segment, or `""` when no matched record declares one.
 */
export function scenarioRouteOf(
  route?: Pick<RouteLocationNormalized, "matched">
): string {
  const page = find(route?.matched, record =>
    get(record, ["meta", SCENARIO_ROUTE_META_KEY])
  );

  return get(page, ["meta", SCENARIO_ROUTE_META_KEY], "") as string;
}

/**
 * Each declaration's own `ts` source, addressed by the same url segment — what
 * the Scenario sheet draws verbatim (`AC3.4`). Read from the SAME glob the
 * inventory above is built from, so a page can never be handed another
 * scenario's source and a declaration cannot exist without one.
 */
export const scenarioSources: Record<string, string> = fromPairs(
  map(keys(sources), path => [
    SCENARIO_DIRECTORY.exec(path)?.[1] as string,
    get(sources, path, "")
  ])
);

/**
 * The harness registry stays exactly what F-1 defined — keys → boot thunks —
 * built from the same declarations, so a scenario reaches the BDD executor
 * without a second map to keep in step.
 *
 * Annotated rather than `satisfies`-ed: the annotation widens the thunk's
 * return to `unknown`, without which `createHarness` infers `T` from the first
 * entry alone and every later key reds against that one module's cell shape.
 */
export const scenarioRegistry: ScenarioRegistry<ScenarioKey, unknown> =
  fromPairs(
    map(boundKeys, key => [
      key,
      // The collection where the module publishes one, else its editor — the
      // two the binding's own union guarantees at least one of — else the
      // composable a self-drawn page opted in with. Same order as `boundKeys`,
      // which is what keeps the set and the thunks one reading.
      () =>
        (get(registry, [key, "useList"]) ??
          get(registry, [key, "useMutate"]) ??
          get(registry, [key, "useManage"]))!()
    ])
  );

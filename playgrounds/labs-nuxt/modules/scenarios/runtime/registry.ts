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

import { fromPairs, get, keyBy, keys, map, values } from "lodash-es";
import type {
  RegisteredScenario,
  ScenarioDeclaration,
  ScenarioKey
} from "./scenario.types";
import type { ScenarioRegistry } from "@upmind-automation/scenario-harness";

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
 * The same scenarios addressed by their url segment. The registrar cannot read
 * a declaration (it runs before the app exists), so a route carries only the
 * directory it came from and resolves the rest through here.
 */
export const scenarioRoutes: Record<string, RegisteredScenario> = keyBy(
  values(registry),
  "route"
);

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
    map(scenarioKeys, key => [
      key,
      // The collection where the module publishes one, else its editor — the
      // two the binding's own union guarantees at least one of.
      () =>
        (get(registry, [key, "useList"]) ?? get(registry, [key, "useMutate"]))()
    ])
  );

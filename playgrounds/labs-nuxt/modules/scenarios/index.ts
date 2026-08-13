// -----------------------------------------------------------------------------
/**
 * @module scenarios/index
 * @description THE scenario system, whole — one local Nuxt module holding the
 * shared `ScenarioPlayground`, the surfaces, the seam port, the world bridge,
 * the registry, and one declaration directory per composable. Lift the
 * directory and the whole playground travels with it; nothing scenario-shaped
 * can leak into `app/**` or back into `packages/headless`, which has no
 * scenario concept at all.
 *
 * This file is the REGISTRAR and nothing else. It discovers
 * `<useComposable>/<module>.scenario.ts` beside itself and pushes one route per
 * DIRECTORY at the one shared component, so a scenario has no page file to
 * drift in and cannot be declared-but-unrouted. It deliberately imports no
 * declaration: it runs in the Node/jiti config context, where reaching a
 * composable would break `nuxt dev` before the app exists — the directory name
 * is all it needs, and the app resolves the declaration by that name.
 *
 * It also builds the two guards the framework does not give us:
 * route-name/path uniqueness (Nuxt warns at most, and never for hook-pushed
 * routes), and a dev restart when a scenario directory appears or leaves.
 */

import { basename, dirname } from "node:path";
import {
  createResolver,
  defineNuxtModule,
  extendPages,
  resolveFiles
} from "nuxt/kit";
import {
  SCENARIO_DECLARATION_GLOB,
  SCENARIO_ROUTE_META_KEY,
  SCOPE_SUFFIX_SEGMENT
} from "./runtime/scenario.constants";
import {
  countBy,
  endsWith,
  filter,
  forEach,
  join,
  keys,
  map,
  pickBy
} from "lodash-es";
import type { DiscoveredScenario } from "./module.types";
import type { NuxtPage } from "@nuxt/schema";

// -----------------------------------------------------------------------------

const MODULE_NAME = "scenarios";

/** Every duplicate in a list of route names or paths, as a readable clause. */
function duplicatesOf(values: string[]): string[] {
  return keys(pickBy(countBy(values), count => count > 1));
}

export default defineNuxtModule({
  meta: { name: MODULE_NAME, configKey: MODULE_NAME },

  async setup(_options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    const playground = resolve("./runtime/ScenarioPlayground.vue");

    const declarations = await resolveFiles(
      resolve("."),
      SCENARIO_DECLARATION_GLOB
    );

    const scenarios: DiscoveredScenario[] = map(declarations, file => ({
      route: basename(dirname(file)),
      file
    }));

    extendPages(pages => {
      forEach(scenarios, scenario =>
        pages.push({
          name: scenario.route,
          path: `/${scenario.route}${SCOPE_SUFFIX_SEGMENT}`,
          file: playground,
          meta: { [SCENARIO_ROUTE_META_KEY]: scenario.route }
        } satisfies NuxtPage)
      );
    });

    // Nuxt's own duplicate check runs before `pages:extend` and only warns, so
    // a scenario directory sharing a name with a page (`useAuth`) would ship
    // two silent router records over one url. Proven silent — hard-fail here.
    nuxt.hook("pages:resolved", pages => {
      const collisions = [
        ...duplicatesOf(
          map(filter(pages, "name"), page => page.name as string)
        ),
        ...duplicatesOf(map(pages, "path"))
      ];

      if (collisions.length)
        throw new Error(
          `[${MODULE_NAME}] route collision — ${join(collisions, ", ")}. A scenario directory's name is its route name AND its url segment, so it may not repeat another route.`
        );
    });

    // `modules/` sits outside `srcDir`, so a directory appearing or leaving is
    // not otherwise watched — and a new route can only be registered by
    // re-running the discovery above.
    nuxt.options.watch.push(resolve("."));
    nuxt.hook("builder:watch", (event, path) => {
      if (event === "add" || event === "unlink")
        if (endsWith(path, ".scenario.ts")) nuxt.callHook("restart");
    });
  }
});

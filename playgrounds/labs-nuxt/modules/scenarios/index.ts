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

import { readFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import {
  createResolver,
  defineNuxtModule,
  extendPages,
  resolveFiles
} from "nuxt/kit";
import {
  MODULE_PAGE_GLOB,
  SCENARIO_DECLARATION_GLOB,
  SCENARIO_ROUTE_META_KEY,
  SCOPE_SUFFIX_SEGMENT
} from "./runtime/scenario.constants";
import {
  countBy,
  endsWith,
  filter,
  forEach,
  get,
  join,
  keyBy,
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

/**
 * The route params a scenario declares, read from its source. The registrar runs
 * in the Node/jiti config context where the declaration cannot be imported (its
 * own imports may not resolve there), so this scans for the `params` array —
 * `params: ["oid"]` — which is a plain literal in every declaration. Absent, a
 * module has no id segment and its url is unchanged.
 */
function declaredParams(file: string): string[] {
  const match = readFileSync(file, "utf-8").match(/params\s*:\s*\[([^\]]*)\]/);
  if (!match) return [];
  return map([...match[1].matchAll(/["']([^"']+)["']/g)], hit => hit[1]);
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

    // A module that draws itself, addressed by the directory it sits in. One
    // page per directory, so a second is a declaration the build cannot honour.
    const ownPages = keyBy(
      await resolveFiles(resolve("."), MODULE_PAGE_GLOB),
      file => basename(dirname(file))
    );

    const scenarios: DiscoveredScenario[] = map(declarations, file => ({
      route: basename(dirname(file)),
      file,
      // A module may declare route PARAMS (`params: ["oid"]`) so its url carries
      // an id segment — `/useInvoice/:oid` — the same way `/order/:oid` does. We
      // read them from the declaration SOURCE, not by importing it: this runs in
      // the Node/jiti config context where the declaration's own imports may not
      // be reached (module.types docblock). The declaration files are plain
      // literals, so a scan for the `params` array is exact.
      params: declaredParams(file)
    }));

    extendPages(pages => {
      forEach(scenarios, scenario =>
        pages.push({
          name: scenario.route,
          // Declared params come first as `/:param` segments, then the scope
          // catch-all — so `/useInvoice/:oid`, and `/useInvoice/:oid/as/:actor`
          // both resolve, and a module with no params is unchanged.
          path: `/${scenario.route}${join(
            map(scenario.params, p => `/:${p}`),
            ""
          )}${SCOPE_SUFFIX_SEGMENT}`,
          // The module's own page wins; absent one, the shared playground draws
          // the declaration. Registration, url and nav entry are identical
          // either way — only the component differs.
          file: get(ownPages, scenario.route, playground),
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
        if (endsWith(path, ".scenario.ts") || endsWith(path, ".page.vue"))
          nuxt.callHook("restart");
    });
  }
});

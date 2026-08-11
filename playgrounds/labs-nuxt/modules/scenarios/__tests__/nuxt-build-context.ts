/**
 * @module scenarios/__tests__/nuxt-build-context
 * @description Drives the REAL registrar the way Nuxt does — as a module
 * invoked with a build context, then by replaying `pages:extend` and
 * `pages:resolved` in build order.
 *
 * Nothing here stands in for the registrar or its discovery: the options map
 * carries only the fields `@nuxt/kit` itself reads (`resolveFiles` walks
 * `ignore`/`ignorePrefix`, `defineNuxtModule` walks `_requiredModules`), so the
 * directory scan, the pushed routes and the guards are the shipped ones. The
 * hook bus is a two-line replay rather than `hookable`, which pnpm does not
 * expose to this package.
 */

import { nuxtCtx } from "nuxt/kit";
import scenariosModule from "..";
import { forEach, map } from "lodash-es";
import type { NuxtPage } from "@nuxt/schema";

// -----------------------------------------------------------------------------

type HookHandler = (...args: never[]) => unknown;

export type RegisteredRoutes = {
  /** The page list after `pages:extend`, exactly as the registrar left it. */
  pages: NuxtPage[];
  /** Replays `pages:resolved` — the guard lane. Rejects on a route collision. */
  resolve: () => Promise<void>;
};

/**
 * @param seed pages already in the table when the registrar runs — a
 * file-based page, or a second scenario, to put the guards under load.
 */
export async function registerScenarioRoutes(
  seed: NuxtPage[] = []
): Promise<RegisteredRoutes> {
  const handlers = new Map<string, HookHandler[]>();

  const nuxt = {
    options: {
      rootDir: process.cwd(),
      srcDir: `${process.cwd()}/app`,
      alias: {},
      ignore: [],
      ignoreOptions: {},
      ignorePrefix: "-",
      _layers: [],
      _requiredModules: {},
      build: { templates: [], transpile: [] },
      imports: { dirs: [], presets: [], imports: [] },
      typescript: { tsConfig: {}, hoist: [] },
      nitro: { imports: { dirs: [] } },
      runtimeConfig: { public: {} },
      dir: { pages: "pages" },
      components: [],
      modulesDir: [],
      modules: [],
      plugins: [],
      css: [],
      watch: [],
      experimental: {},
      dev: false
    },
    hook: (name: string, handler: HookHandler) => {
      handlers.set(name, [...(handlers.get(name) ?? []), handler]);
    },
    callHook: async (name: string, ...args: never[]) => {
      for (const handler of handlers.get(name) ?? []) await handler(...args);
    },
    vfs: {}
  };
  nuxt.hooks = {
    hook: nuxt.hook,
    callHook: nuxt.callHook,
    addHooks: (hooks: Record<string, HookHandler>) =>
      forEach(hooks, (handler, name) => nuxt.hook(name, handler))
  };

  nuxtCtx.set(nuxt, true);
  try {
    await scenariosModule({}, nuxt);
  } finally {
    nuxtCtx.unset();
  }

  const pages = map(seed, page => ({ ...page }));
  await nuxt.callHook("pages:extend", pages);

  return {
    pages,
    resolve: () => nuxt.callHook("pages:resolved", pages)
  };
}

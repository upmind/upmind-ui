// -----------------------------------------------------------------------------
/**
 * @module auth/nuxt
 * @description `@upmind-automation/auth/nuxt` — the thin per-package Nuxt
 * module of ADR 023 §9. It registers this package's `defineFeature`
 * contribution into `foundation`'s registries and does nothing else; the
 * organisms stay framework-core-agnostic so the Vite cart mounts the same code.
 *
 * It imports NOTHING from `./src`. This file is evaluated in Nuxt's node
 * project, and a single type import from the barrel pulls the whole Vue app
 * graph into a tsconfig that does not carry the app's compiler options.
 */
import { addPlugin, createResolver, defineNuxtModule } from "nuxt/kit";

const MODULE_NAME = "auth";

/** Mirrors `AuthFeatureOptions`; see `src/feature.ts` for the live contract. */
export type AuthModuleOptions = {
  /** Contribute this package's own route records. Default true. */
  routes?: boolean;
  /** Path those records mount under. Default `/auth`. */
  base?: string;
  /** Hand back to `?returnUrl=` once authenticated. Default false. */
  returnTarget?: boolean;
};

export default defineNuxtModule<AuthModuleOptions>({
  meta: { name: `@upmind-automation/${MODULE_NAME}`, configKey: MODULE_NAME },

  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    // The plugin reads the resolved options back off public runtime config, so
    // a host declares them once in `nuxt.config`'s `auth:` block. appConfig is
    // the wrong channel here: Nuxt types it from the host's own declaration, so
    // writing a partial back into it is a type error at the host, not here.
    const runtime: Record<string, unknown> = nuxt.options.runtimeConfig.public;
    runtime[MODULE_NAME] = { ...options };

    // Source-consumed (constraint 1): the package ships no dist, so Nuxt has to
    // transpile it rather than treat it as a pre-built external.
    nuxt.options.build.transpile.push("@upmind-automation/auth");

    addPlugin({ src: resolve("./src/nuxt/auth.plugin"), mode: "all" });
  }
});

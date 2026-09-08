// -----------------------------------------------------------------------------
/**
 * @module auth/nuxt
 * @description `@upmind-automation/auth/nuxt` — the thin per-package Nuxt
 * module of ADR 023 §9. It registers this package's `defineFeature`
 * contribution into `foundation`'s registries and does nothing else; the
 * organisms stay framework-core-agnostic so the Vite cart mounts the same code.
 */
import { addPlugin, createResolver, defineNuxtModule } from "nuxt/kit";
import type { AuthFeatureOptions } from "./src/feature";

const MODULE_NAME = "auth";

export type { AuthFeatureOptions };

export default defineNuxtModule<AuthFeatureOptions>({
  meta: { name: `@upmind-automation/${MODULE_NAME}`, configKey: MODULE_NAME },

  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    // The plugin reads its options from appConfig, so a host declares them once
    // in `nuxt.config`'s module block rather than in two places.
    nuxt.options.appConfig = nuxt.options.appConfig ?? {};
    nuxt.options.appConfig[MODULE_NAME] = { ...options };

    // Source-consumed (constraint 1): the package ships no dist, so Nuxt has to
    // transpile it rather than treat it as a pre-built external.
    nuxt.options.build.transpile.push("@upmind-automation/auth");

    addPlugin({ src: resolve("./src/nuxt/auth.plugin"), mode: "all" });
  }
});

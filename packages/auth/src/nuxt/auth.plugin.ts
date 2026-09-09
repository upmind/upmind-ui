/**
 * @module auth/nuxt/plugin
 * @description The runtime half of `@upmind-automation/auth/nuxt`: it registers
 * this package's `defineFeature` contribution into `foundation`'s registries.
 * The ONLY file in the package that touches Nuxt core (ADR 023 §9) — no
 * organism imports it, which is what keeps the same organisms usable from the
 * Vite cart.
 */
import { useFeatures } from "@upmind-automation/foundation";
import { defineAuthFeature } from "../feature";
import type { AuthFeatureOptions } from "../feature";
import { defineNuxtPlugin, useRuntimeConfig } from "#app";

/**
 * Runtime config is `unknown` at this boundary — it crosses a serialisation
 * step, so it is read field by field rather than asserted into shape.
 */
function readOptions(value: unknown): AuthFeatureOptions {
  if (typeof value !== "object" || value === null) return {};

  const options: AuthFeatureOptions = {};

  if ("routes" in value && typeof value.routes === "boolean") {
    options.routes = value.routes;
  }
  if ("base" in value && typeof value.base === "string") {
    options.base = value.base;
  }
  if ("returnTarget" in value && typeof value.returnTarget === "boolean") {
    options.returnTarget = value.returnTarget;
  }

  return options;
}

export default defineNuxtPlugin(() => {
  const options = readOptions(useRuntimeConfig().public.auth);
  const { register, install } = useFeatures();

  register(defineAuthFeature(options));
  install();
});

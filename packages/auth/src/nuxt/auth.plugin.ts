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
import { defineNuxtPlugin, useAppConfig } from "#app";

type AuthAppConfig = { auth?: AuthFeatureOptions };

export default defineNuxtPlugin(() => {
  const config: AuthAppConfig = useAppConfig();
  const options = config.auth ?? {};
  const { register, install } = useFeatures();

  register(defineAuthFeature(options));
  install();
});

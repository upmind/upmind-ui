// -----------------------------------------------------------------------------
/**
 * @module plugins/upmind.client
 * @description Boots the headless runtime the `@upmind-automation/auth` organisms need.
 */
import useUpmind from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import { defineNuxtPlugin, useRouter, useRuntimeConfig } from "#app";
import i18n from "~/portal/i18n";

export default defineNuxtPlugin(() => {
  const { public: config } = useRuntimeConfig();

  void useUpmind.init({
    allowedScopes: [AccessRoleTypes.CLIENT],
    debug: import.meta.dev,
    // No `platformUrl`: it sends every route to upmind.com when no brand resolves.
    pop: {
      name: config.API_NAME,
      apiUrl: config.API_URL,
      region: config.API_REGION
    },
    i18n: {
      instance: i18n,
      files: import.meta.glob<Record<string, string>>(
        "@upmind-automation/i18n/**/*-en.json",
        { import: "default" }
      )
    },
    router: {
      instance: useRouter(),
      guardRoutes: false
    },
    recaptcha: {
      siteKey: config.GOOGLE_RECAPTCHA_V3_SITE_KEY,
      enabled: config.GOOGLE_RECAPTCHA_V3_ENABLED !== "false"
    }
  });
});

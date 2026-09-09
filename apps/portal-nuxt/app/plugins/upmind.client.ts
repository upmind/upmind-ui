// -----------------------------------------------------------------------------
/**
 * @module plugins/upmind.client
 * @description The second host seam the `@upmind-automation/auth` organisms
 * need: a live headless runtime. They await `useActiveSession().isReady()` and
 * read the brand's own auth config, neither of which exists until `init` runs.
 *
 * It reaches `headless` directly, never `client-vue` (ADR 023 §3), so this app
 * gains no dependency on the package the strangler is removing. The portal's
 * own mocked screens are untouched: they read `~/portal/mock`, not this.
 */
import useUpmind from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import { defineNuxtPlugin, useRouter, useRuntimeConfig } from "#app";
import i18n from "~/portal/i18n";

export default defineNuxtPlugin(() => {
  const { public: config } = useRuntimeConfig();

  void useUpmind.init({
    allowedScopes: [AccessRoleTypes.CLIENT, AccessRoleTypes.GUEST],
    debug: import.meta.dev,
    // No `platformUrl`. It is headless's "brand unavailable, leave the site"
    // hop, and this app owns pages that must render with no brand resolved at
    // all — configuring it sends every route, mocked ones included, to
    // upmind.com the moment the host does not match a brand.
    pop: {
      name: config.API_NAME,
      apiUrl: config.API_URL,
      region: config.API_REGION
    },
    i18n: {
      instance: i18n,
      // This app keeps no locale pack of its own, so the authored English
      // source is the pack. In a dev build `headless` globs the same files; in
      // a production build this is the only source there is.
      files: import.meta.glob<Record<string, string>>(
        "@upmind-automation/i18n/**/*-en.json",
        { import: "default" }
      )
    },
    router: {
      // The auth routes are this app's own (`auth: { routes: false }`), so the
      // engine drives none of them; it is wired for the session redirects the
      // organisms trigger.
      instance: useRouter(),
      guardRoutes: false
    },
    recaptcha: {
      siteKey: config.GOOGLE_RECAPTCHA_V3_SITE_KEY,
      enabled: config.GOOGLE_RECAPTCHA_V3_ENABLED !== "false"
    }
  });
});

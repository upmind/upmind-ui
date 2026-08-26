import UpmindClient, {
  decorateRoutes,
  registerOverlayRoutes,
  useTheme
} from "@upmind-automation/client-vue";
import { AccessRoleTypes } from "@upmind-automation/types";
import { forEach } from "lodash-es";
import type { I18n } from "vue-i18n";
import type { Router } from "vue-router";
import { LABS_OVERLAYS, registerFunnels } from "~/funnels";

export default defineNuxtPlugin(async nuxtApp => {
  const runtimeConfig = useRuntimeConfig();
  const router = nuxtApp.$router as Router;

  // 0. Inject the overlay routes onto every eligible page before the engine
  //    guards the first navigation — a deep-linked `<route>--session` must resolve.
  registerOverlayRoutes(router, LABS_OVERLAYS);

  // 1. Initialize Upmind
  UpmindClient.init({
    debug: import.meta.dev,
    pop: {
      name: runtimeConfig.public.API_NAME,
      apiUrl: runtimeConfig.public.API_URL,
      region: runtimeConfig.public.API_REGION
    },
    allowedScopes: [
      AccessRoleTypes.STAFF,
      AccessRoleTypes.CLIENT,
      AccessRoleTypes.GUEST
    ],
    i18n: {
      instance: nuxtApp.$i18n as I18n,
      // Glob pattern adapted for relative path from this plugin
      files: import.meta.glob<Record<string, string>>(
        "../assets/locales/**/*.json",
        { import: "default" }
      )
    },
    router: {
      instance: router,
      registerFunnels,
      // The Nuxt middleware IS the guard here; `useRouting`'s own `beforeEach`
      // would run a second `guard()` per navigation against the same funnel
      // service, and the two race on its resolved flag.
      guardRoutes: false
    },
    recaptcha: {
      siteKey: runtimeConfig.public.GOOGLE_RECAPTCHA_V3_SITE_KEY,
      enabled: true
    },
    analytics: {
      enabled: false
    },
    icons: import.meta.glob("@icons/**/*.svg", {
      query: "?raw",
      eager: false,
      import: "default"
    }),
    animations: import.meta.glob("@animations/**/*.json", {
      query: "?url",
      eager: false,
      import: "default"
    })
  });

  // 2. Register Plugins
  forEach(UpmindClient.plugins, ({ plugin, options }) => {
    nuxtApp.vueApp.use(plugin, options);
  });

  // 3. Wait for Upmind to be ready before continuing
  await UpmindClient.isReady();

  // 4. Decorate all routes with brand-specific UI schemas
  decorateRoutes(router.getRoutes());

  // 5. Wait for theme to be ready (required now that we use individual layout
  //    components instead of the monolithic <Upm> which handled this internally).
  //    The variant is pinned: useTheme resolves `initial ?? brand.uiTheme.variant`,
  //    so without it a staging brand's own variant wins and the playground drifts
  //    off the ruled token colours.
  await useTheme("default").isReady();

  // 5. Scope devtools (dev only)
  if (import.meta.dev) {
    import("@upmind-automation/headless").then(
      ({ setupScopeDevtools, getRegistry }) => {
        setupScopeDevtools(nuxtApp.vueApp, getRegistry());
      }
    );
  }
});

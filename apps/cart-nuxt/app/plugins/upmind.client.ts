import { defineNuxtPlugin } from "#app";
import UpmindClient, {
  useTheme,
  decorateRoutes,
  registerOverlayRoutes
} from "@upmind-automation/client-vue";
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";
import { registerFunnels } from "~/funnels";
import { forEach } from "lodash-es";
import type { Router } from "vue-router";
import type { I18n } from "vue-i18n";

export default defineNuxtPlugin(async nuxtApp => {
  const runtimeConfig = useRuntimeConfig();
  const router = nuxtApp.$router as Router;

  // Client-side initialization
  // 1. Initialize Upmind
  UpmindClient.init({
    debug: import.meta.dev,
    pop: {
      name: runtimeConfig.public.API_NAME,
      apiUrl: runtimeConfig.public.API_URL,
      region: runtimeConfig.public.API_REGION
    },
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
      registerFunnels
    },
    recaptcha: {
      siteKey: runtimeConfig.public.GOOGLE_RECAPTCHA_V3_SITE_KEY,
      enabled: true
    },
    analytics: {
      enabled: true
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
  forEach(uiPlugins, ({ plugin, options }) => {
    nuxtApp.vueApp.use(plugin, options);
  });

  forEach(UpmindClient.plugins, ({ plugin, options }) => {
    nuxtApp.vueApp.use(plugin, options);
  });

  // 3. Wait for Upmind and theme to be ready before continuing
  await UpmindClient.isReady();

  // 4. Decorate all routes with brand-specific UI schemas
  // This is done once at initialization to avoid Vue Router meta mutation warnings
  decorateRoutes(router.getRoutes());

  // 5. Register overlay routes (auth, 2fa, verify-email) on eligible routes
  registerOverlayRoutes(router);

  // 6. Wait for theme to be ready so we dont have any flash of unstyled content
  const theme = runtimeConfig.public.THEME as string;
  await useTheme(theme).isReady();
});

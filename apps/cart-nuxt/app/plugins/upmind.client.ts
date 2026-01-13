import { defineNuxtPlugin } from "#app";
import UpmindClient, { useTheme } from "@upmind-automation/client-vue";
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";
import { registerFunnels } from "~/router/funnels";
import { forEach } from "lodash-es";
import type { Router } from "vue-router";
import type { I18n } from "vue-i18n";

export default defineNuxtPlugin(async nuxtApp => {
  const runtimeConfig = useRuntimeConfig();

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
      instance: nuxtApp.$router as Router,
      registerFunnels
    },
    recaptcha: {
      siteKey: runtimeConfig.public.GOOGLE_RECAPTCHA_V3_SITE_KEY,
      enabled: true
    },
    analytics: {
      enabled: true
    }
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

  const theme = runtimeConfig.public.THEME as string;
  await useTheme(theme).isReady();
});

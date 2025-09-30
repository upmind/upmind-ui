import "./main.css";

import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";

import UpmindClient from "@upmind-automation/client-vue";
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";
import { forEach } from "lodash-es";
// -----------------------------------------------------------------------------

const app = createApp(App);

// ---

UpmindClient.init({
  debug: true,
  pop: {
    name: import.meta.env.VITE_API_NAME,
    apiUrl: import.meta.env.VITE_API_URL,
    region: import.meta.env.VITE_API_REGION
  },
  i18n: {
    instance: i18n,
    files: import.meta.glob<Record<string, string>>(
      "@/assets/locales/**/*.json",
      { import: "default" }
    )
  },
  router: {
    instance: router,
    flows: []
  },
  recaptcha: {
    siteKey: import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY,
    enabled: true
  },
  analytics: {
    enabled: false
  }
});

// ---

app.use(router);
app.use(i18n);

forEach(uiPlugins, ({ plugin, options }) => {
  app.use(plugin, options);
});

forEach(UpmindClient.plugins, ({ plugin, options }) => {
  app.use(plugin, options);
});

app.mount("#app");

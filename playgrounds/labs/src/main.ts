import "./assets/main.css";

import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";

import UpmindClient from "@upmind-automation/client-vue";
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";
import { forEach } from "lodash-es";
import useUpmind from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const app = createApp(App);

// ---

UpmindClient.init({
  pop: {
    name: import.meta.env.VITE_API_NAME,
    apiUrl: import.meta.env.VITE_API_URL,
    region: import.meta.env.VITE_API_REGION,
  },
  debug: import.meta.env.DEV,
  i18n: {
    instance: i18n as any,
    files: import.meta.env.DEV
      ? import.meta.glob(`@/**/i18n/*-en.json`, { eager: true }) // 'en' only source messages
      : import.meta.glob("@/assets/locales/**/*.json", { eager: true }), // compiled messages
  },
  router: {
    enabled: false, // disable router by default, we will enable it later
    instance: router,
    flows: [],
  },
  analytics: {
    enabled: false,
  },
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

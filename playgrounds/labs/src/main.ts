import "./assets/main.css";

import { createApp } from "vue";

import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";

import Upmind from "@upmind-automation/client-vue";
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";

// -----------------------------------------------------------------------------

const app = createApp(App);

// ---

Upmind.init({
  app,
  pop: {
    name: import.meta.env.VITE_API_NAME,
    apiUrl: import.meta.env.VITE_API_URL,
    region: import.meta.env.VITE_API_REGION,
  },
  i18n: {
    provider: i18n,
    files: import.meta.env.DEV
      ? import.meta.glob(`@/**/i18n/*-en.json`, { eager: true }) // 'en' only source messages
      : import.meta.glob("@/assets/locales/**/*.json", { eager: true }), // compiled messages
  },
  router: {
    provider: router,
    flows: [],
  },
  analytics: {
    enabled: false,
  },
});

// ---

app.use(router);
app.use(i18n);
app.use(uiPlugins.lottie);

app.mount("#app");

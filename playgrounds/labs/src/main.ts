import "./main.css";
import { createApp } from "vue";
import UpmindClient from "@upmind-automation/client-vue";
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";
import App from "./App.vue";
import { registerFunnels } from "./funnels";
import i18n from "./i18n";
import router from "./router";
import { forEach } from "lodash-es";
// -----------------------------------------------------------------------------

const app = createApp(App);

// ---
UpmindClient.init({
  debug: import.meta.env.DEV,
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
    registerFunnels,
    guardRoutes: true
  },
  recaptcha: {
    siteKey: import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY,
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

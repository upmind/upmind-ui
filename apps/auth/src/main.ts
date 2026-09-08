import "./main.css";
import { createApp } from "vue";
import { registerIcons } from "@upmind-automation/foundation";
import useUpmind from "@upmind-automation/headless";
import { AccessRoleTypes } from "@upmind-automation/types";
import App from "./App.vue";
import i18n from "./i18n";
import router from "./router";

// The glyph resolver takes its asset pack before init, exactly as the cart's
// own client does — it is the same resolver, one layer lower now.
registerIcons(
  import.meta.glob("@icons/**/*.svg", {
    query: "?raw",
    eager: false,
    import: "default"
  })
);

void useUpmind.init({
  allowedScopes: [AccessRoleTypes.CLIENT, AccessRoleTypes.GUEST],
  debug: import.meta.env.VITE_ENABLE_DEVTOOLS === "true",
  testMode: import.meta.env.MODE === "test",
  platformUrl: "https://upmind.com",
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
    guardRoutes: false
  },
  recaptcha: {
    siteKey: import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY,
    enabled: import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_ENABLED !== "false"
  }
});

createApp(App).use(i18n).use(router).mount("#app");

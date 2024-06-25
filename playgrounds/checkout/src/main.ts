import "./assets/main.css";

import { createApp } from "vue";
import { createI18n } from "vue-i18n";

import upmind from "./plugins/upmind";

import App from "./App.vue";
import router from "./router";
import { getGlobalMessages } from "./utils";

const i18n = createI18n({
  // legacy: false, // you must set `false` to use Composition API
  // missingWarn: false,
  // fallbackWarn: false,
  locale: "en",
  fallbackLocale: "en",
  messages: getGlobalMessages(),
  // ---
  silentTranslationWarn: true,
  silentFallbackWarn: true,
});

const app = createApp(App);

app.use(router);
app.use(upmind);
app.use(i18n);

app.mount("#app");

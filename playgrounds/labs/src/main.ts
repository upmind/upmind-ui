import "./assets/main.css";

import { createApp } from "vue";
import { createI18n } from "vue-i18n";

import upmind from "./plugins/upmind";

import App from "./App.vue";
import router from "./router";
import { useI18nMessages } from "@upmind-automation/client-vue";

// ---------------------

const app = createApp(App);

// ---------------------
let files = {};
if (import.meta.env.DEV) {
  // files = import.meta.glob(`./**/i18n/*-en.json`, { eager: true });
  files = import.meta.glob(`@/**/i18n/*-en.json`, { eager: true });
} else {
  // files = import.meta.glob("./locales/**/*.json", { eager: true });
  files = import.meta.glob("@locales/**/*.json", { eager: true });
}

const { messages } = useI18nMessages(files);
const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages,
  // ---
  missingWarn: false,
  fallbackWarn: false,
  silentTranslationWarn: true,
  silentFallbackWarn: true,
});

// ---------------------

app.use(router);
app.use(upmind);
app.use(i18n);

app.mount("#app");

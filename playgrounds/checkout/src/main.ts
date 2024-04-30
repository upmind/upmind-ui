import "./assets/main.css";

import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import upmind from "./plugins/upmind";

import App from "./App.vue";
import router from "./router";

// ---
// this will loadd ALL Global locales from the project assets and map them correctly
// ---
import { reduce, last, merge } from "lodash-es";
const messages = reduce(
  import.meta.glob("@locales/**/*.json", { eager: true }),
  (result, value, key) => {
    const locale = last(key.split("/"))?.replace(".json", "");
    if (!locale) return result;
    merge(result, { [locale]: value?.default || {} });
    return result;
  },
  {}
);

const i18n = createI18n({
  // legacy: false, // you must set `false` to use Composition API
  locale: "en",
  fallbackLocale: "en",
  messages,
});

const app = createApp(App);

app.use(router);
app.use(upmind);
app.use(i18n);

app.mount("#app");

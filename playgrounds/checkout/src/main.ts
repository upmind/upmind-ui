import "./assets/main.css";

import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import * as Sentry from "@sentry/vue";

import upmind from "./plugins/upmind";

import App from "./App.vue";
import router from "./router";
import { getGlobalMessages } from "./utils";

// ---------------------

const app = createApp(App);

// ---------------------

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

// ---------------------

Sentry.init({
  environment: import.meta.env.MODE,
  app,
  dsn: import.meta.env.VITE_APP_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration({ router }),
    Sentry.replayIntegration(),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
  tracePropagationTargets: [
    "localhost",
    /^http:\/\/*.local/,
    /^https:\/\/upm-checkout-doteasy\.web\.app\.io/,
    /^https:\/\/checkout\.sprighost\.com/,
  ],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// ---------------------

app.use(router);
app.use(upmind);
app.use(i18n);

app.mount("#app");

import "./main.css";

import { createApp } from "vue";
import * as Sentry from "@sentry/vue";

import App from "./App.vue";
import router from "./router";
import i18n from "./i18n";

import UpmindClient from "@upmind-automation/client-vue";
import { useCustomFlows } from "./router/useCustomFlows";
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";

// --- utils
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
    instance: i18n as any,
    files: import.meta.env.DEV
      ? import.meta.glob(`@/**/i18n/*-en.json`, { eager: true }) // 'en' only source messages
      : import.meta.glob("@/assets/locales/**/*.json", { eager: true }) // compiled messages
  },
  router: {
    instance: router,
    flows: useCustomFlows
  },
  recaptcha: {
    siteKey: import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY,
    enabled: !import.meta.env.DEV
  },
  analytics: {
    enabled: true
  }
});

Sentry.init({
  environment: import.meta.env.MODE,
  app,
  dsn: import.meta.env.VITE_APP_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration({ router }),
    Sentry.replayIntegration({
      maskAllInputs: true,
      maskAllText: false,
      blockAllMedia: false,
      networkDetailAllowUrls: [/^https:\/\/api\.upmind\.io/]
    }),
    Sentry.thirdPartyErrorFilterIntegration({
      // Specify the application keys that you specified in the Sentry bundler plugin
      filterKeys: ["cart"],

      // Defines how to handle errors that contain third party stack frames.
      // Possible values are:
      // - 'drop-error-if-contains-third-party-frames'
      // - 'drop-error-if-exclusively-contains-third-party-frames'
      // - 'apply-tag-if-contains-third-party-frames'
      // - 'apply-tag-if-exclusively-contains-third-party-frames'
      behaviour: "drop-error-if-contains-third-party-frames"
    })
  ],

  enabled: import.meta.env.MODE === "production",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // replaysSessionSampleRate: 0.1,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0
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

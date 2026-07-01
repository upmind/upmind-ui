import "./main.css";
import * as Sentry from "@sentry/vue";
import { createApp } from "vue";
import { AccessRoleTypes } from "@upmind-automation/types";
import UpmindClient from "@upmind-automation/client-vue";
import { plugins as uiPlugins } from "@upmind-automation/upmind-ui";
import App from "./App.vue";
import i18n from "./i18n";
import router from "./router";
import { registerFunnels } from "./router/funnels";
import { forEach } from "lodash-es";
// -----------------------------------------------------------------------------

const app = createApp(App);

// ---
UpmindClient.init({
  allowedScopes: [AccessRoleTypes.CLIENT, AccessRoleTypes.GUEST],
  debug: import.meta.env.DEV,
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
    registerFunnels,
    guardRoutes: true
  },
  recaptcha: {
    siteKey: import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_SITE_KEY,
    // reCAPTCHA v3 scores automated browsers too low to clear registration, so
    // disable it in dev/test via env. Defaults on (var unset) for staging/prod.
    enabled: import.meta.env.VITE_APP_GOOGLE_RECAPTCHA_V3_ENABLED !== "false"
  },
  analytics: {
    enabled: true
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

  enabled: import.meta.env.PROD,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // replaysSessionSampleRate: 0.1,
  replaysSessionSampleRate: 0.5,
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

import * as Sentry from "@sentry/nuxt";
import { useRuntimeConfig } from "#imports";

export default defineNuxtPlugin(_nuxtApp => {
  const config = useRuntimeConfig();
  const router = useRouter();

  if (import.meta.client) {
    Sentry.init({
      environment: import.meta.dev ? "development" : "production",
      dsn: config.public.SENTRY_DSN as string,
      integrations: [
        Sentry.browserTracingIntegration({ router }),
        Sentry.replayIntegration({
          maskAllInputs: true,
          maskAllText: false,
          blockAllMedia: false,
          networkDetailAllowUrls: [/^https:\/\/api\.upmind\.io/]
        }),
        Sentry.thirdPartyErrorFilterIntegration({
          filterKeys: ["cart"],
          behaviour: "drop-error-if-contains-third-party-frames"
        })
      ],
      enabled: !import.meta.dev,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0
    });
  }
});

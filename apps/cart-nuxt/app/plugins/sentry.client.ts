import * as Sentry from "@sentry/vue";

export default defineNuxtPlugin(nuxtApp => {
  const config = useRuntimeConfig();
  const router = useRouter();

  if (import.meta.client) {
    Sentry.init({
      environment: import.meta.dev ? "development" : "production",
      app: nuxtApp.vueApp as any,
      dsn: config.public.SENTRY_DSN as string,
      integrations: [
        Sentry.browserTracingIntegration({ router: router as any }),
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

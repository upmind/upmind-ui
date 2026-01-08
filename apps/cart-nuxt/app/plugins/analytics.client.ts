/**
 * Analytics Plugin (Client-only)
 *
 * Tracks page views after each route navigation.
 * This replaces the router.afterEach logic from useRouting.ts
 */

export default defineNuxtPlugin(async () => {
  // Dynamic import to ensure window is available
  // This prevents the module from being evaluated during SSR
  const { useDataLayer } = await import("@upmind-automation/headless");

  const router = useRouter();
  const { dataLayer } = useDataLayer();

  router.afterEach((to, from) => {
    dataLayer({ event: "page_view" })
      .withPage({
        to,
        from
      })
      .push(false);
  });
});

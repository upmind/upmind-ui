import { useDataLayer } from "@upmind-automation/client-vue";
/**
 * Analytics Plugin (Client-only)
 *
 * Tracks page views after each route navigation.
 * This replaces the router.afterEach logic from useRouting.ts
 */

export default defineNuxtPlugin(async () => {
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

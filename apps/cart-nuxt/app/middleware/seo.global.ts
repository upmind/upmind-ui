import { useBrand } from "@upmind-automation/headless";
import { isString, get } from "lodash-es";

/**
 * Global SEO Middleware
 *
 * Sets dynamic SEO meta tags based on brand data from the API.
 * Runs after routing middleware (alphabetically: redirects → routing → seo).
 * Brand data is already available via the upmind plugin.
 *
 * Responsibilities:
 * - Set dynamic page title suffix from brand name
 * - Set favicon from brand data
 * - Set OpenGraph image from brand logo
 */
export default defineNuxtRouteMiddleware(() => {
  const { name, image, favicon } = useBrand();

  // Extract URL from IImage object or use string directly
  const faviconUrl = (() => {
    return favicon.value?.full_url ?? "/favicon.ico";
  })();

  const imageUrl = (() => {
    return image.value?.full_url ?? "";
  })();

  const siteName = name.value || "Upmind Cart";

  // Set dynamic head meta (title template, favicon)
  useHead({
    titleTemplate: pageTitle => {
      return pageTitle ? `${pageTitle} | ${siteName}` : siteName;
    },
    link: [
      {
        rel: "icon",
        type: "image/x-icon",
        href: faviconUrl
      }
    ]
  });

  // Set dynamic OpenGraph meta
  useSeoMeta({
    ogSiteName: siteName,
    ogImage: imageUrl,
    twitterImage: imageUrl
  });
});

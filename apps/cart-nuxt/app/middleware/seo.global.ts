import { useBrand } from "@upmind-automation/client-vue";

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
 * - Set html lang attribute from current language
 * - Set Organization schema from brand data
 */
export default defineNuxtRouteMiddleware(() => {
  const { name, image, favicon, language } = useBrand();

  const faviconUrl = favicon.value?.full_url ?? "/favicon.ico";
  const imageUrl = image.value?.full_url ?? "";
  const siteName = name.value || "Upmind Cart";
  const langCode = language.value?.code?.toLowerCase() || "en";

  // Set dynamic head meta (title template, favicon, language)
  useHead({
    htmlAttrs: {
      lang: langCode
    },
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
    ogLocale: langCode,
    twitterImage: imageUrl
  });

  // Schema.org: Organization from brand data
  useSchemaOrg([
    defineOrganization({
      name: siteName,
      logo: imageUrl || undefined
    })
  ]);
});

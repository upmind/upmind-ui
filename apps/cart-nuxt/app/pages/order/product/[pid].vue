<template>
  <UpmProductConfigure
    :storefront-route="storefrontRoute || { name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
    @seo="handleSeo"
  />
</template>

<script lang="ts" setup>
import { UpmProductConfigure, useBrand } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { storefrontRoute, name: brandName } = useBrand();

// Handle SEO data emitted from UpmProductConfigure
function handleSeo(seo: {
  title?: string;
  description?: string;
  image?: string;
}) {
  const title = seo.title || "Configure Product";
  const description =
    seo.description || "Configure your product options and add to cart.";
  const siteName = brandName.value || "Upmind Cart";

  debugger;
  useHead({ title });

  useSeoMeta({
    description,
    ogTitle: `${title} | ${siteName}`,
    ogDescription: description,
    ogImage: seo.image,
    twitterTitle: `${title} | ${siteName}`,
    twitterDescription: description,
    twitterImage: seo.image
  });
}

definePageMeta({
  name: ROUTE.PRODUCT_CONFIGURE
});
</script>

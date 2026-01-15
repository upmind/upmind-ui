<template>
  <UpmBasketProductEdit
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
    @seo="handleSeo"
  />
</template>

<script lang="ts" setup>
import { UpmBasketProductEdit, useBrand } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { name: brandName } = useBrand();

// Handle SEO data emitted from UpmBasketProductEdit
function handleSeo(seo: {
  title?: string;
  description?: string;
  image?: string;
}) {
  const title = seo.title || "Edit Cart Item";
  const description = seo.description || "Edit your cart item configuration.";
  const siteName = brandName.value || "Upmind Cart";

  useHead({ title });

  useSeoMeta({
    description,
    robots: "noindex, nofollow", // Cart content is user-specific
    ogTitle: `${title} | ${siteName}`,
    ogDescription: description
  });
}

definePageMeta({
  name: ROUTE.BASKET_PRODUCT_EDIT
});
</script>

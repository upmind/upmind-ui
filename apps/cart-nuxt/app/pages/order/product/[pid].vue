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
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { storefrontRoute, name: brandName } = useBrand();

// Handle SEO data emitted from UpmProductConfigure
function handleSeo(seo: {
  title?: string;
  description?: string;
  image?: string;
}) {
  const title = seo.title || t("seo.page_product_title");
  const description = seo.description || t("seo.page_product_description");
  const siteName = brandName.value || "Upmind Cart";

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

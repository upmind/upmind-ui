<template>
  <UpmCatalogue
    :category-route="{ name: ROUTE.CATALOGUE }"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmCatalogue } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Collection page with product listings
useHead({
  title: t("seo.page_shop_title")
});

useSeoMeta({
  description: t("seo.page_shop_description")
});

// Schema.org: CollectionPage for product catalogue
useSchemaOrg([
  defineWebPage({
    "@type": "CollectionPage",
    name: t("seo.page_shop_title"),
    description: t("seo.page_shop_description")
  })
]);

definePageMeta({
  name: ROUTE.CATALOGUE
});
</script>

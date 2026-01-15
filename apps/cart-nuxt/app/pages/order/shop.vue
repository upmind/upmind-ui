<template>
  <UpmCatalogue
    :category-route="{ name: ROUTE.CATALOGUE }"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
import { UpmCatalogue } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// SEO: Collection page with product listings
useHead({
  title: t("seo.page_shop_title")
});

useSeoMeta({
  description: t("seo.page_shop_description")
});

definePageMeta({
  name: ROUTE.CATALOGUE
});
</script>

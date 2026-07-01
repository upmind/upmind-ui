<template>
  <UpmProductRecommendations
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmProductRecommendations } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Product recommendations page
useHead({
  title: t("seo.page_product_recommendations_title")
});

useSeoMeta({
  description: t("seo.page_product_recommendations_description")
});

definePageMeta({
  name: ROUTE.PRODUCT_RECOMMENDATIONS
});
</script>

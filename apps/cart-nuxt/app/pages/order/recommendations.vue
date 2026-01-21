<template>
  <UpmRecommendations
    :layout="layout"
    :configure-route="{ name: ROUTE.PRODUCT_CONFIGURE }"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  UpmRecommendations,
  LAYOUT_VARIANTS
} from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const route = useRoute();

const layout = computed(() => {
  return route?.meta?.template as LAYOUT_VARIANTS;
});

// SEO: Recommendations page
useHead({
  title: t("seo.page_recommendations_title")
});

useSeoMeta({
  description: t("seo.page_recommendations_description")
});

definePageMeta({
  name: ROUTE.RECOMMENDATIONS
});
</script>

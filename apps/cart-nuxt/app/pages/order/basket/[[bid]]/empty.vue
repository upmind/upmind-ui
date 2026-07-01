<template>
  <UpmEmpty :storefront-route="storefrontRoute" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmEmpty } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Empty basket page - noindex
useHead({
  title: t("seo.page_basket_empty_title")
});

useSeoMeta({
  description: t("seo.page_basket_empty_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET_EMPTY
});
const { storefrontRoute } = useStorefrontRoute();
</script>

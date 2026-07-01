<template>
  <UpmProductNotFound :storefront-route="storefrontRoute" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmProductNotFound } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Product not found - noindex
useHead({
  title: t("seo.page_product_not_found_title")
});

useSeoMeta({
  description: t("seo.page_product_not_found_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.PRODUCT_NOT_FOUND
});
const { storefrontRoute } = useStorefrontRoute();
</script>

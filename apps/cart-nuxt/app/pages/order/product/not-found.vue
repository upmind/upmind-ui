<template>
  <UpmProductNotFound :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
import { UpmProductNotFound } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

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
</script>

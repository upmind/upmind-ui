<template>
  <UpmProductRequiresAction :storefront-route="storefrontRoute" />
</template>

<script lang="ts" setup>
import { UpmProductRequiresAction } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// SEO: Requires action page - noindex
useHead({
  title: t("seo.page_basket_requires_action_title")
});

useSeoMeta({
  description: t("seo.page_basket_requires_action_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET_PRODUCT_REQUIRES_ACTION
});
const { storefrontRoute } = useStorefrontRoute();
</script>

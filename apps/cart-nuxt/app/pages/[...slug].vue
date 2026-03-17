<template>
  <UpmError :storefront-route="storefrontRoute" />
</template>

<script lang="ts" setup>
import { UpmError } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useStorefrontRoute } from "~/composables/useStorefrontRoute";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// SEO: 404 Error page - noindex
useHead({
  title: t("seo.page_error_title")
});

useSeoMeta({
  description: t("seo.page_error_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.ERROR,
  allowOverlays: false
});
const { storefrontRoute } = useStorefrontRoute();
</script>

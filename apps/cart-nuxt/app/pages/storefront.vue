<!--
  Storefront Route Handler

  This page handles the /storefront route which can resolve to:
  - External storefront URL (brand's main website)
  - Internal catalogue page
  - Basket page (fallback)

  The actual redirect logic is handled by the redirects middleware.
  This page exists to satisfy Nuxt's file-based routing.
-->
<template>
  <UpmLoading />
</template>

<script lang="ts" setup>
import { UpmLoading } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// SEO: Storefront page - noindex (redirect handler)
useHead({
  title: t("seo.page_storefront_title")
});

useSeoMeta({
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.STOREFRONT
});
</script>

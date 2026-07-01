<template>
  <UpmLoading />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmLoading } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Domain processing page - noindex (transitional)
useHead({
  title: t("seo.page_domains_processing_title")
});

useSeoMeta({
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING
});
</script>

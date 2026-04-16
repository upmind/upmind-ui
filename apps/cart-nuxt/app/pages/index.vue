<template>
  <UpmLoading />
</template>

<script lang="ts" setup>
import { UpmLoading } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// SEO: Loading page - noindex (transitional)
useHead({
  title: t("seo.page_loading_title")
});

useSeoMeta({
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.LOADING,
  allowOverlays: false,
  replace: true
});
</script>

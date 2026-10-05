<template>
  <UpmLoading />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { ROUTE } from "../funnels/types";
import UpmLoading from "../shell/modules/system/Loading.vue";

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

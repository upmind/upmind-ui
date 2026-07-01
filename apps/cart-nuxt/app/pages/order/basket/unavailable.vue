<template>
  <UpmBasketUnavailable />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmBasketUnavailable } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();

// SEO: Basket unavailable page - noindex
useHead({
  title: t("seo.page_basket_unavailable_title")
});

useSeoMeta({
  description: t("seo.page_basket_unavailable_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET_UNAVAILABLE
});
</script>

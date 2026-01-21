<template>
  <UpmOrder :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>

<script lang="ts" setup>
import { UpmOrder } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// SEO: Order confirmation page - noindex
useHead({
  title: t("seo.page_order_title")
});

useSeoMeta({
  description: t("seo.page_order_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.ORDER
});
</script>

<template>
  <UpmBilling />
</template>

<script lang="ts" setup>
import { UpmBilling } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// SEO: Billing page - noindex
useHead({
  title: t("seo.page_billing_title")
});

useSeoMeta({
  description: t("seo.page_billing_description"),
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BILLING
});
</script>

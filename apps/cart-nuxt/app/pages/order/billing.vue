<template>
  <UpmBilling v-slot="{ template }">
    <component :is="BILLING_TEMPLATES[template]" />
  </UpmBilling>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmBilling } from "@upmind-automation/basket";
import { ROUTE } from "../../funnels/types";
import { BILLING_TEMPLATES } from "../../shell/modules/billing/shell";

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
  name: ROUTE.BILLING,
  actionEmptyBasket: true
});
</script>

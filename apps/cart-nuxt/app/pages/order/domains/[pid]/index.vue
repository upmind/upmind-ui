<template>
  <UpmDac @resolve="doResolve" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmDac, useRoutingEngine } from "@upmind-automation/client-vue";
import { first } from "lodash-es";
import { ROUTE } from "~/funnels/types";

const { t } = useI18n();
const { navigateNext } = useRoutingEngine();

function doResolve(value?: string[]) {
  const primaryDomain = first(value);
  navigateNext({ domain: primaryDomain });
}

// SEO: Domain search with product context
useHead({
  title: t("seo.page_domains_product_title")
});

useSeoMeta({
  description: t("seo.page_domains_product_description")
});

definePageMeta({
  name: ROUTE.DOMAINS_WITH_PRODUCT
});
</script>

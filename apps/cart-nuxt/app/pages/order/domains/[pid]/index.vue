<template>
  <UpmDac v-slot="{ template }" @resolve="doResolve">
    <component :is="domainTemplate(template)" />
  </UpmDac>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { UpmDac } from "@upmind-automation/domain";
import { useRoutingEngine } from "@upmind-automation/headless";
import { ROUTE } from "../../../../funnels/types";
import { domainTemplate } from "../../../../shell/modules/domain/shell";
import { first } from "lodash-es";

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

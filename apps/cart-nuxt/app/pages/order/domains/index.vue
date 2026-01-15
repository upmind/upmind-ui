<template>
  <UpmDac @resolve="doResolve" />
</template>

<script lang="ts" setup>
import { UpmDac, useRoutingEngine } from "@upmind-automation/client-vue";
import { first } from "lodash-es";
import { ROUTE } from "~/funnels/types";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const { navigateNext } = useRoutingEngine();

function doResolve(value?: string[]) {
  const primaryDomain = first(value);
  navigateNext({ domain: primaryDomain });
}

// SEO: Domain search page
useHead({
  title: t("seo.page_domains_title")
});

useSeoMeta({
  description: t("seo.page_domains_description")
});

definePageMeta({
  name: ROUTE.DOMAINS
});
</script>

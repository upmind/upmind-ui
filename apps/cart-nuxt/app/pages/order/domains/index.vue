<template>
  <UpmDac :tlds="tlds" v-slot="{ template }" @resolve="doResolve">
    <component :is="domainTemplate(template)" />
  </UpmDac>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { UpmDac } from "@upmind-automation/domain";
import { useQueryParams, useRoutingEngine } from "@upmind-automation/headless";
import { ROUTE } from "../../../funnels/types";
import { domainTemplate } from "../../../shell/modules/domain/shell";
import { first } from "lodash-es";

const { t } = useI18n();
const route = useRoute();
const { navigateNext } = useRoutingEngine();

const { tlds } = useQueryParams(route);

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

// Schema.org: SearchResultsPage for domain search
useSchemaOrg([
  defineWebPage({
    "@type": "SearchResultsPage",
    name: t("seo.page_domains_title"),
    description: t("seo.page_domains_description")
  })
]);

definePageMeta({
  name: ROUTE.DOMAINS
});
</script>

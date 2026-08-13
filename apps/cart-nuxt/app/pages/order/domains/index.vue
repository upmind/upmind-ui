<template>
  <UpmDac :tlds="tlds" @resolve="doResolve" />
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import {
  UpmDac,
  useQueryParams,
  useRoutingEngine
} from "@upmind-automation/client-vue";
import { first } from "lodash-es";
import { ROUTE } from "~/funnels/types";

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

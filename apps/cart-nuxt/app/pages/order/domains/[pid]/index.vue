<template>
  <UpmDac @resolve="doResolve" />
</template>

<script lang="ts" setup>
import { UpmDac, useRoutingEngine } from "@upmind-automation/client-vue";
import { first } from "lodash-es";
import { ROUTE } from "~/funnels/types";

const { navigateNext } = useRoutingEngine();

function doResolve(value?: string[]) {
  const primaryDomain = first(value);
  navigateNext({ domain: primaryDomain });
}

// SEO: Domain search with product context
useHead({
  title: "Choose a Domain"
});

useSeoMeta({
  description: "Search and select a domain for your product."
});

definePageMeta({
  name: ROUTE.DOMAINS_WITH_PRODUCT
});
</script>

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

// SEO: Domain search page
useHead({
  title: "Domain Search"
});

useSeoMeta({
  description: "Search and register your perfect domain name."
});

definePageMeta({
  name: ROUTE.DOMAINS
});
</script>

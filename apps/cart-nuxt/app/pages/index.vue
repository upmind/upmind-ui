<!--
  Index/Loading Route
  This is the initial loading page shown while the app bootstraps.
  Transitional route - should not be indexed by search engines.
-->
<template>
  <UpmLoading v-if="meta.isResolved" />
</template>

<script lang="ts" setup>
import { UpmLoading, useRoutingEngine } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

const { meta } = useRoutingEngine();

// SEO: Exclude transitional page from search engine indexing
useHead({
  title: "Loading..."
});

useSeoMeta({
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.LOADING
});
</script>

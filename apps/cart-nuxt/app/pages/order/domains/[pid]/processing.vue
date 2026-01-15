<template>
  <UpmLoading />
</template>

<script lang="ts" setup>
import { UpmLoading } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Domain processing page - noindex (transitional)
useHead({
  title: "Processing..."
});

useSeoMeta({
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING
});
</script>

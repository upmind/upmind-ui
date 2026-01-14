<template>
  <UpmLoading />
</template>

<script lang="ts" setup>
// --- components
import { UpmLoading } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.DOMAINS_WITH_PRODUCT_PROCESSING
});
</script>

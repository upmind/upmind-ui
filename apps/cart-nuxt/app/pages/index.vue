<template>
  <UpmLoading v-if="meta.isResolved" />
</template>

<script lang="ts" setup>
// --- components
import { UpmLoading, useRoutingEngine } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

// -----------------------------------------------------------------------------
const { meta } = useRoutingEngine();

definePageMeta({
  name: ROUTE.LOADING
});
</script>

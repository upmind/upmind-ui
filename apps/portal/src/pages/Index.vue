<template>
  <UpmLoading v-if="meta.isResolved" />
</template>
<script lang="ts" setup>
// --- components
import { UpmLoading, useRoutingEngine } from "@upmind-automation/client-vue";
// -----------------------------------------------------------------------------
const { meta } = useRoutingEngine();
//await isResolved();
</script>

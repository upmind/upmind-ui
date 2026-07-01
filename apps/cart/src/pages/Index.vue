<template>
  <UpmLoading :open="meta.isResolved" />
</template>
<script lang="ts" setup>
import { UpmLoading, useRoutingEngine } from "@upmind-automation/client-vue";
// -----------------------------------------------------------------------------
const { meta } = useRoutingEngine();
</script>

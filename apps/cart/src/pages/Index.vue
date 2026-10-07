<template>
  <UpmLoading :open="meta.isResolved" />
</template>
<script lang="ts" setup>
import { useRoutingEngine } from "@upmind-automation/headless";
import UpmLoading from "../shell/modules/system/Loading.vue";
// -----------------------------------------------------------------------------
const { meta } = useRoutingEngine();
</script>

<template>
  <UpmError :status="404" :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>
<script lang="ts" setup>
// --- components
import { UpmError } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "../router";
// -----------------------------------------------------------------------------
</script>

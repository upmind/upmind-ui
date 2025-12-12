<template>
  <UpmProductNotFound :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>
<script lang="ts" setup>
// --- components
import {
  UpmProductNotFound,
  useRoutingEngine
} from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "../../router";

// -----------------------------------------------------------------------------
</script>

<template>
  <UpmSessionLogout :storefront-route="{ name: ROUTE.STOREFRONT }" />
</template>
<script lang="ts" setup>
// --- components
import {
  UpmSessionLogout,
  useRoutingEngine
} from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "../../router";
// -----------------------------------------------------------------------------
</script>

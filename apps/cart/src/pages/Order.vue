<template>
  <UpmOrder :storefront-route="storefrontRoute" />
</template>

<script lang="ts" setup>
// --- components
import { UpmOrder } from "@upmind-automation/client-vue";

// --- internal
import { useStorefrontRoute } from "../composables/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

<template>
  <UpmEmpty :storefront-route="storefrontRoute" />
</template>
<script lang="ts" setup>
// --- components
import { UpmEmpty } from "@upmind-automation/client-vue";

// --- internal
import { useStorefrontRoute } from "../router/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

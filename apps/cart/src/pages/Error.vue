<template>
  <UpmError :status="404" :storefront-route="storefrontRoute" />
</template>
<script lang="ts" setup>
// --- components
import { UpmError } from "@upmind-automation/client-vue";

// --- internal
import { useStorefrontRoute } from "../composables/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

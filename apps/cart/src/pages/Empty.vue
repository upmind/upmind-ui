<template>
  <UpmEmpty :storefront-route="storefrontRoute" />
</template>
<script lang="ts" setup>
import { UpmEmpty } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "../router/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

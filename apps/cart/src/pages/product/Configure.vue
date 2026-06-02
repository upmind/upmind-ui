<template>
  <UpmProductConfigure
    :storefront-route="storefrontRoute"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>
<script lang="ts" setup>
// --- components
import { UpmProductConfigure } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "../../router";
import { useStorefrontRoute } from "../../router/useStorefrontRoute";

// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

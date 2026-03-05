<template>
  <UpmProductConfigure
    :storefront-route="storefrontRoute"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>
<script lang="ts" setup>
// --- components
import { UpmProductConfigure, useBrand } from "@upmind-automation/client-vue";

// --- types
import { ROUTE } from "../../router"
import { useStorefrontRoute } from "../../composables/useStorefrontRoute";

const { storefrontRoute } = useBrand();
const { storefrontRoute } = useStorefrontRoute();
</script>

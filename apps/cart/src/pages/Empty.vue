<template>
  <UpmEmpty :storefront-route="storefrontRoute" />
</template>
<script lang="ts" setup>
import { useStorefrontRoute } from "../router/useStorefrontRoute";
import UpmEmpty from "../shell/modules/system/Empty.vue";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

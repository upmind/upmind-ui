<template>
  <UpmError :status="404" :storefront-route="storefrontRoute" />
</template>
<script lang="ts" setup>
import { useStorefrontRoute } from "../router/useStorefrontRoute";
import UpmError from "../shell/modules/system/Error.vue";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

<template>
  <UpmError :status="404" :storefront-route="storefrontRoute" />
</template>
<script lang="ts" setup>
import { UpmError } from "@upmind-automation/client-vue";
import { useStorefrontRoute } from "../router/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

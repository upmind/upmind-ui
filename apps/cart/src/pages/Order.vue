<template>
  <UpmOrder
    :storefront-route="storefrontRoute"
    :register-route="{ name: ROUTE.SESSION_REGISTER }"
  />
</template>

<script lang="ts" setup>
import { UpmOrder } from "@upmind-automation/client-vue";
import { ROUTE } from "../router";
import { useStorefrontRoute } from "../router/useStorefrontRoute";
// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

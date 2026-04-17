<template>
  <UpmCheckout
    :storefront-route="storefrontRoute"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
    :billing-route="{ name: ROUTE.BILLING }"
  />
</template>

<script lang="ts" setup>
// --- internal
import { ROUTE } from "../router";
import { useStorefrontRoute } from "../router/useStorefrontRoute";

// --- components
import { UpmCheckout } from "@upmind-automation/client-vue";
const { storefrontRoute } = useStorefrontRoute();
</script>

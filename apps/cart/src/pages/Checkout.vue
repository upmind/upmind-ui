<template>
  <UpmCheckout
    :storefront-route="storefrontRoute"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
    :billing-route="{ name: ROUTE.BILLING }"
  />
</template>

<script lang="ts" setup>
import { UpmCheckout } from "@upmind-automation/client-vue";
import { ROUTE } from "../router";
import { useStorefrontRoute } from "../router/useStorefrontRoute";

// --- components
const { storefrontRoute } = useStorefrontRoute();
</script>

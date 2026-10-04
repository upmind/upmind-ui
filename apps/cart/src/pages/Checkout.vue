<template>
  <UpmCheckout
    :storefront-route="storefrontRoute"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
    :billing-route="{ name: ROUTE.BILLING }"
    v-slot="{ template }"
  >
    <component :is="CHECKOUT_TEMPLATES[template]" />
  </UpmCheckout>
</template>

<script lang="ts" setup>
import { UpmCheckout } from "@upmind-automation/basket";
import { CHECKOUT_TEMPLATES } from "@upmind-automation/client-vue";
import { ROUTE } from "../router";
import { useStorefrontRoute } from "../router/useStorefrontRoute";

// --- components
const { storefrontRoute } = useStorefrontRoute();
</script>

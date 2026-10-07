<template>
  <UpmCheckout
    :storefront-route="storefrontRoute"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
    :fields-route="{ name: ROUTE.BASKET }"
    :billing-route="{ name: ROUTE.BILLING }"
    v-slot="{ template }"
  >
    <component :is="checkoutTemplate(template)" />
  </UpmCheckout>
</template>

<script lang="ts" setup>
import { UpmCheckout } from "@upmind-automation/basket";
import { ROUTE } from "../router";
import { useStorefrontRoute } from "../router/useStorefrontRoute";
import { checkoutTemplate } from "../shell/modules/checkout/shell";

// --- components
const { storefrontRoute } = useStorefrontRoute();
</script>

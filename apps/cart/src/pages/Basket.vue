<template>
  <UpmBasket
    :storefront-route="storefrontRoute"
    :basket-route="{ name: ROUTE.BASKET }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
  />
</template>

<script lang="ts" setup>
// --- components
import { UpmBasket } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "../router";
import { useStorefrontRoute } from "../router/useStorefrontRoute";

// -----------------------------------------------------------------------------
const { storefrontRoute } = useStorefrontRoute();
</script>

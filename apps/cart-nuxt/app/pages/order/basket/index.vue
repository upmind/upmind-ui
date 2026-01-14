<template>
  <UpmBasket
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :basket-route="{ name: ROUTE.BASKET }"
    :edit-route="{ name: ROUTE.BASKET_PRODUCT_EDIT }"
  />
</template>

<script lang="ts" setup>
// --- components
import { UpmBasket } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/router/types";

definePageMeta({
  name: ROUTE.BASKET
});
</script>

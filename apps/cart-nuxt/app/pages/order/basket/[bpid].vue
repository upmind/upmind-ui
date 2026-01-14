<template>
  <UpmBasketProductEdit
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>

<script lang="ts" setup>
// --- components
import { UpmBasketProductEdit } from "@upmind-automation/client-vue";

// --- internal
import { ROUTE } from "~/funnels/types";

definePageMeta({
  name: ROUTE.BASKET_PRODUCT_EDIT
});
</script>

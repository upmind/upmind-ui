<template>
  <UpmBasketProductEdit
    :storefront-route="{ name: ROUTE.STOREFRONT }"
    :catalogue-route="{ name: ROUTE.CATALOGUE }"
  />
</template>

<script lang="ts" setup>
import { UpmBasketProductEdit } from "@upmind-automation/client-vue";
import { ROUTE } from "~/funnels/types";

// SEO: Basket product edit page - noindex (user-specific cart content)
useHead({
  title: "Edit Cart Item"
});

useSeoMeta({
  description: "Edit your cart item configuration.",
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.BASKET_PRODUCT_EDIT
});
</script>

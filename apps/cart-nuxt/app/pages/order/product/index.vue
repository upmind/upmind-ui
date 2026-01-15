<template>
  <NuxtPage />
</template>

<script lang="ts" setup>
/**
 * Product Layout
 * Parent route for all product-related pages.
 */
import { ROUTE } from "~/funnels/types";

definePageMeta({
  name: ROUTE.PRODUCT
});
</script>

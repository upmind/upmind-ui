<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script lang="ts" setup>
/**
 * Product Layout
 *
 * Parent route for all product-related pages.
 */
import { ROUTE } from "~/utils/routes";

definePageMeta({
  name: ROUTE.PRODUCT
});
</script>

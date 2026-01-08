<template>
  <div>
    <h1>Product Catalogue</h1>
    <!-- Catalogue listing will be integrated here -->
  </div>
</template>

<script lang="ts" setup>
/**
 * Catalogue Page
 *
 * Displays the product catalogue/shop.
 */
import { ROUTE } from "~/utils/routes";

definePageMeta({
  name: ROUTE.CATALOGUE
});
</script>

<template>
  <div>
    <h1>Your Basket</h1>
    <!-- Basket component will be integrated here -->
    <p>Template: {{ template }}</p>
  </div>
</template>

<script lang="ts" setup>
/**
 * Basket Page
 *
 * Displays the shopping basket contents.
 * Uses the template from route meta for layout configuration.
 */
import { ROUTE } from "~/utils/routes";

definePageMeta({
  name: ROUTE.BASKET
});

const route = useRoute();
const template = computed(() => route.meta?.template || "two-column-ltr");
</script>

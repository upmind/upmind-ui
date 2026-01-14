<template>
  <NuxtPage />
</template>

<script lang="ts" setup>
/**
 * Session Layout
 *
 * Parent route for all session/auth related pages.
 */
import { ROUTE } from "~/funnels/types";

definePageMeta({
  name: ROUTE.SESSION
});
</script>

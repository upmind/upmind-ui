<template>
  <NuxtPage />
</template>

<script lang="ts" setup>
/**
 * Session Layout
 * Parent route for all session/auth related pages.
 * Transitional layout - should not be indexed.
 */
import { ROUTE } from "~/funnels/types";
useSeoMeta({
  robots: "noindex, nofollow"
});

definePageMeta({
  name: ROUTE.SESSION,
  // The session pages ARE the auth surface — never layer the auth overlay here.
  allowOverlays: false
});
</script>

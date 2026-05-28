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
  // Inherited by all child auth routes (SESSION_LOGIN, SESSION_REGISTER, etc.)
  // via Vue Router meta inheritance. No need to set it on each child page.
  allowOverlays: false
});
</script>

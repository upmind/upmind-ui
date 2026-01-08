<template>
  <div>
    <NuxtPage />
  </div>
</template>

<script lang="ts" setup>
/**
 * Session Layout
 *
 * Parent route for all session/auth related pages.
 */
import { ROUTE } from "~/utils/routes";

definePageMeta({
  name: ROUTE.SESSION
});
</script>

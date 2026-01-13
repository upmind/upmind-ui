<template>
  <NuxtLayout>
    <!-- Page transition loading -->
    <UpmLoading v-if="isLoading" :modal="true" />
    <NuxtPage />
  </NuxtLayout>
</template>

<script lang="ts" setup>
/**
 * Root App Component
 *
 * Uses UpmLoading for page transitions.
 * App initialization is handled by the upmind plugin.
 */
import { UpmLoading } from "@upmind-automation/client-vue";

const { isLoading } = useLoadingIndicator();
</script>

<template>
  <NuxtLayout>
    <!-- Page transition loading -->
    <UpmLoading v-if="isLoading" />
    <NuxtPage v-show="!isLoading" />
  </NuxtLayout>
</template>

<script lang="ts" setup>
/**
 * Root App Component
 *
 * Uses UpmLoading for page transitions.
 * App initialization is handled by the upmind plugin.
 *
 * On mount, we remove the SPA loading template since Vue is now
 * controlling the loading state.
 */
import { UpmLoading } from "@upmind-automation/client-vue";

const { isLoading } = useLoadingIndicator();

// Remove SPA template once Vue is in control
onMounted(() => {
  document.getElementById("__nuxt-loading")?.remove();
});
</script>

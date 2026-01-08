<template>
  <div
    v-if="!$upmind.isReady.value"
    class="h-screen w-screen flex items-center justify-center bg-canvas text-base font-sans"
  >
    <div class="flex flex-col items-center gap-4">
      <div
        class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"
      ></div>
      <p>Initializing Upmind...</p>
    </div>
  </div>
  <NuxtLayout v-else>
    <NuxtPage />
  </NuxtLayout>
</template>

<script lang="ts" setup>
/**
 * Root App Component
 *
 * Handles early initialization and global loading state.
 */
const { $upmind } = useNuxtApp();
</script>

<template>
  <NuxtLayout>
    <div
      v-if="!$upmind.isReady.value"
      class="bg-canvas flex h-screen w-screen items-center justify-center font-sans text-base"
    >
      <div class="flex flex-col items-center gap-4">
        <div
          class="border-primary h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
        ></div>
        <p>Initializing Upmind...</p>
      </div>
    </div>
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

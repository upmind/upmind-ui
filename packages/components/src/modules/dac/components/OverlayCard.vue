<template>
  <div
    class="absolute left-1/2 top-1/2 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
  >
    <div
      class="border-lm-contrast/10 dark:border-dm-contrast/10 mx-2 rounded-lg border bg-auto px-8 py-10 text-center shadow-lg sm:mx-auto"
    >
      <!-- Icon -->
      <p class="text-auto-25 inline-block h-10 w-10">
        <slot name="icon">
          <InformationCircleIcon />
        </slot>
      </p>
      <!-- Title -->
      <p class="text-auto"><slot name="title" /></p>
      <!-- Subtitle -->
      <p class="text-auto-50 text-sm">
        <slot name="subtitle" />
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { InformationCircleIcon } from "@heroicons/vue/24/outline";
</script>

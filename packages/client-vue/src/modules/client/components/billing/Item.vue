<template>
  <div class="flex w-full flex-col gap-y-2">
    <header class="flex w-full items-start justify-between">
      <h3
        class="m-0 flex items-center gap-x-2 text-sm font-semibold leading-none"
      >
        {{ title }}
        <Badge v-if="isDefault" variant="flat" size="xs" label="Default" />
      </h3>

      <Link
        label="Edit"
        size="xs"
        variant="muted"
        tabindex="-1"
        @mousedown.stop.prevent
        class="h-4"
      />
    </header>

    <p class="text-emphasis-medium m-0 text-sm leading-none">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
// --- components
import { Link, Badge } from "@upmind-automation/upmind-ui";

defineProps<{
  title: string;
  description: string;
  isDefault: boolean;
}>();
</script>

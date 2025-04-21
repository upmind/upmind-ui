<template>
  <div class="flex flex-col gap-y-1">
    <h3 class="m-0 text-sm font-semibold leading-none">{{ address.title }}</h3>
    <p class="text-emphasis-medium m-0 text-sm leading-none">
      {{ address.description }}
    </p>
  </div>
</template>

<script setup lang="ts">
// --- components
import { Link, Icon } from "@upmind-automation/upmind-ui";

// --- types
import type { Address } from "@upmind-automation/headless-vue";

defineProps<{
  address: Address;
}>();
</script>

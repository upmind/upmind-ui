<template>
  <header class="flex w-full items-center justify-between space-x-2">
    <h5 class="text-primary text-left text-sm leading-tight no-underline">
      {{ gateway.name }}
    </h5>

    <img
      v-if="!hasImgError"
      :src="`/gateways/${gateway_id}.png`"
      :alt="gateway.name"
      class="m-0 h-6 md:h-7"
      @error="hasImgError = true"
    />
  </header>
</template>

<script lang="ts" setup>
// --- external
import { ref } from "vue";

// --- props
defineProps<{
  gateway: {
    name: string;
  };
  gateway_id: string;
}>();

const hasImgError = ref(false);
</script>

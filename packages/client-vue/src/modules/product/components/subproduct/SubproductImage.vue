<template>
  <figure
    v-if="src"
    class="flex h-6 min-h-6 w-6 min-w-6 shrink-0 items-center justify-start"
  >
    <img
      :src="src"
      :alt="alt"
      class="inline-block h-5 min-h-5 w-5 min-w-5 object-cover object-center"
    />
  </figure>
</template>

<script lang="ts" setup>
// --- types
import type { SubproductCardImage } from "./types";

defineProps<SubproductCardImage>();
</script>

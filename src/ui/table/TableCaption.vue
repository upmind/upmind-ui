<script setup lang="ts">
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <caption :class="cn('text-muted mt-4 text-sm', props.class)">
    <slot />
  </caption>
</template>

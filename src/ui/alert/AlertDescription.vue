<script lang="ts" setup>
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <p :class="cn('text-sm [&_p]:leading-relaxed flex items-baseline justify-between gap-2 flex-wrap', props.class)">
    <slot />
  </p>
</template>

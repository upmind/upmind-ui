<script lang="ts" setup>
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <p :class="cn('text-sm [&_p]:leading-relaxed', props.class)">
    <slot />
  </p>
</template>

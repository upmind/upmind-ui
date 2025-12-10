<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <p :class="cn('text-sm [&_p]:leading-relaxed', props.class)">
    <slot />
  </p>
</template>

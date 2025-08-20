<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <h5 :class="cn('font-medium tracking-tight', props.class)">
    <slot />
  </h5>
</template>

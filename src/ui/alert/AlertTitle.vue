<script lang="ts" setup>
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <h5 :class="cn('font-medium', props.class)">
    <slot />
  </h5>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <h5 :class="cn('font-medium', props.class)" data-testid="alert-title">
    <slot />
  </h5>
</template>

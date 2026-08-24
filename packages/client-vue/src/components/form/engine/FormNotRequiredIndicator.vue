<template>
  <span
    :class="cn('text-muted font-normal', props.class)"
    :for="props.formItemId"
  >
    <slot>{{ props.text }}</slot>
  </span>
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import type { HTMLAttributes } from "vue";

const props = withDefaults(
  defineProps<{
    text?: string;
    formItemId: string;
    class?: HTMLAttributes["class"];
  }>(),
  {
    text: "Optional"
  }
);
</script>

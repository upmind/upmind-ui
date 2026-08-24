<template>
  <span :class="cn('text-danger', props.class)" :for="props.formItemId">
    <slot>{{ props.text }}</slot>
  </span>
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import type { HTMLAttributes } from "vue";

const props = withDefaults(
  defineProps<{
    formItemId: string;
    class?: HTMLAttributes["class"];
    text?: string;
  }>(),
  {
    text: "*"
  }
);
</script>

<template>
  <span
    :class="cn('text-muted font-normal', props.class)"
    :for="props.formItemId"
    :invalid="false"
  >
    <slot>{{ props.text }}</slot>
  </span>
</template>

<script lang="ts" setup>
import { cn } from "../../utils";
import type { LabelProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

const props = withDefaults(
  defineProps<
    LabelProps & {
      text?: string;
      formItemId: string;
      class?: HTMLAttributes["class"];
    }
  >(),
  {
    text: "Optional"
  }
);
</script>

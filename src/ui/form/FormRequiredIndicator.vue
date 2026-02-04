<template>
  <span
    :class="cn('text-danger-default', props.class)"
    :for="props.formItemId"
    :invalid="true"
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
      formItemId: string;
      class?: HTMLAttributes["class"];
      text?: string;
    }
  >(),
  {
    text: "*"
  }
);
</script>

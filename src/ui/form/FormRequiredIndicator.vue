<template>
  <span
    :class="cn('text-muted text-error', props.class)"
    :for="props.formItemId"
    :invalid="true"
  >
    <slot>{{ props.text }}</slot>
  </span>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

import type { LabelProps } from "radix-vue";

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

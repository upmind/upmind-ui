<template>
  <span
    :class="cn('text-text-muted font-normal', props.class)"
    :for="props.formItemId"
    :invalid="false"
  >
    <slot>Optional</slot>
  </span>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

import type { LabelProps } from "radix-vue";

const props = defineProps<
  LabelProps & {
    formItemId: string;
    class?: HTMLAttributes["class"];
  }
>();
</script>

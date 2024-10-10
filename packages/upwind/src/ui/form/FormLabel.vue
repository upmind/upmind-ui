<template>
  <Label
    :class="cn('w-full', props.invalid && 'text-control-error', props.class)"
    :for="props.formItemId"
  >
    <slot />
  </Label>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

import type { LabelProps } from "radix-vue";
import { Label } from "../label";

const props = defineProps<
  LabelProps & {
    formItemId: string;
    invalid?: boolean;
    class?: HTMLAttributes["class"];
  }
>();
</script>

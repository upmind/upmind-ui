<template>
  <Label :class="cn('w-full text-sm', props.class)" :for="props.formItemId">
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
    class?: HTMLAttributes["class"];
  }
>();
</script>

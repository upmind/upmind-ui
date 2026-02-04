<template>
  <Label :class="cn('w-full text-sm', props.class)" :for="props.formItemId">
    <slot />
  </Label>
</template>

<script lang="ts" setup>
import { Label } from "../label";
import { cn } from "../../utils";
import type { LabelProps } from "radix-vue";
import type { HTMLAttributes } from "vue";

const props = defineProps<
  LabelProps & {
    formItemId: string;
    class?: HTMLAttributes["class"];
  }
>();
</script>

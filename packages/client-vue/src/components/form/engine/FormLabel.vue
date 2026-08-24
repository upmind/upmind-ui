<template>
  <Label :class="cn('w-full text-sm', props.class)" :for="props.formItemId">
    <slot />
  </Label>
</template>

<script lang="ts" setup>
import { Label, cn } from "@upmind/ui";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  formItemId: string;
  class?: HTMLAttributes["class"];
}>();
</script>

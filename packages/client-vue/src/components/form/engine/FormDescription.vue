<template>
  <p
    :id="formDescriptionId"
    :class="cn('text-muted w-full text-sm font-normal', props.class)"
  >
    <slot />
  </p>
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  formDescriptionId: string;
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <p
    :id="formDescriptionId"
    :class="cn('w-full text-sm text-muted-foreground', props.class)"
  >
    <slot />
  </p>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  formDescriptionId: string;
  class?: HTMLAttributes["class"];
}>();
</script>

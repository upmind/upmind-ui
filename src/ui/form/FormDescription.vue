<template>
  <p
    :id="formDescriptionId"
    :class="cn('text-muted-foreground w-full text-sm', props.class)"
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

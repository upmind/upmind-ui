<script setup lang="ts">
import { NumberFieldInput } from "radix-vue";
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <NumberFieldInput
    data-slot="input"
    :class="
      cn(
        'focus-visible:ring-ring border-input bg-background ring-offset-background placeholder:text-muted-foreground flex h-10 w-full rounded-lg border py-2 text-center text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
        props.class
      )
    "
  />
</template>

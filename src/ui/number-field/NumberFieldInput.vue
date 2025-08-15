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
        'focus-visible:ring-ring flex h-10 w-full rounded-lg border border-input bg-background py-2 text-center text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        props.class
      )
    "
  />
</template>

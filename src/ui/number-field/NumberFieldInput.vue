<script setup lang="ts">
import { NumberFieldInput } from "radix-vue";
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";
import { ringClasses } from "../../assets/styles";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <NumberFieldInput
    data-slot="input"
    :class="
      cn(
        'border-input bg-background placeholder:text-muted-foreground flex h-10 w-full rounded-lg border py-2 text-center text-sm',
        props.class
      )
    "
  />
</template>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div
    :class="
      cn(
        'has-data-[slot=decrement]:data-[slot=input]:*:pl-5 has-data-[slot=increment]:data-[slot=input]:*:pr-5 relative',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

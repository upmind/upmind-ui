<script setup lang="ts">
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <tr
    :class="
      cn(
        'border-control-default hover:bg-accent-neutral/20 data-[state=selected]:bg-accent-neutral/20 border-b transition-colors',
        props.class
      )
    "
  >
    <slot />
  </tr>
</template>

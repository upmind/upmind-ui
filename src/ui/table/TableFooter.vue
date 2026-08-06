<script setup lang="ts">
import { cn } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <tfoot
    :class="
      cn(
        'border-control-default bg-accent-neutral/20 border-t font-medium [&>tr]:last:border-b-0',
        props.class
      )
    "
  >
    <slot />
  </tfoot>
</template>

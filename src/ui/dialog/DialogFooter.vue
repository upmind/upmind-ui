<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{ class?: HTMLAttributes["class"] }>();
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col-reverse items-baseline sm:flex-row sm:justify-end sm:gap-x-2',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>

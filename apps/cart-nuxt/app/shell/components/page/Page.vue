<template>
  <div
    :class="
      cn(
        'bg-canvas relative flex min-h-screen w-full flex-col items-center gap-0 text-base antialiased',
        props.class
      )
    "
  >
    <div
      class="relative flex min-h-screen w-full flex-col items-center has-[.layout-fit]:min-h-0 has-[.layout-fit]:grow"
    >
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>

<script lang="ts" setup>
import { cn } from "@upmind/ui";
import type { HTMLAttributes } from "vue";

// -----------------------------------------------------------------------------
// Static layout classes (no variants) — token utilities inline, no useStyles.
const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

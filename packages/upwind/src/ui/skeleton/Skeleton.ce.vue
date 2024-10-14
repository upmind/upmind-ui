<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

interface SkeletonProps {
  class?: HTMLAttributes["class"];
}

const props = defineProps<SkeletonProps>();
</script>

<template>
  <div
    :class="
      cn(
        'w-auto animate-pulse rounded-md bg-slate-100 dark:bg-slate-800',
        props.class
      )
    "
  >
    <div class="w-auto select-none opacity-0"><slot>Skeleton</slot></div>
  </div>
</template>

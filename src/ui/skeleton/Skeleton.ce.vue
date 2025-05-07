<script setup lang="ts">
import { cn } from "../../utils";
import type { SkeletonProps } from "./types";

const props = defineProps<SkeletonProps>();
</script>

<template>
  <div
    :class="
      cn('bg-base-muted muted w-auto animate-pulse rounded-lg', props.class)
    "
  >
    <div class="w-auto select-none opacity-0"><slot>Skeleton</slot></div>
  </div>
</template>

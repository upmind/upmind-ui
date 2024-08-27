<script setup lang="ts">
import { TooltipTrigger, type TooltipTriggerProps } from "radix-vue";

const props = defineProps<TooltipTriggerProps>();
</script>

<template>
  <tooltip-trigger v-bind="props">
    <slot />
  </tooltip-trigger>
</template>

<script lang="ts" setup>
import { TooltipProvider, type TooltipProviderProps } from "radix-vue";

const props = defineProps<TooltipProviderProps>();
</script>

<template>
  <TooltipProvider v-bind="props">
    <slot />
  </TooltipProvider>
</template>

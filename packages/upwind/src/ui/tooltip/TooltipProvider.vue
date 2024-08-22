<script setup lang="ts">
import { TooltipProvider, type TooltipProviderProps } from "radix-vue";

const props = defineProps<TooltipProviderProps>();
</script>

<template>
  <tooltip-provider v-bind="props">
    <slot />
  </tooltip-provider>
</template>

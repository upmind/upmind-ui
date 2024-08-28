<script setup lang="ts">
import { TooltipProvider } from "radix-vue";
</script>

<template>
  <tooltip-provider>
    <slot />
  </tooltip-provider>
</template>

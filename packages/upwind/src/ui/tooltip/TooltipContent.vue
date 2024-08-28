<script setup lang="ts">
import { TooltipContent } from "radix-vue";
</script>

<template>
  <tooltip-portal>
    <tooltip-content :class="props.class">
      <slot />
    </tooltip-content>
  </tooltip-portal>
</template>

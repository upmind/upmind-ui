<template>
  <TooltipTrigger
    v-bind="props"
    :as="'button'"
    size="auto"
    variant="link"
    click.prevent
  >
    <span class="contents">
      <slot />
    </span>
  </TooltipTrigger>
</template>

<script lang="ts" setup>
import { TooltipTrigger, type TooltipTriggerProps } from "radix-vue";

const props = defineProps<TooltipTriggerProps>();
</script>

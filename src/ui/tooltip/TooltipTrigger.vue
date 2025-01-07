<script lang="ts" setup>
import { TooltipTrigger, type TooltipTriggerProps } from "radix-vue";

const props = defineProps<TooltipTriggerProps>();
import { Button } from "../button";
</script>

<template>
  <TooltipTrigger
    v-bind="props"
    :as="Button"
    size="auto"
    variant="link"
    click.prevent
  >
    <slot />
  </TooltipTrigger>
</template>

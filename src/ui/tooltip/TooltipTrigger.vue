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

<script lang="ts" setup>
import { TooltipTrigger, type TooltipTriggerProps } from "radix-vue";
import { Button } from "../button";

const props = defineProps<TooltipTriggerProps>();
</script>

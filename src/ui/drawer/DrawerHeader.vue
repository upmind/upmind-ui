<script lang="ts" setup>
import { cn } from "../../utils";
import type { HtmlHTMLAttributes } from "vue";

const props = defineProps<{
  class?: HtmlHTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn('grid gap-1.5 pb-4 text-left', props.class)">
    <slot />
  </div>
</template>

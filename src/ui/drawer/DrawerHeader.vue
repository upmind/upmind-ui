<script lang="ts" setup>
import type { HtmlHTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HtmlHTMLAttributes["class"];
}>();
</script>

<template>
  <div :class="cn('grid gap-1.5 py-4 text-center sm:text-left', props.class)">
    <slot />
  </div>
</template>

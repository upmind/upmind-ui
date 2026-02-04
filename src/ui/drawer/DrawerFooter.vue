<script lang="ts" setup>
import { cn } from "../../utils";
import type { HtmlHTMLAttributes } from "vue";

const props = defineProps<{
  class?: HtmlHTMLAttributes["class"];
}>();
</script>

<template>
  <div
    :class="cn('mt-auto flex flex-col gap-2 pt-4', props.class)"
    data-testid="drawer-footer"
  >
    <slot />
  </div>
</template>

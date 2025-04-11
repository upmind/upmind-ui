<script lang="ts" setup>
import type { HtmlHTMLAttributes } from "vue";
import { cn } from "../../utils";

const props = defineProps<{
  class?: HtmlHTMLAttributes["class"];
}>();
</script>

<template>
  <div
    :class="cn('mt-auto flex flex-col gap-2 py-4', props.class)"
    data-testid="drawer-footer"
  >
    <slot />
  </div>
</template>

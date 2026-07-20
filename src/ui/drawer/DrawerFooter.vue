<script lang="ts" setup>
import { cn, useTestAttrs } from "../../utils";
import type { HtmlHTMLAttributes } from "vue";

const testAttrs = useTestAttrs({
  key: "drawer-footer"
});

const props = defineProps<{
  class?: HtmlHTMLAttributes["class"];
}>();
</script>

<template>
  <div
    :class="cn('mt-auto flex flex-col gap-2 pt-4', props.class)"
    v-bind="testAttrs"
  >
    <slot />
  </div>
</template>

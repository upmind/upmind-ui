<script lang="ts" setup>
import { cn, useTestAttrs } from "../../utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
}>();

const testAttrs = useTestAttrs({
  key: "badge",
  dataAttrs: props.dataAttrs
});
</script>

<template>
  <div :class="cn(props.class)" v-bind="testAttrs">
    <slot />
  </div>
</template>

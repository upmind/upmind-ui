<script lang="ts" setup>
import {
  ContextMenuSeparator,
  type ContextMenuSeparatorProps
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";

const props = defineProps<
  ContextMenuSeparatorProps & {
    class?: HTMLAttributes["class"];
  }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <ContextMenuSeparator
    v-bind="delegatedProps"
    :class="cn('bg-accent-neutral/20 -mx-1 my-1 h-px', props.class)"
  />
</template>

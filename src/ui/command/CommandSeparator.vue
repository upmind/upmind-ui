<script lang="ts" setup>
import { ComboboxSeparator } from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";
import type { ComboboxSeparatorProps } from "radix-vue";

const props = defineProps<
  ComboboxSeparatorProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <ComboboxSeparator
    v-bind="delegatedProps"
    :class="cn('bg-border -mx-1 h-px', props.class)"
  >
    <slot />
  </ComboboxSeparator>
</template>

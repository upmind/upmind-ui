<script lang="ts" setup>
import { type HTMLAttributes, computed } from "vue";
import type { ComboboxItemEmits, ComboboxItemProps } from "radix-vue";
import { ComboboxItem, useForwardPropsEmits } from "radix-vue";
import { cn } from "../../utils";

const props = defineProps<
  ComboboxItemProps & { class?: HTMLAttributes["class"]; dataSelected?: string }
>();
const emits = defineEmits<ComboboxItemEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxItem
    v-bind="forwarded"
    :class="
      cn(
        'data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex cursor-default items-center rounded-xs px-4 py-2 text-sm outline-hidden select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        props.class
      )
    "
    :data-selected="props.dataSelected"
  >
    <slot />
  </ComboboxItem>
</template>
